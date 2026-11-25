-- =========================================================
-- MSN — schéma de base de données (Supabase / Postgres)
-- À coller dans Supabase > SQL Editor > Run (une seule fois)
-- =========================================================

-- ---------- Types ----------
create type role_utilisateur as enum ('influenceur', 'business', 'admin');
create type statut_compte    as enum ('en_attente', 'valide', 'refuse');
create type statut_offre     as enum ('brouillon', 'publiee', 'fermee');
create type statut_candidature as enum ('en_attente', 'acceptee', 'refusee');

-- ---------- Profils (1 par compte) ----------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        role_utilisateur not null,
  statut      statut_compte    not null default 'en_attente',
  nom         text not null,
  email       text not null,
  ville       text,
  instagram   text,
  bio         text,
  created_at  timestamptz not null default now()
);

-- Infos spécifiques influenceur
create table public.influenceurs (
  id        uuid primary key references public.profiles(id) on delete cascade,
  niche     text,             -- food, lifestyle, beauté, sport, humour…
  abonnes   integer check (abonnes is null or abonnes >= 0)
);

-- Infos spécifiques business
create table public.businesses (
  id         uuid primary key references public.profiles(id) on delete cascade,
  categorie  text,            -- restaurant, beauté, sport, mode…
  site_web   text
);

-- ---------- Offres ----------
create table public.offres (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  titre        text not null,
  description  text,
  niche        text,
  ville        text,
  budget       text,          -- texte libre : « 500 MAD », « repas offert »…
  statut       statut_offre not null default 'brouillon',
  created_at   timestamptz not null default now()
);

-- ---------- Candidatures ----------
create table public.candidatures (
  id              uuid primary key default gen_random_uuid(),
  offre_id        uuid not null references public.offres(id) on delete cascade,
  influenceur_id  uuid not null references public.influenceurs(id) on delete cascade,
  message         text,
  statut          statut_candidature not null default 'en_attente',
  created_at      timestamptz not null default now(),
  unique (offre_id, influenceur_id)       -- anti-doublon : 1 candidature par offre
);

create index on public.offres (statut, created_at desc);
create index on public.candidatures (offre_id);
create index on public.candidatures (influenceur_id);

-- =========================================================
-- Fonctions d'aide (utilisées par la sécurité)
-- =========================================================
create or replace function public.mon_role() returns role_utilisateur
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.est_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.est_valide() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select statut = 'valide' from public.profiles where id = auth.uid()), false)
$$;

