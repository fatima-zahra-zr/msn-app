-- =========================================================
-- MSN — migration « Prêt pour la bêta »
-- À coller dans Supabase > SQL Editor > Run (une seule fois, APRÈS 0001)
-- =========================================================

-- ---------- 1. WhatsApp + photo de profil ----------
alter table public.profiles add column if not exists whatsapp  text;
alter table public.profiles add column if not exists photo_url text;

-- la photo est visible ; le WhatsApp NON (il ne se lit que via whatsapp_de)
grant select (photo_url) on public.profiles to authenticated;
grant update (whatsapp, photo_url) on public.profiles to authenticated;

-- Le numéro WhatsApp n'est donné qu'à soi-même, à l'admin,
-- ou aux deux parties d'une candidature ACCEPTÉE
create or replace function public.whatsapp_de(uid uuid) returns text
language sql stable security definer set search_path = public as $$
  select p.whatsapp from public.profiles p
  where p.id = uid
    and (
      uid = auth.uid()
      or public.est_admin()
      or exists (
        select 1 from public.candidatures c join public.offres o on o.id = c.offre_id
        where c.statut = 'acceptee'
          and ((c.influenceur_id = uid and o.business_id = auth.uid())
            or (o.business_id = uid and c.influenceur_id = auth.uid()))
      )
    )
$$;

-- l'inscription enregistre aussi le WhatsApp
create or replace function public.creer_profil() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r role_utilisateur;
begin
  r := case when new.raw_user_meta_data->>'role' = 'business'
            then 'business'::role_utilisateur
            else 'influenceur'::role_utilisateur end;

  insert into public.profiles (id, role, nom, email, ville, instagram, whatsapp)
  values (
    new.id, r,
    coalesce(nullif(new.raw_user_meta_data->>'nom', ''), split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'ville',
    new.raw_user_meta_data->>'instagram',
    nullif(new.raw_user_meta_data->>'whatsapp', '')
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

-- ---------- 2. L'admin peut gérer les offres et candidatures d'un commerce ----------
drop policy if exists "offres creation" on public.offres;
create policy "offres creation" on public.offres for insert with check (
  (business_id = auth.uid() and public.mon_role() = 'business' and public.est_valide())
  or public.est_admin()
);
drop policy if exists "offres maj" on public.offres;
create policy "offres maj" on public.offres for update
  using (business_id = auth.uid() or public.est_admin())
  with check (business_id = auth.uid() or public.est_admin());
drop policy if exists "offres suppression" on public.offres;
create policy "offres suppression" on public.offres for delete
  using (business_id = auth.uid() or public.est_admin());

drop policy if exists "candidatures decision" on public.candidatures;
create policy "candidatures decision" on public.candidatures for update using (
  public.est_admin()
  or exists (select 1 from public.offres o where o.id = candidatures.offre_id and o.business_id = auth.uid())
);

-- ---------- 3. Stockage des photos (bucket public « avatars ») ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 4194304, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- chacun ne dépose / remplace / supprime que dans SON dossier : avatars/<son id>/...
drop policy if exists "avatars depot perso" on storage.objects;
create policy "avatars depot perso" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars maj perso" on storage.objects;
create policy "avatars maj perso" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars suppression perso" on storage.objects;
create policy "avatars suppression perso" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
