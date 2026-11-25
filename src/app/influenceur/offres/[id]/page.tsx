import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerProfil } from "@/lib/auth";
import { BadgeStatut } from "@/components/ui";
import { EspaceInfluenceur } from "../../nav";
import { FormPostuler } from "./form";

type OffreDetail = {
  id: string;
  titre: string;
  description: string | null;
  niche: string | null;
  ville: string | null;
  budget: string | null;
  businesses: {
    categorie: string | null;
    site_web: string | null;
    profiles: { nom: string; instagram: string | null; bio: string | null } | null;
  } | null;
};

export default async function DetailOffre(props: PageProps<"/influenceur/offres/[id]">) {
  const { id } = await props.params;
  const { supabase, profil } = await exigerProfil(["influenceur"]);

  const [{ data: offre }, { data: candidature }] = await Promise.all([
    supabase
      .from("offres")
      .select("id, titre, description, niche, ville, budget, businesses(categorie, site_web, profiles(nom, instagram, bio))")
      .eq("id", id)
      .single<OffreDetail>(),
    supabase.from("candidatures").select("statut").eq("offre_id", id).eq("influenceur_id", profil.id).maybeSingle(),
  ]);
  if (!offre) notFound();
  const biz = offre.businesses;

  return (
    <EspaceInfluenceur actif="/influenceur">
      <Link href="/influenceur" className="text-[11px] text-or">← Toutes les offres</Link>

      <section className="carte mt-3 p-5">
        <p className="label-or">{biz?.categorie ?? "Commerce"}</p>
        <h1 className="mt-1 font-titre text-3xl leading-tight">{biz?.profiles?.nom}</h1>
        {biz?.profiles?.instagram && <p className="mt-1 text-xs text-muted">{biz.profiles.instagram}</p>}

        <div className="my-4 h-px bg-bordure" />

        <h2 className="text-[15px] font-semibold">{offre.titre}</h2>
        <div className="mt-2 flex flex-wrap gap-1">
          {offre.niche && <span className="tag-or">{offre.niche}</span>}
          {offre.ville && <span className="tag-ville">📍 {offre.ville}</span>}
        </div>
        {offre.description && <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed">{offre.description}</p>}
        {offre.budget && (
          <p className="mt-4 rounded-xl bg-or-clair px-4 py-3 text-xs">
            <span className="label-or">Rémunération</span>
            <br />
            {offre.budget}
          </p>
        )}
      </section>

      <section className="mt-4">
        {candidature ? (
          <div className="carte flex items-center justify-between p-4">
            <span className="text-xs">Ta candidature</span>
            <BadgeStatut statut={candidature.statut} />
          </div>
        ) : (
          <FormPostuler offreId={offre.id} />
        )}
      </section>
    </EspaceInfluenceur>
  );
}
