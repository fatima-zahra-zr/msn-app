"use client";

import { useActionState } from "react";
import { postuler } from "../../actions";
import { BoutonEnvoi, MessageForm } from "@/components/client";

export function FormPostuler({ offreId }: { offreId: string }) {
  const [etat, action] = useActionState(postuler, null);
  if (etat?.ok) return <MessageForm etat={etat} />;

  return (
    <form action={action} className="carte space-y-3 p-4">
      <input type="hidden" name="offre_id" value={offreId} />
      <label className="block">
        <span className="label-or">Ton message (optionnel)</span>
        <textarea
          name="message"
          rows={3}
          maxLength={500}
          placeholder="Pourquoi cette collab te correspond ? Idée de contenu…"
          className="champ mt-1 resize-none"
        />
      </label>
      <BoutonEnvoi enCours="Envoi…">Postuler</BoutonEnvoi>
      <MessageForm etat={etat} />
    </form>
  );
}
