import Link from "next/link";
import type { ReactNode } from "react";

export function Ornement() {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="h-px w-6 bg-or/40" />
      <span className="h-1.5 w-1.5 rotate-45 bg-or" />
      <span className="h-px w-6 bg-or/40" />
    </div>
  );
}

export function LogoGrand() {
  return (
    <div className="py-6 text-center">
      <Ornement />
      <div className="mt-2 font-titre text-6xl font-light tracking-[10px] text-encre">MSN</div>
      <div className="mt-1 text-[8px] font-medium uppercase tracking-[3.5px] text-or-fonce">Moroccan Social Network</div>
      <p className="mt-4 font-titre text-[15px] text-muted">La plateforme exclusive des créateurs marocains</p>
      <p className="mt-1 text-[9px] uppercase tracking-[2px] text-or-fonce">Connect · Create · Collaborate</p>
    </div>
  );
}

export function Separateur({ texte }: { texte: string }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <span className="h-px flex-1 bg-bordure" />
      <span className="text-[9px] uppercase tracking-[2px] text-[#c0b8a8]">{texte}</span>
      <span className="h-px flex-1 bg-bordure" />
    </div>
  );
}

export function TopBar({ badge, droite }: { badge?: string; droite?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-bordure-2 bg-surface px-5 py-3">
      <Link href="/" className="font-titre text-2xl font-light tracking-[4px]">
        M<span className="text-or-fonce">S</span>N
      </Link>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="rounded border border-or/25 bg-or/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[1.5px] text-or-fonce">
            {badge}
          </span>
        )}
        {droite}
      </div>
    </header>
  );
}

export type ItemNav = { href: string; icone: string; label: string };

export function BottomNav({ items, actif }: { items: ItemNav[]; actif: string }) {
  return (
    <nav className="sticky bottom-0 mt-auto flex justify-around border-t border-bordure bg-surface pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
      {items.map((it) => {
        const on = actif === it.href;
        return (
          <Link key={it.href} href={it.href} className="flex flex-col items-center gap-0.5 px-3">
            <span className="text-lg">{it.icone}</span>
            <span className={`text-[9px] tracking-wide ${on ? "text-or-fonce" : "text-muted"}`}>{it.label}</span>
            <span className={`h-1 w-1 rounded-full ${on ? "bg-or" : "bg-transparent"}`} />
          </Link>
        );
      })}
    </nav>
  );
}

export function EnTeteSection({ titre, lien }: { titre: string; lien?: { href: string; texte: string } }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="titre-section">{titre}</h2>
      {lien && (
        <Link href={lien.href} className="text-[10px] text-or-fonce">
          {lien.texte}
        </Link>
      )}
    </div>
  );
}

export function Vide({ texte }: { texte: string }) {
  return <div className="carte p-5 text-center text-xs text-muted">{texte}</div>;
}

const STATUTS: Record<string, { label: string; cls: string }> = {
  publiee: { label: "Publiée", cls: "bg-succes-bg text-succes" },
  brouillon: { label: "Brouillon", cls: "border border-bordure text-muted" },
  fermee: { label: "Fermée", cls: "bg-bordure text-muted" },
  en_attente: { label: "En attente", cls: "bg-or/10 text-or-fonce" },
  acceptee: { label: "Acceptée", cls: "bg-succes-bg text-succes" },
  refusee: { label: "Refusée", cls: "bg-danger-bg text-danger" },
  valide: { label: "Validé", cls: "bg-succes-bg text-succes" },
  refuse: { label: "Refusé", cls: "bg-danger-bg text-danger" },
};

export function BadgeStatut({ statut }: { statut: string }) {
  const s = STATUTS[statut] ?? { label: statut, cls: "border border-bordure text-muted" };
  return (
    <span className={`shrink-0 rounded px-2 py-1 text-[8.5px] font-bold uppercase tracking-[1px] ${s.cls}`}>{s.label}</span>
  );
}

export function Avatar({ texte }: { texte: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-or/25 bg-or/10 font-titre text-lg text-or-fonce">
      {texte.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function Kpi({ valeur, label }: { valeur: number | string; label: string }) {
  return (
    <div className="carte flex-1 px-2 py-3 text-center">
      <div className="text-2xl font-bold leading-none text-or-fonce">{valeur}</div>
      <div className="mt-1 text-[9px] tracking-wide text-muted">{label}</div>
    </div>
  );
}

export function formatAbonnes(n: number | null | undefined) {
  if (!n) return "—";
  return n >= 1000 ? `${Math.round(n / 100) / 10}K`.replace(".0K", "K") : String(n);
}

export function iconeNiche(niche: string | null) {
  const n = (niche ?? "").toLowerCase();
  if (n.includes("food")) return "🍽️";
  if (n.includes("beaut")) return "💄";
  if (n.includes("sport")) return "🏋️";
  if (n.includes("mode")) return "👗";
  if (n.includes("voyage")) return "✈️";
  if (n.includes("humour")) return "😂";
  return "✨";
}
