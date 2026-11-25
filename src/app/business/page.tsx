import Link from "next/link";
import { exigerProfil } from "@/lib/auth";
import { BadgeStatut, EnTeteSection, Kpi, Vide } from "@/components/ui";
import { CarteCandidature, EspaceBusiness, SELECT_CANDIDATURE, type CandidatureBiz } from "./composants";

export default async function DashboardBusiness() {
  const { supabase, profil } = await exigerProfil(["business"]);

  const { data: offres } = await supabase
    .from("offres")
    .select("id, titre, statut, created_at, candidatures(count)")
    .eq("business_id", profil.id)
    .order("created_at", { ascending: false })
    .returns<{ id: string; titre: string; statut: string; candidatures: { count: number }[] }[]>();

  const ids = (offres ?? []).map((o) => o.id);
  const { data: candidatures } = ids.length
    ? await supabase
        .from("candidatures")
        .select(SELECT_CANDIDATURE)
        .in("offre_id", ids)
        .order("created_at", { ascending: false })
        .returns<CandidatureBiz[]>()
    : { data: [] as CandidatureBiz[] };

  const actives = (offres ?? []).filter((o) => o.statut === "publiee").length;
  const enAttente = (candidatures ?? []).filter((c) => c.statut === "en_attente");
  const enCours = (candidatures ?? []).filter((c) => c.statut === "acceptee").length;

  return (
    <EspaceBusiness actif="/business">
      <h1 className="mb-3 font-titre text-2xl">Bonjour {profil.nom}</h1>

      <div className="mb-5 flex gap-2">
        <Kpi valeur={actives} label="Offres actives" />
        <Kpi valeur={candidatures?.length ?? 0} label="Candidatures" />
        <Kpi valeur={enCours} label="Collabs en cours" />
      </div>

      <section className="mb-5">
        <EnTeteSection titre={`À traiter (${enAttente.length})`} />
        {!enAttente.length && <Vide texte="Aucune candidature en attente." />}
        <div className="space-y-2">
          {enAttente.map((c) => (
            <CarteCandidature key={c.id} c={c} />
          ))}
        </div>
      </section>

      <section>
        <EnTeteSection titre="Mes offres" />
        <Link href="/business/offres/nouvelle" className="btn-primaire mb-2 w-full">
          + Publier une nouvelle offre
        </Link>
        {!offres?.length && <Vide texte="Publie ta première offre pour recevoir des candidatures d'influenceurs." />}
        <div className="space-y-2">
          {offres?.map((o) => (
            <Link key={o.id} href={`/business/offres/${o.id}`} className="carte flex items-center justify-between p-3">
              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold">{o.titre}</div>
                <div className="text-[10px] text-muted">
                  {o.candidatures?.[0]?.count ?? 0} candidature(s) reçue(s)
                </div>
              </div>
              <BadgeStatut statut={o.statut} />
            </Link>
          ))}
        </div>
      </section>
    </EspaceBusiness>
  );
}
