import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'fs'

const db = new PGlite()
// toutes les migrations passées en argument, dans l'ordre
const migrations = process.argv.slice(2).map((f) => readFileSync(f, 'utf8'))

// --- stub minimal de Supabase (schéma auth + rôle authenticated) ---
await db.exec(`
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.uid', true), '')::uuid $$;
  create role authenticated;
  create role anon;
  -- stub du stockage Supabase (bucket + fichiers)
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as
    $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  grant usage on schema storage to authenticated;
  grant all on storage.objects to authenticated;
  grant usage on schema auth to authenticated;
  grant execute on function auth.uid() to authenticated;
  -- comme Supabase : les nouvelles tables/fonctions sont accessibles au rôle authenticated
  grant usage on schema public to authenticated;
  alter default privileges in schema public grant all on tables to authenticated;
  alter default privileges in schema public grant all on functions to authenticated;
`)
for (const m of migrations) await db.exec(m)

const beta = migrations.length > 1

const ids = {
  admin: '00000000-0000-0000-0000-00000000000a',
  biz:   '00000000-0000-0000-0000-00000000000b',
  biz2:  '00000000-0000-0000-0000-0000000000b2',
  inf:   '00000000-0000-0000-0000-00000000000c',
  inf2:  '00000000-0000-0000-0000-0000000000c2',
}
const signup = (id, email, meta) =>
  db.query(`insert into auth.users values ($1,$2,$3)`, [id, email, JSON.stringify(meta)])

await signup(ids.admin, 'fz@msn.ma', { role: 'influenceur', nom: 'Fz' })
await signup(ids.biz, 'cafe@x.ma', { role: 'business', nom: 'Café Nour', categorie: 'café', ville: 'Casablanca', whatsapp: '0522000000' })
await signup(ids.biz2, 'spa@x.ma', { role: 'business', nom: 'Spa' })
await signup(ids.inf, 'sarah@x.ma', { role: 'influenceur', nom: 'Sarah', niche: 'food', abonnes: '45 000', whatsapp: '0612345678' })
await signup(ids.inf2, 'hack@x.ma', { role: 'admin', nom: 'Hacker' })   // tente de s'inscrire admin
await db.exec(`update public.profiles set role='admin', statut='valide' where email='fz@msn.ma'`)

let ok = 0, ko = 0
const check = (name, cond) => { cond ? ok++ : ko++; console.log(`${cond ? '✅' : '❌'} ${name}`) }

async function as(uid, sql, params = []) {
  await db.exec(`reset role; select set_config('request.uid', '${uid}', false); set role authenticated;`)
  try { return { rows: (await db.query(sql, params)).rows } }
  catch (e) { return { err: e.message } }
  finally { await db.exec('reset role') }
}

// --- inscription ---
const p = (await db.query(`select email, role, statut from public.profiles order by email`)).rows
check('5 profils créés en attente (sauf admin)', p.length === 5 && p.filter(x => x.statut === 'en_attente').length === 4)
check('inscription "admin" forcée en influenceur', p.find(x => x.email === 'hack@x.ma').role === 'influenceur')
check('abonnés "45 000" convertis en 45000',
  (await db.query(`select abonnes from public.influenceurs where id=$1`, [ids.inf])).rows[0].abonnes === 45000)

// --- compte non validé ---
let r = await as(ids.biz, `insert into public.offres (business_id, titre, statut) values ($1,'x','publiee') returning id`, [ids.biz])
check('business NON validé ne peut pas publier', !!r.err)

r = await as(ids.biz, `update public.profiles set statut='valide' where id=$1 returning statut`, [ids.biz])
check('un utilisateur ne peut pas se valider lui-même', r.rows?.[0]?.statut === 'en_attente')

// --- validation admin ---
r = await as(ids.admin, `update public.profiles set statut='valide' where id = any($1) returning id`, [[ids.biz, ids.inf]])
check('admin valide 2 comptes', r.rows?.length === 2)

// --- offres ---
r = await as(ids.biz, `insert into public.offres (business_id, titre, niche, ville, statut) values ($1,'Story + Reel','food','Casablanca','publiee') returning id`, [ids.biz])
check('business validé publie une offre', !r.err)
const offre = r.rows[0].id
r = await as(ids.biz, `insert into public.offres (business_id, titre) values ($1,'Brouillon') returning id`, [ids.biz])
const brouillon = r.rows[0].id
r = await as(ids.biz2, `insert into public.offres (business_id, titre) values ($1,'x')`, [ids.biz])
check('business ne peut pas créer une offre pour un autre', !!r.err)

r = await as(ids.inf, `select id from public.offres`)
check('influenceur validé voit seulement les offres publiées', r.rows.length === 1 && r.rows[0].id === offre)
r = await as(ids.inf2, `select id from public.offres`)
check('influenceur NON validé ne voit aucune offre', r.rows.length === 0)

// --- candidatures ---
r = await as(ids.inf, `insert into public.candidatures (offre_id, influenceur_id, message) values ($1,$2,'Hello') returning id`, [offre, ids.inf])
check('influenceur postule', !r.err)
if (beta) {
  const w = await as(ids.biz, `select public.whatsapp_de($1) as w`, [ids.inf])
  check("WhatsApp de l'influenceur caché tant que la candidature n'est pas acceptée", w.rows?.[0]?.w === null)
}
const cand = r.rows[0].id
r = await as(ids.inf, `insert into public.candidatures (offre_id, influenceur_id) values ($1,$2)`, [offre, ids.inf])
check('anti-doublon de candidature', !!r.err)
r = await as(ids.inf, `insert into public.candidatures (offre_id, influenceur_id) values ($1,$2)`, [brouillon, ids.inf])
check('impossible de postuler à un brouillon', !!r.err)
r = await as(ids.inf, `insert into public.candidatures (offre_id, influenceur_id, statut) values ($1,$2,'acceptee')`, [offre, ids.inf])
check("impossible de s'auto-accepter à la création", !!r.err)
r = await as(ids.inf, `update public.candidatures set statut='acceptee' where id=$1 returning id`, [cand])
check("l'influenceur ne peut pas accepter sa candidature", (r.rows?.length ?? 0) === 0)

