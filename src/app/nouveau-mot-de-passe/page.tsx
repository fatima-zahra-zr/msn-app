"use client";

import { useActionState } from "react";
import { changerMotDePasse } from "../(auth)/actions";
import { LogoGrand, Separateur } from "@/components/ui";
import { BoutonEnvoi, MessageForm } from "@/components/client";

/** On arrive ici depuis le lien « mot de passe oublié » reçu par email (déjà connecté via le lien) */
export default function NouveauMotDePasse() {
  const [etat, action] = useActionState(changerMotDePasse, null);

  return (
    <main className="flex flex-1 flex-col bg-gradient-to-b from-or-clair to-ivoire px-6 pb-10 pt-6">
      <LogoGrand />
      <Separateur texte="Nouveau mot de passe" />
      <form action={action} className="space-y-3">
        <label className="block">
          <span className="label-or">Nouveau mot de passe (8 caractères min.)</span>
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className="champ mt-1" />
        </label>
        <label className="block">
          <span className="label-or">Confirmer</span>
          <input name="confirmation" type="password" required minLength={8} autoComplete="new-password" className="champ mt-1" />
        </label>
        <BoutonEnvoi enCours="Enregistrement…">Enregistrer</BoutonEnvoi>
        <MessageForm etat={etat} />
      </form>
    </main>
  );
}
