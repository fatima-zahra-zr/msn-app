"use client";

import { useActionState } from "react";
import { majProfil } from "./actions";
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
