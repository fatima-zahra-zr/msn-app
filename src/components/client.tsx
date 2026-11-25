"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

/** Bouton d'envoi de formulaire qui se désactive pendant le chargement */
export function BoutonEnvoi({
  children,
  className = "btn-primaire w-full",
  enCours = "Un instant…",
  confirmation,
  name,
  value,
}: {
  children: ReactNode;
  className?: string;
  enCours?: string;
  confirmation?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (confirmation && !window.confirm(confirmation)) e.preventDefault();
      }}
    >
      {pending ? enCours : children}
    </button>
  );
}

export function MessageForm({ etat }: { etat?: { erreur?: string; ok?: string } | null }) {
  if (!etat?.erreur && !etat?.ok) return null;
  return (
    <p
      aria-live="polite"
      className={`mt-3 rounded-xl px-4 py-3 text-xs ${etat.erreur ? "bg-danger-bg text-danger" : "bg-succes-bg text-succes"}`}
    >
      {etat.erreur ?? etat.ok}
    </p>
  );
}
