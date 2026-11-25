"use client";

import Link from "next/link";
import { useActionState } from "react";
import { seConnecter } from "../actions";
import { LogoGrand, Separateur } from "@/components/ui";
import { BoutonEnvoi, MessageForm } from "@/components/client";

export default function Connexion() {
  const [etat, action] = useActionState(seConnecter, null);

  return (
    <main className="flex flex-1 flex-col bg-gradient-to-b from-or-clair to-ivoire px-6 pb-10 pt-6">
      <LogoGrand />
      <Separateur texte="Connexion" />

      <form action={action} className="space-y-3">
        <label className="block">
          <span className="label-or">Email</span>
          <input name="email" type="email" required autoComplete="email" className="champ mt-1" />
        </label>
        <label className="block">
          <span className="label-or">Mot de passe</span>
          <input name="password" type="password" required autoComplete="current-password" className="champ mt-1" />
        </label>
        <div className="pt-2">
          <BoutonEnvoi enCours="Connexion…">Se connecter</BoutonEnvoi>
        </div>
        <MessageForm etat={etat} />
      </form>

      <p className="mt-6 text-center text-[11px] text-muted">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="border-b border-or/30 font-semibold text-or">
          S&apos;inscrire →
        </Link>
      </p>
    </main>
  );
}
