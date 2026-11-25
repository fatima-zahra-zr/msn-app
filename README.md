# MSN — Moroccan Social Network (app web)

La plateforme qui connecte influenceurs marocains et commerces locaux. Version web, installable sur téléphone.

## Ce que fait la V1
| Qui | Peut… |
|---|---|
| **Influenceur** | s'inscrire, voir les offres (filtres niche + ville), postuler avec un message, suivre ses candidatures, contacter le commerce sur WhatsApp une fois accepté, photo de profil |
| **Business** | s'inscrire, publier / modifier / fermer des offres, voir les candidatures, consulter la fiche de l'influenceur, accepter ✓ / refuser ✕, contacter l'influenceur sur WhatsApp une fois accepté, logo |
| **Admin (Fz)** | valider / refuser chaque nouveau compte, voir les chiffres clés, **ajouter un commerce démarché et publier / gérer ses offres à sa place** |
| **Tout le monde** | mot de passe oublié |
| **Emails** | compte activé, nouvelle candidature (au business), candidature acceptée / refusée (à l'influenceur), nouvelle inscription (à l'admin) |

---

## Mise en ligne, étape par étape (≈ 30 min)

### 1. Créer la base de données (Supabase, gratuit)
1. Crée un compte sur **supabase.com** → **New project** (nom : `msn`, région : Europe (Paris ou Frankfurt), note bien le mot de passe).
2. Menu **SQL Editor** → **New query** → colle tout le contenu de `supabase/migrations/0001_schema.sql` → **Run**.
   Puis une **nouvelle query** avec `supabase/migrations/0002_pret_beta.sql` → **Run** (toujours dans cet ordre).
3. Menu **Project Settings → API** : copie **Project URL**, la clé **anon / publishable** et la clé **service_role / secret** (⚠️ celle-ci reste secrète : uniquement dans Vercel, jamais ailleurs).

### 2. Mettre le site en ligne (Vercel, gratuit)
1. Crée un compte sur **vercel.com** avec ton GitHub → **Add New → Project** → choisis `msn-app`.
2. Dans **Environment Variables**, ajoute :
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = clé anon
   - `NEXT_PUBLIC_SITE_URL` = l'adresse Vercel (ex : `https://msn-app.vercel.app`)
   - `ADMIN_EMAIL` = ton email
   - `SUPABASE_SERVICE_ROLE_KEY` = clé service_role (sert uniquement à créer un commerce depuis l'espace admin)
3. **Deploy**.

### 3. Relier les deux
Dans Supabase → **Authentication → URL Configuration** :
- **Site URL** = ton adresse Vercel
- **Redirect URLs** → ajoute `https://TON-ADRESSE.vercel.app/auth/callback**` (avec les `**` à la fin : nécessaire pour le mot de passe oublié)

### 4. Te mettre admin
1. Inscris-toi sur ton site (en tant qu'influenceur, peu importe), confirme ton email.
2. Supabase → **SQL Editor** → lance :
   ```sql
   update public.profiles set role = 'admin', statut = 'valide' where email = 'TON_EMAIL';
   ```
3. Reconnecte-toi : tu arrives sur l'espace admin.

### 5. (Optionnel) Emails de notification
Crée un compte sur **resend.com**, une clé API, et ajoute dans Vercel `RESEND_API_KEY`.
Pour envoyer depuis `@moroccansocialnetwork.com`, ajoute ton domaine dans Resend puis `EMAIL_FROM=MSN <hello@moroccansocialnetwork.com>`.

### Installer l'app sur le téléphone
Ouvre le site sur le téléphone → menu du navigateur → **Ajouter à l'écran d'accueil**.

---

## Pour développer
```bash
npm install
cp .env.example .env.local   # remplis les valeurs Supabase
npm run dev                  # http://localhost:3000
npm run test:db              # teste les règles de sécurité de la base
```
