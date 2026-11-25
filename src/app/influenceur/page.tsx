import Link from "next/link";
import { exigerProfil } from "@/lib/auth";
import { NICHES, VILLES } from "@/lib/types";
import { EnTeteSection, Vide, formatAbonnes, iconeNiche } from "@/components/ui";
import { EspaceInfluenceur } from "./nav";

type OffreListe = {
  id: string;
  titre: string;
  niche: string | null;
  ville: string | null;
  budget: string | null;
  businesses: { categorie: string | null; profiles: { nom: string } | null } | null;
};

export default async function DashboardInfluenceur(props: PageProps<"/influenceur">) {
  const { supabase, profil } = await exigerProfil(["influenceur"]);
  const params = await props.searchParams;
  const filtre = typeof params.niche === "string" ? params.niche : undefined;
  const ville = typeof params.ville === "string" ? params.ville : undefined;

  // construit l'URL en gardant l'autre filtre actif
  const lien = (f: { niche?: string; ville?: string }) => {
    const q = new URLSearchParams();
    if (f.niche) q.set("niche", f.niche);
    if (f.ville) q.set("ville", f.ville);
    const s = q.toString();
    return s ? `/influenceur?${s}` : "/influenceur";
  };
  // ma ville en premier dans la liste
  const villes = profil.ville ? [profil.ville, ...VILLES.filter((v) => v !== profil.ville)] : VILLES;

  let requete = supabase
    .from("offres")
    .select("id, titre, niche, ville, budget, businesses(categorie, profiles(nom))")
    .eq("statut", "publiee")
    .order("created_at", { ascending: false });
  if (filtre) requete = requete.ilike("niche", filtre);
  // une offre sans ville est valable partout : on la garde
  if (ville) requete = requete.or(`ville.is.null,ville.eq.${ville.replace(/[,()]/g, "")}`);

  const [{ data: offres }, { data: mesCandidatures }, { data: moi }] = await Promise.all([
    requete.returns<OffreListe[]>(),
    supabase.from("candidatures").select("offre_id, statut").eq("influenceur_id", profil.id),
    supabase.from("influenceurs").select("abonnes").eq("id", profil.id).single(),
  ]);

  const postulees = new Set((mesCandidatures ?? []).map((c) => c.offre_id));
  const acceptees = (mesCandidatures ?? []).filter((c) => c.statut === "acceptee").length;

  return (
    <EspaceInfluenceur actif="/influenceur">
      {/* Carte de bienvenue */}
      <section className="carte relative overflow-hidden p-4">
        <div className="absolute right-0 top-0 h-24 w-24 bg-[radial-gradient(circle_at_top_right,rgba(184,150,12,0.10),transparent_70%)]" />
        <p className="text-[10px] uppercase tracking-[2px] text-muted">Bienvenue</p>
        <h1 className="font-titre text-2xl">{profil.nom}</h1>
        <div className="mt-3 flex gap-6">
          <Stat n={mesCandidatures?.length ?? 0} l="Candidatures" />
          <Stat n={acceptees} l={acceptees > 1 ? "Acceptées" : "Acceptée"} />
          <Stat n={formatAbonnes(moi?.abonnes)} l="Abonnés" />
        </div>
      </section>

      {/* Filtres par niche et par ville */}
      <div className="-mx-4 mt-4 border-y border-bordure-2 bg-surface">
        <nav className="flex gap-2 overflow-x-auto px-4 pt-3">
          <Filtre href={lien({ ville })} actif={!filtre} label="Tout" />
          {NICHES.map((n) => (
            <Filtre key={n} href={lien({ niche: n, ville })} actif={filtre === n} label={n} />
          ))}
        </nav>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-3 pt-2">
          <FiltreVille href={lien({ niche: filtre })} actif={!ville} label="Toutes les villes" />
          {villes.map((v) => (
            <FiltreVille
              key={v}
              href={lien({ niche: filtre, ville: v })}
              actif={ville === v}
              label={v === profil.ville ? `📍 ${v} (ma ville)` : v}
            />
          ))}
        </nav>
      </div>

      <section className="mt-4">
        <EnTeteSection titre="Offres disponibles" />
        {!offres?.length && (
          <Vide
            texte={
              filtre || ville
                ? "Aucune offre avec ces filtres pour le moment. Essaie une autre ville ou niche."
                : "Pas encore d'offre ici. Reviens bientôt, de nouveaux commerces arrivent !"
            }
          />
        )}
        <div className="space-y-2">
          {offres?.map((o, i) => (
            <Link
              key={o.id}
              href={`/influenceur/offres/${o.id}`}
              className={`carte relative flex items-center gap-3 overflow-hidden p-3 ${i === 0 ? "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-or" : ""}`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-bordure bg-ivoire text-xl">
                {iconeNiche(o.niche)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold">{o.businesses?.profiles?.nom ?? "Commerce"}</div>
                <div className="truncate text-[11px] text-muted">{o.titre}</div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {o.niche && <span className="tag-or">{o.niche}</span>}
                  {o.ville && <span className="tag-ville">📍 {o.ville}</span>}
                </div>
              </div>
              {postulees.has(o.id) ? (
                <span className="shrink-0 rounded-lg border border-bordure px-3 py-2 text-[9px] font-semibold uppercase tracking-[1px] text-muted">
                  Postulé ✓
                </span>
              ) : (
                <span className="shrink-0 rounded-lg bg-or-fonce px-3 py-2 text-[9px] font-bold uppercase tracking-[1px] text-white shadow-[0_3px_10px_rgba(184,150,12,0.25)]">
                  Postuler
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>
    </EspaceInfluenceur>
  );
}

function Stat({ n, l }: { n: number | string; l: string }) {
  return (
    <div>
      <div className="text-xl font-bold text-or-fonce">{n}</div>
      <div className="text-[9px] text-muted">{l}</div>
    </div>
  );
}

function FiltreVille({ href, actif, label }: { href: string; actif: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full px-3 py-1 text-[10px] ${
        actif ? "border border-or bg-or-clair font-semibold text-or-fonce" : "border border-bordure text-muted"
      }`}
    >
      {label}
    </Link>
  );
}

function Filtre({ href, actif, label }: { href: string; actif: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[1px] ${
        actif ? "bg-or-fonce text-white" : "border border-bordure bg-ivoire text-muted"
      }`}
    >
      {label}
    </Link>
  );
}
