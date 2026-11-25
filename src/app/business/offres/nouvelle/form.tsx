"use client";

import { useActionState } from "react";
import { enregistrerOffre } from "../../actions";
import { BoutonEnvoi, MessageForm } from "@/components/client";
import { NICHES, VILLES } from "@/lib/types";

export type OffreModifiable = {
  id: string;
  titre: string;
  description: string | null;
  niche: string | null;
  ville: string | null;
  budget: string | null;
};

/** Formulaire d'offre : création (sans `offre`) ou modification (avec `offre`) */
export function FormOffre({
  offre,
  businessId,
  villeParDefaut = "",
  categorie = "",
}: {
  offre?: OffreModifiable;
  businessId?: string; // l'admin publie pour ce commerce
  villeParDefaut?: string;
  categorie?: string;
}) {
  const [etat, action] = useActionState(enregistrerOffre, null);
  const c = categorie.toLowerCase();
  const nicheSuggeree = c.includes("restaurant") ? "Food" : c.includes("beaut") ? "Beauté" : c.includes("sport") ? "Sport" : "";
  const avecValeur = (liste: string[], v: string | null | undefined) => (v && !liste.includes(v) ? [v, ...liste] : liste);

  return (
    <form action={action} className="carte space-y-3 p-4">
      {offre && <input type="hidden" name="id" value={offre.id} />}
      {businessId && <input type="hidden" name="business_id" value={businessId} />}
      <label className="block">
        <span className="label-or">Titre de l&apos;offre *</span>
        <input name="titre" required maxLength={80} defaultValue={offre?.titre} placeholder="ex : Story + Reel au restaurant" className="champ mt-1" />
      </label>
      <label className="block">
        <span className="label-or">Description</span>
        <textarea
          name="description"
          rows={4}
          maxLength={1000}
          defaultValue={offre?.description ?? ""}
          placeholder="Ce que tu attends (contenu, date, nombre de posts), ce que tu offres…"
          className="champ mt-1 resize-none"
        />
      </label>
      <div className="flex gap-2">
        <label className="block flex-1">
          <span className="label-or">Niche</span>
          <select name="niche" defaultValue={offre ? (offre.niche ?? "") : nicheSuggeree} className="champ mt-1">
            <option value="">Toutes</option>
            {avecValeur(NICHES, offre?.niche).map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label className="block flex-1">
          <span className="label-or">Ville</span>
          <select name="ville" defaultValue={offre ? (offre.ville ?? "") : villeParDefaut} className="champ mt-1">
            <option value="">Partout</option>
            {avecValeur(VILLES, offre?.ville).map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="label-or">Rémunération / budget</span>
        <input name="budget" maxLength={120} defaultValue={offre?.budget ?? ""} placeholder="ex : 800 MAD, ou repas offert pour 2" className="champ mt-1" />
      </label>
      <p className="text-[10px] text-muted">C&apos;est le commerce qui fixe le budget qui lui convient.</p>

      {offre ? (
        <BoutonEnvoi enCours="Enregistrement…">Enregistrer les modifications</BoutonEnvoi>
      ) : (
        <div className="flex gap-2 pt-1">
          <BoutonEnvoi name="publier" value="non" className="btn-secondaire flex-1" enCours="…">
            Brouillon
          </BoutonEnvoi>
          <BoutonEnvoi name="publier" value="oui" className="btn-primaire flex-1" enCours="Publication…">
            Publier
          </BoutonEnvoi>
        </div>
      )}
      <MessageForm etat={etat} />
    </form>
  );
}
