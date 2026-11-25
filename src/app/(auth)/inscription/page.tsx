"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { sInscrire } from "../actions";
import { LogoGrand, Separateur } from "@/components/ui";
import { BoutonEnvoi, MessageForm } from "@/components/client";
import { CATEGORIES, NICHES, VILLES } from "@/lib/types";

export default function Inscription() {
  const [role, setRole] = useState<"influenceur" | "business">("influenceur");
  const [etat, action] = useActionState(sInscrire, null);

  if (etat?.ok) {
    return (
      <main className="flex flex-1 flex-col px-6 pt-6">
        <LogoGrand />
        <MessageForm etat={etat} />
        <Link href="/connexion" className="btn-secondaire mt-6">Retour à la connexion</Link>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col bg-gradient-to-b from-or-clair to-ivoire px-6 pb-10 pt-2">
      <LogoGrand />
      <Separateur texte="Inscription" />

      {/* Sélecteur de rôle */}
      <div className="mb-4 flex gap-2">
        {(["influenceur", "business"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`flex-1 rounded-xl border px-2 py-3 text-center transition ${
              role === r ? "border-or bg-or-clair shadow-[0_2px_12px_rgba(184,150,12,0.10)]" : "border-bordure bg-surface"
            }`}
          >
            <div className="text-lg">{r === "influenceur" ? "🎯" : "🏢"}</div>
            <div className={`text-[9px] font-semibold uppercase tracking-[1px] ${role === r ? "text-or-fonce" : "text-muted"}`}>
              {r === "influenceur" ? "Influenceur" : "Business"}
            </div>
          </button>
        ))}
      </div>

      <form action={action} className="space-y-3">
        <input type="hidden" name="role" value={role} />
        <Champ label={role === "business" ? "Nom du commerce" : "Nom / pseudo"} name="nom" required />
        <Champ label="Email" name="email" type="email" required />
        <Champ label="Mot de passe (8 caractères min.)" name="password" type="password" required />
        <Liste label="Ville" name="ville" options={VILLES} />
        <Champ label="Instagram (@compte)" name="instagram" placeholder="@" />

        {role === "influenceur" ? (
          <>
            <Liste label="Niche principale" name="niche" options={NICHES} />
            <Champ label="Nombre d'abonnés" name="abonnes" inputMode="numeric" placeholder="ex : 25000" />
          </>
        ) : (
          <Liste label="Catégorie" name="categorie" options={CATEGORIES} />
        )}

        <p className="text-[10px] leading-relaxed text-muted">
          Ton compte sera vérifié par l&apos;équipe MSN avant d&apos;être activé.
        </p>
        <BoutonEnvoi enCours="Création…">Créer mon compte</BoutonEnvoi>
        <MessageForm etat={etat} />
      </form>

      <p className="mt-6 text-center text-[11px] text-muted">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="border-b border-or/30 font-semibold text-or-fonce">
          Se connecter →
        </Link>
      </p>
    </main>
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
    <label className="block">
      <span className="label-or">{label}</span>
      <select name={name} className="champ mt-1" defaultValue="">
        <option value="" disabled>Choisir…</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
