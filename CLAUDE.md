# MSN App — contexte projet

MVP web (PWA installable) de **MSN — Moroccan Social Network** : une marketplace qui connecte des influenceurs marocains avec des commerces locaux (Casablanca, Rabat, Marrakech). Remplace le build Adalo.

## Flux V1
Inscription (Influenceur / Business) → validation par l'admin (Fz) → le business publie une offre → les influenceurs validés postulent → le business accepte / refuse → notification email.

## Stack
- Next.js 16 (App Router, Cache Components, `proxy.ts` à la place de `middleware`). **Lire `AGENTS.md` et les docs dans `node_modules/next/dist/docs/` avant de coder.**
- Supabase : Auth (email + mot de passe) + Postgres. Schéma dans `supabase/migrations/` (0001, 0002… à exécuter dans l'ordre ; toute évolution = un nouveau fichier). Photos dans le bucket Storage public `avatars/<id>/`.
- Tailwind v4, design system **Ivoire & Or** dans `src/app/globals.css` (Cormorant Garamond pour les titres, Montserrat pour le texte).
- Emails : Resend (`src/lib/email.ts`), optionnels.

## Règles importantes
- **La sécurité est dans la base (RLS)**, pas seulement dans l'UI. Toute nouvelle table doit avoir des policies et un test dans `supabase/tests/rls.test.mjs` (`npm run test:db`).
- **L'email des profils est protégé** : ne jamais faire `select("*")` sur `profiles` (ni un embed `profiles(*)`). Utiliser `PROFIL_COLS` et les fonctions SQL `email_de(uid)` / `whatsapp_de(uid)` (WhatsApp visible seulement après une candidature acceptée).
- `src/lib/supabase/admin.ts` (clé service_role) contourne la sécurité : uniquement après `exigerProfil(["admin"])`.
- Mobile first : colonne de 480px max.
- Textes de l'app en français, ton chaleureux. Code lisible par une PO (Fz), commentaires en français.
- Une branche + une PR par évolution. Fz relit et merge.

## Commandes
- `npm run dev` : lancer en local
- `npm run build` : vérifier que tout compile
- `npm run test:db` : tester les règles de sécurité de la base (Postgres embarqué, sans Supabase)

## Plus tard (hors V1)
Annuaire d'influenceurs côté business, « collab réalisée » + lien du post, date limite / places sur une offre, suivi des objectifs 30 jours, plans payants (499 / 799 MAD), commission, Creator Pro (99 MAD), notifications push, version arabe.