-- =========================================================
-- Création automatique du profil à l'inscription
-- (les infos viennent du formulaire d'inscription)
-- =========================================================
create or replace function public.creer_profil() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r role_utilisateur;
begin
  -- on n'accepte que influenceur / business à l'inscription (jamais admin)
  r := case when new.raw_user_meta_data->>'role' = 'business'
            then 'business'::role_utilisateur
            else 'influenceur'::role_utilisateur end;

  insert into public.profiles (id, role, nom, email, ville, instagram)
  values (
    new.id, r,
    coalesce(nullif(new.raw_user_meta_data->>'nom', ''), split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'ville',
    new.raw_user_meta_data->>'instagram'
  );

  if r = 'influenceur' then
    insert into public.influenceurs (id, niche, abonnes)
    values (new.id,
            new.raw_user_meta_data->>'niche',
            nullif(regexp_replace(coalesce(new.raw_user_meta_data->>'abonnes', ''), '\D', '', 'g'), '')::integer);
  else
    insert into public.businesses (id, categorie)
    values (new.id, new.raw_user_meta_data->>'categorie');
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.creer_profil();

-- Un utilisateur ne peut pas changer lui-même son rôle ni son statut
create or replace function public.proteger_profil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() est vide quand c'est toi dans le SQL Editor (ou le serveur) : pas de blocage
  if auth.uid() is not null and not public.est_admin() then
    new.role   := old.role;
    new.statut := old.statut;
  end if;
  return new;
end $$;

create trigger profil_protege
  before update on public.profiles
  for each row execute function public.proteger_profil();

-- =========================================================
-- Sécurité (Row Level Security)
-- =========================================================
alter table public.profiles     enable row level security;
alter table public.influenceurs enable row level security;
alter table public.businesses   enable row level security;
alter table public.offres       enable row level security;
alter table public.candidatures enable row level security;

-- ---- profiles ----
-- je vois mon profil ; les comptes validés voient les autres comptes validés ; l'admin voit tout
create policy "profiles lecture" on public.profiles for select using (
  id = auth.uid()
  or public.est_admin()
  or (public.est_valide() and statut = 'valide')
);
create policy "profiles maj perso" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles maj admin" on public.profiles for update
  using (public.est_admin());

-- ---- influenceurs / businesses ----
create policy "influenceurs lecture" on public.influenceurs for select using (
  id = auth.uid() or public.est_admin()
  or (public.est_valide() and exists (select 1 from public.profiles p where p.id = influenceurs.id and p.statut = 'valide'))
);
create policy "influenceurs maj perso" on public.influenceurs for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy "businesses lecture" on public.businesses for select using (
  id = auth.uid() or public.est_admin()
  or (public.est_valide() and exists (select 1 from public.profiles p where p.id = businesses.id and p.statut = 'valide'))
);
create policy "businesses maj perso" on public.businesses for update
  using (id = auth.uid()) with check (id = auth.uid());

-- ---- offres ----
-- offres publiées visibles par les comptes validés ; un business voit toutes les siennes
create policy "offres lecture" on public.offres for select using (
  business_id = auth.uid()
  or public.est_admin()
  or (public.est_valide() and statut = 'publiee')
);
create policy "offres creation" on public.offres for insert with check (
  business_id = auth.uid() and public.mon_role() = 'business' and public.est_valide()
);
create policy "offres maj" on public.offres for update
  using (business_id = auth.uid()) with check (business_id = auth.uid());
create policy "offres suppression" on public.offres for delete
  using (business_id = auth.uid());

-- ---- candidatures ----
create policy "candidatures lecture" on public.candidatures for select using (
  influenceur_id = auth.uid()
  or public.est_admin()
  or exists (select 1 from public.offres o where o.id = candidatures.offre_id and o.business_id = auth.uid())
);
-- un influenceur validé postule à une offre publiée, toujours en « en_attente »
create policy "candidatures creation" on public.candidatures for insert with check (
  influenceur_id = auth.uid()
  and public.mon_role() = 'influenceur'
  and public.est_valide()
  and statut = 'en_attente'
  and exists (select 1 from public.offres o where o.id = offre_id and o.statut = 'publiee')
);
-- le business propriétaire de l'offre accepte / refuse
create policy "candidatures decision" on public.candidatures for update using (
  exists (select 1 from public.offres o where o.id = candidatures.offre_id and o.business_id = auth.uid())
);
-- l'influenceur peut retirer sa candidature tant qu'elle est en attente
create policy "candidatures retrait" on public.candidatures for delete using (
  influenceur_id = auth.uid() and statut = 'en_attente'
);

-- Le business ne peut modifier QUE le statut d'une candidature
create or replace function public.proteger_candidature() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.est_admin() then
    new.offre_id       := old.offre_id;
    new.influenceur_id := old.influenceur_id;
    new.message        := old.message;
    new.created_at     := old.created_at;
  end if;
  return new;
end $$;

create trigger candidature_protegee
  before update on public.candidatures
  for each row execute function public.proteger_candidature();

-- =========================================================
-- Confidentialité des emails
-- Les emails ne sont PAS lisibles par les autres utilisateurs.
-- Seuls l'admin et le système de notifications y ont accès (fonction ci-dessous).
-- =========================================================
revoke select, update on public.profiles from anon, authenticated;
grant select (id, role, statut, nom, ville, instagram, bio, created_at) on public.profiles to authenticated;
grant update (nom, ville, instagram, bio, statut) on public.profiles to authenticated;

-- Renvoie l'email d'un utilisateur si j'y ai droit :
-- moi-même, l'admin, ou les deux parties d'une candidature (business <-> influenceur)
create or replace function public.email_de(uid uuid) returns text
language sql stable security definer set search_path = public as $$
  select p.email from public.profiles p
  where p.id = uid
    and (
      uid = auth.uid()
      or public.est_admin()
      or exists (
        select 1 from public.candidatures c join public.offres o on o.id = c.offre_id
        where c.influenceur_id = uid and o.business_id = auth.uid()
      )
      or exists (
        select 1 from public.candidatures c join public.offres o on o.id = c.offre_id
        where o.business_id = uid and c.influenceur_id = auth.uid()
      )
    )
$$;

-- =========================================================
-- Pour te mettre ADMIN (à lancer après avoir créé ton compte) :
--   update public.profiles set role = 'admin', statut = 'valide'
--   where email = 'TON_EMAIL';
-- =========================================================
