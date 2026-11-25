"use client";

import { useActionState } from "react";
import { majPhoto, majProfil } from "./actions";
import { Avatar } from "@/components/ui";
import { BoutonEnvoi, MessageForm } from "@/components/client";
import { CATEGORIES, NICHES, VILLES, type Role } from "@/lib/types";

type Valeurs = Record<string, string | number | null | undefined>;

export function FormProfil({ role, valeurs }: { role: Role; valeurs: Valeurs }) {
  const [etat, action] = useActionState(majProfil, null);
  const v = (k: string) => (valeurs[k] ?? "").toString();

  return (
    <form action={action} className="carte space-y-3 p-4">
      <Champ label={role === "business" ? "Nom du commerce" : "Nom / pseudo"} name="nom" defaultValue={v("nom")} required />
      <Liste label="Ville" name="ville" options={VILLES} defaultValue={v("ville")} />
      <Champ label="Instagram" name="instagram" defaultValue={v("instagram")} placeholder="@" />
      <Champ label="WhatsApp (partagé après une collab acceptée)" name="whatsapp" type="tel" inputMode="tel" defaultValue={v("whatsapp")} placeholder="06 12 34 56 78" />

      {role === "influenceur" && (
        <>
          <Liste label="Niche principale" name="niche" options={NICHES} defaultValue={v("niche")} />
          <Champ label="Nombre d'abonnés" name="abonnes" inputMode="numeric" defaultValue={v("abonnes")} />
        </>
      )}
      {role === "business" && (
        <>
          <Liste label="Catégorie" name="categorie" options={CATEGORIES} defaultValue={v("categorie")} />
          <Champ label="Site web" name="site_web" type="url" defaultValue={v("site_web")} placeholder="https://" />
        </>
      )}

      <label className="block">
        <span className="label-or">{role === "business" ? "Présentation du commerce" : "Bio"}</span>
        <textarea name="bio" rows={3} maxLength={400} defaultValue={v("bio")} className="champ mt-1 resize-none" />
      </label>

      <BoutonEnvoi enCours="Enregistrement…">Enregistrer</BoutonEnvoi>
      <MessageForm etat={etat} />
    </form>
  );
}

export function FormPhoto({ nom, photo, role }: { nom: string; photo: string | null; role: Role }) {
  const [etat, action] = useActionState(majPhoto, null);
  return (
    <form action={action} className="carte mb-3 flex items-center gap-4 p-4">
      <Avatar texte={nom} photo={photo} taille="xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <label className="block">
          <span className="label-or">{role === "business" ? "Logo du commerce" : "Photo de profil"}</span>
          <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required className="mt-1 block w-full text-[11px] text-muted file:mr-2 file:rounded-lg file:border-0 file:bg-bordure file:px-3 file:py-2 file:text-[11px] file:font-semibold file:text-encre" />
        </label>
        <BoutonEnvoi className="btn-secondaire w-full !py-2" enCours="Envoi…">Mettre à jour</BoutonEnvoi>
        <MessageForm etat={etat} />
      </div>
    </form>
  );
}

function Champ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="label-or">{label}</span>
      <input {...props} className="champ mt-1" />
    </label>
  );
}

function Liste({ label, name, options, defaultValue }: { label: string; name: string; options: string[]; defaultValue: string }) {
  const toutes = defaultValue && !options.includes(defaultValue) ? [defaultValue, ...options] : options;
  return (
    <label className="block">
      <span className="label-or">{label}</span>
      <select name={name} defaultValue={defaultValue} className="champ mt-1">
        <option value="">—</option>
        {toutes.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
