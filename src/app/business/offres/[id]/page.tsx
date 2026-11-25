import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerProfil } from "@/lib/auth";
import { BadgeStatut, EnTeteSection, Vide } from "@/components/ui";
import { BoutonEnvoi } from "@/components/client";
import { changerStatutOffre } from "../../actions";
import { CarteCandidature, EspaceBusiness, SELECT_CANDIDATURE, avecWhatsApp, type CandidatureBiz } from "../../composants";

type OffreDetail = {
  id: string;
  business_id: string;
  titre: string;
  description: string | null;
  niche: string | null;
  ville: string | null;
  budget: string | null;
  statut: string;
  businesses: { profiles: { nom: string } | null } | null;
};

export default async function OffreBusiness(props: PageProps<"/business/offres/[id]">) {
  const { id } = await props.params;
  const { supabase, profil } = await exigerProfil(["business", "admin"]);
  const admin = profil.role === "admin";

  const [{ data: offre }, { data: brutes }] = await Promise.all([
    supabase
      .from("offres")
      .select("id, business_id, titre, description, niche, ville, budget, statut, businesses(profiles(nom))")
      .eq("id", id)
      .single<OffreDetail>(),
    supabase
      .from("candidatures")
      .select(SELECT_CANDIDATURE)
      .eq("offre_id", id)
      .order("created_at", { ascending: false })
      .returns<CandidatureBiz[]>(),
  ]);
  if (!offre || (!admin && offre.business_id !== profil.id)) notFound();
  const candidatures = await avecWhatsApp(supabase, brutes ?? []);
  const commerce = offre.businesses?.profiles?.nom ?? profil.nom;

  return (
    <EspaceBusiness actif={admin ? "/admin?statut=commerces" : "/business"} admin={admin}>
      <Link href={admin ? `/admin/commerces/${offre.business_id}` : "/business"} className="text-[11px] text-or-fonce">
        ← {admin ? commerce : "Dashboard"}
      </Link>

      <section className="carte mt-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-titre text-2xl leading-tight">{offre.titre}</h1>
          <BadgeStatut statut={offre.statut} />
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {offre.niche && <span className="tag-or">{offre.niche}</span>}
          {offre.ville && <span className="tag-ville">📍 {offre.ville}</span>}
        </div>
        {offre.description && <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed">{offre.description}</p>}
        {offre.budget && <p className="mt-3 text-xs"><span className="label-or">Budget</span> · {offre.budget}</p>}

        <Link href={`/business/offres/${offre.id}/modifier`} className="btn-secondaire mt-4 w-full !py-2.5">
          ✎ Modifier l&apos;offre
        </Link>
        <div className="mt-2 flex gap-2">
          {offre.statut !== "publiee" && <Statut id={offre.id} statut="publiee" label="Publier" primaire />}
          {offre.statut === "publiee" && <Statut id={offre.id} statut="fermee" label="Fermer l'offre" confirmation="Fermer l'offre ? Elle ne sera plus visible par les influenceurs." />}
          {offre.statut === "publiee" && <Statut id={offre.id} statut="brouillon" label="Repasser en brouillon" />}
        </div>
      </section>

      <section className="mt-5">
        <EnTeteSection titre={`Candidatures (${candidatures.length})`} />
        {!candidatures.length && (
          <Vide texte={offre.statut === "publiee" ? "Pas encore de candidature. Elles arrivent ici dès qu'un influenceur postule." : "Publie l'offre pour recevoir des candidatures."} />
        )}
        <div className="space-y-2">
          {candidatures.map((c) => (
            <CarteCandidature key={c.id} c={c} montrerOffre={false} expediteur={commerce} />
          ))}
        </div>
      </section>
    </EspaceBusiness>
  );
}

function Statut({ id, statut, label, primaire, confirmation }: { id: string; statut: string; label: string; primaire?: boolean; confirmation?: string }) {
  return (
    <form action={changerStatutOffre} className="flex-1">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="statut" value={statut} />
      <BoutonEnvoi className={`${primaire ? "btn-primaire" : "btn-secondaire"} w-full`} confirmation={confirmation}>
        {label}
      </BoutonEnvoi>
    </form>
  );
}
