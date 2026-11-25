"use client";

import { useActionState } from "react";
import { creerOffre } from "../../actions";
import { BoutonEnvoi, MessageForm } from "@/components/client";
import { NICHES, VILLES } from "@/lib/types";

export function FormOffre({ villeParDefaut, categorie }: { villeParDefaut: string; categorie: string }) {
  const [etat, action] = useActionState(creerOffre, null);
  const nicheSuggeree = categorie.toLowerCase().includes("restaurant")
    ? "Food"
    : categorie.toLowerCase().includes("beaut")
      ? "Beauté"
      : categorie.toLowerCase().includes("sport")
        ? "Sport"
        : "";

  return (
    <form action={action} className="carte space-y-3 p-4">
      <label className="block">
        <span className="label-or">Titre de l&apos;offre *</span>
        <input name="titre" required maxLength={80} placeholder="ex : Story + Reel au restaurant" className="champ mt-1" />
      </label>
      <label className="block">
        <span className="label-or">Description</span>
        <textarea
          name="description"
          rows={4}
          maxLength={1000}
          placeholder="Ce que tu attends (contenu, date, nombre de posts), ce que tu offres…"
          className="champ mt-1 resize-none"
        />
      </label>
      <div className="flex gap-2">
        <label className="block flex-1">
          <span className="label-or">Niche</span>
          <select name="niche" defaultValue={nicheSuggeree} className="champ mt-1">
            <option value="">Toutes</option>
            {NICHES.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label className="block flex-1">
          <span className="label-or">Ville</span>
          <select name="ville" defaultValue={villeParDefaut} className="champ mt-1">
            <option value="">—</option>
            {VILLES.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="label-or">Rémunération / budget</span>
        <input name="budget" maxLength={120} placeholder="ex : 800 MAD, ou repas offert pour 2" className="champ mt-1" />
      </label>
      <p className="text-[10px] text-muted">C&apos;est toi qui fixes le budget qui te convient.</p>

      <div className="flex gap-2 pt-1">
        <BoutonEnvoi name="publier" value="non" className="btn-secondaire flex-1" enCours="…">
          Brouillon
        </BoutonEnvoi>
        <BoutonEnvoi name="publier" value="oui" className="btn-primaire flex-1" enCours="Publication…">
          Publier
        </BoutonEnvoi>
      </div>
      <MessageForm etat={etat} />
    </form>
  );
}
