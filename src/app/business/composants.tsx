import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar, BadgeStatut, BottomNav, TopBar, formatAbonnes } from "@/components/ui";
import { BoutonEnvoi } from "@/components/client";
import { deciderCandidature } from "./actions";

const ITEMS = [
  { href: "/business", icone: "📊", label: "Dashboard" },
  { href: "/business/offres/nouvelle", icone: "📢", label: "Publier" },
  { href: "/profil", icone: "👤", label: "Profil" },
];

export function EspaceBusiness({ actif, children }: { actif: string; children: ReactNode }) {
  return (
    <>
      <TopBar badge="Business" />
      <main className="flex-1 px-4 pb-6 pt-3">{children}</main>
      <BottomNav items={ITEMS} actif={actif} />
    </>
  );
}

/** Ce qu'on sélectionne pour afficher une candidature côté business */
export const SELECT_CANDIDATURE =
  "id, statut, message, created_at, offres(id, titre), influenceurs(id, niche, abonnes, profiles(nom, ville))";

export type CandidatureBiz = {
  id: string;
  statut: string;
  message: string | null;
  created_at: string;
  offres: { id: string; titre: string } | null;
  influenceurs: {
    id: string;
    niche: string | null;
    abonnes: number | null;
    profiles: { nom: string; ville: string | null } | null;
  } | null;
};

export function CarteCandidature({ c, montrerOffre = true }: { c: CandidatureBiz; montrerOffre?: boolean }) {
  const inf = c.influenceurs;
  const nom = inf?.profiles?.nom ?? "Influenceur";
  const meta = [inf?.niche, formatAbonnes(inf?.abonnes), inf?.profiles?.ville].filter((x) => x && x !== "—").join(" · ");

  return (
    <div className="carte p-3">
      <div className="flex items-center gap-3">
        <Avatar texte={nom} />
        <Link href={inf ? `/influenceurs/${inf.id}` : "#"} className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold">{nom}</div>
          <div className="truncate text-[10px] text-muted">{meta}</div>
          {montrerOffre && c.offres && <div className="truncate text-[10px] text-or">→ {c.offres.titre}</div>}
        </Link>
        {c.statut === "en_attente" ? (
          <div className="flex shrink-0 gap-1.5">
            <Decision id={c.id} decision="acceptee" />
            <Decision id={c.id} decision="refusee" />
          </div>
        ) : (
          <BadgeStatut statut={c.statut} />
        )}
      </div>
      {c.message && <p className="mt-2 rounded-lg bg-ivoire px-3 py-2 text-[11px] italic text-encre/80">« {c.message} »</p>}
    </div>
  );
}

function Decision({ id, decision }: { id: string; decision: "acceptee" | "refusee" }) {
  const ok = decision === "acceptee";
  return (
    <form action={deciderCandidature}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="decision" value={decision} />
      <BoutonEnvoi
        enCours="…"
        confirmation={ok ? "Accepter cette candidature ?" : "Refuser cette candidature ?"}
        className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm ${
          ok ? "border-succes/20 bg-succes-bg text-succes" : "border-danger/20 bg-danger-bg text-danger"
        }`}
      >
        {ok ? "✓" : "✕"}
      </BoutonEnvoi>
    </form>
  );
}