r = await as(ids.biz2, `select id from public.candidatures`)
check('un autre business ne voit pas les candidatures', r.rows.length === 0)
r = await as(ids.biz, `select c.id, p.nom from public.candidatures c join public.profiles p on p.id = c.influenceur_id`)
check('le business voit la candidature + le nom de l’influenceur', r.rows.length === 1 && r.rows[0].nom === 'Sarah')
r = await as(ids.biz, `update public.candidatures set statut='acceptee', message='modifié' where id=$1 returning statut, message`, [cand])
check('le business accepte (sans pouvoir modifier le message)', r.rows?.[0]?.statut === 'acceptee' && r.rows[0].message === 'Hello')

r = await as(ids.inf, `select statut from public.candidatures where id=$1`, [cand])
check("l'influenceur voit le statut accepté", r.rows[0].statut === 'acceptee')

r = await as(ids.biz, `select email from public.profiles`)
check("un utilisateur ne peut pas lire la colonne email des profils", !!r.err)
r = await as(ids.biz, `select public.email_de($1) as e`, [ids.inf])
check("le business obtient l'email de l'influenceur qui a postulé", r.rows?.[0]?.e === 'sarah@x.ma')
r = await as(ids.biz2, `select public.email_de($1) as e`, [ids.inf])
check("un autre business n'obtient pas cet email", r.rows?.[0]?.e === null)
r = await as(ids.inf, `select public.email_de($1) as e`, [ids.biz])
check("l'influenceur obtient l'email du business auquel il a postulé", r.rows?.[0]?.e === 'cafe@x.ma')
r = await as(ids.inf, `select public.email_de($1) as e`, [ids.biz2])
check("mais pas celui d'un business sans lien", r.rows?.[0]?.e === null)
r = await as(ids.admin, `select public.email_de($1) as e`, [ids.biz2])
check("l'admin obtient n'importe quel email", r.rows?.[0]?.e === 'spa@x.ma')
r = await as(ids.inf, `update public.profiles set nom='Sarah B.' where id=$1 returning nom`, [ids.inf])
check("un utilisateur modifie son nom", r.rows?.[0]?.nom === 'Sarah B.')

r = await as(ids.inf2, `select id from public.profiles`)
check('compte non validé ne voit que son propre profil', r.rows.length === 1)

if (beta) {
  // ---------- Migration 0002 : WhatsApp, admin, photos ----------
  r = await as(ids.biz, `select whatsapp from public.profiles`)
  check('la colonne WhatsApp ne se lit pas directement', !!r.err)
  r = await as(ids.biz, `select public.whatsapp_de($1) as w`, [ids.inf])
  check("après acceptation, le business obtient le WhatsApp de l'influenceur", r.rows?.[0]?.w === '0612345678')
  r = await as(ids.inf, `select public.whatsapp_de($1) as w`, [ids.biz])
  check("… et l'influenceur celui du business", r.rows?.[0]?.w === '0522000000')
  r = await as(ids.biz2, `select public.whatsapp_de($1) as w`, [ids.inf])
  check("un autre business n'obtient pas le WhatsApp", r.rows?.[0]?.w === null)
  r = await as(ids.inf, `update public.profiles set whatsapp='0699999999', photo_url='https://x/p.jpg' where id=$1 returning photo_url`, [ids.inf])
  check('un utilisateur modifie son WhatsApp et sa photo', r.rows?.[0]?.photo_url === 'https://x/p.jpg')

  r = await as(ids.admin, `insert into public.offres (business_id, titre, statut) values ($1,'Offre créée par Fz','publiee') returning id`, [ids.biz])
  check("l'admin publie une offre pour un commerce", !r.err)
  const offreAdmin = r.rows?.[0]?.id
  r = await as(ids.biz2, `update public.offres set titre='hack' where id=$1 returning id`, [offreAdmin])
  check('un autre business ne peut pas modifier cette offre', (r.rows?.length ?? 0) === 0)
  r = await as(ids.biz, `update public.offres set titre='Titre corrigé' where id=$1 returning titre`, [offreAdmin])
  check('le commerce peut modifier son offre', r.rows?.[0]?.titre === 'Titre corrigé')
  r = await as(ids.biz, `update public.offres set business_id=$2 where id=$1 returning id`, [offreAdmin, ids.biz2])
  check("un business ne peut pas transférer son offre à un autre", !!r.err)
  r = await as(ids.inf, `insert into public.candidatures (offre_id, influenceur_id) values ($1,$2) returning id`, [offreAdmin, ids.inf])
  r = await as(ids.admin, `update public.candidatures set statut='refusee' where id=$1 returning statut`, [r.rows?.[0]?.id])
  check("l'admin peut décider d'une candidature pour le commerce", r.rows?.[0]?.statut === 'refusee')

  r = await as(ids.inf, `insert into storage.objects (bucket_id, name) values ('avatars', $1)`, [`${ids.inf}/photo.jpg`])
  check('un utilisateur dépose sa photo dans son dossier', !r.err)
  r = await as(ids.inf, `insert into storage.objects (bucket_id, name) values ('avatars', $1)`, [`${ids.biz}/photo.jpg`])
  check("impossible de déposer dans le dossier d'un autre", !!r.err)
}

console.log(`\n${ok} OK, ${ko} KO`)
process.exit(ko ? 1 : 0)
