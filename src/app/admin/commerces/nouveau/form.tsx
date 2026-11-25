"use client";

import { useActionState } from "react";
import { creerCommerce } from "../../actions";
import { BoutonEnvoi, MessageForm } from "@/components/client";
import { CATEGORIES, VILLES } from "@/lib/types";

export function FormCommerce() {
  const [etat, action] = useActionState(creerCommerce, null);
  return (
    <form action={action} className="carte space-y-3 p-4">
      <Champ label="Nom du commerce *" name="nom" required />
      <Champ label="Email du commerce *" name="email" type="email" required />
      <div className="flex gap-2">
        <Liste label="Ville" name="ville" options={VILLES} />
        <Liste label="Catégorie" name="categorie" options={CATEGORIES} />
      </div>
      <Champ label="Instagram" name="instagram" placeholder="@" />
      <Champ label="WhatsApp du commerce" name="whatsapp" type="tel" inputMode="tel" placeholder="06 12 34 56 78" />
      <BoutonEnvoi enCours="Création…">Créer le commerce</BoutonEnvoi>
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

function Liste({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <label className="block flex-1">
      <span className="label-or">{label}</span>
      <select name={name} defaultValue="" className="champ mt-1">
        <option value="">—</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
