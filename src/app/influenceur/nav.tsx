import { BottomNav, TopBar } from "@/components/ui";
import type { ReactNode } from "react";

const ITEMS = [
  { href: "/influenceur", icone: "⚡", label: "Offres" },
  { href: "/influenceur/candidatures", icone: "📋", label: "Candidatures" },
  { href: "/profil", icone: "👤", label: "Profil" },
];

export function EspaceInfluenceur({ actif, children }: { actif: string; children: ReactNode }) {
  return (
    <>
      <TopBar />
      <main className="flex-1 px-4 pb-6 pt-3">{children}</main>
      <BottomNav items={ITEMS} actif={actif} />
    </>
  );
}
