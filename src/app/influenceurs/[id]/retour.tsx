"use client";

import { useRouter } from "next/navigation";

export function RetourArriere() {
  const router = useRouter();
  return (
    <button onClick={() => router.back()} className="text-[11px] text-or-fonce">
      ← Retour
    </button>
  );
}
