"use client";

import Link from "next/link";
import { useActionState } from "react";
import { demanderNouveauMotDePasse } from "../actions";
import { LogoGrand, Separateur } from "@/components/ui";
import { BoutonEnvoi, MessageForm } from "@/components/client";

export default function MotDePasseOublie() {
  const [etat, action] = useActionState(demanderNouveauMotDePasse, null);

  return (
    <main className="flex flex-1 flex-col bg-gradient-to-b from-or-clair to-ivoire px-6 pb-10 pt-6">
      <LogoGrand />
      <Separateur texte="Mot de passe oublié" />

      {etat?.ok ? (
        <MessageForm etat={etat} />
      ) : (
        <form action={action} className="space-y-3">
          <p className="text-xs leading-relaxed text-muted">
            Indique l&apos;email de ton compte : on t&apos;envoie un lien pour choisir un nouveau mot de passe.
          </p>
          <label className="block">
            <span className="label-or">Email</span>
            <input name="email" type="email" required autoComplete="email" className="champ mt-1" />
          </label>
          <BoutonEnvoi enCours="Envoi…">Recevoir le lien</BoutonEnvoi>
          <MessageForm etat={etat} />
        </form>
      )}

      <p className="mt-6 text-center text-[11px] text-muted">
        <Link href="/connexion" className="border-b border-or/30 font-semibold text-or-fonce">
          ← Retour à la connexion
        </Link>
      </p>
    </main>
  );
}
