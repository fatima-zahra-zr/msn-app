import { notFound } from "next/navigation";
import { exigerProfil } from "@/lib/auth";
import { EspaceBusiness } from "../../composants";
import { FormOffre } from "./form";

/** Nouvelle offre. L'admin peut publier pour un commerce : /business/offres/nouvelle?pour=<id du commerce> */
export default async function NouvelleOffre(props: PageProps<"/business/offres/nouvelle">) {
  const { supabase, profil } = await exigerProfil(["business", "admin"]);
  const { pour } = await props.searchParams;
  const admin = profil.role === "admin";
  const businessId = admin ? (typeof pour === "string" ? pour : null) : profil.id;
  if (!businessId) notFound();

  const { data: biz } = await supabase
    .from("businesses")
    .select("categorie, profiles(nom, ville)")
    .eq("id", businessId)
    .single<{ categorie: string | null; profiles: { nom: string; ville: string | null } | null }>();
  if (!biz) notFound();

  return (
    <EspaceBusiness actif={admin ? "/admin?statut=commerces" : "/business/offres/nouvelle"} admin={admin}>
      <h1 className="font-titre text-3xl">Nouvelle offre</h1>
      <p className="mb-4 text-[11px] text-muted">
        {admin
          ? `Tu publies pour ${biz.profiles?.nom}. Les candidatures arriveront dans son espace (et tu peux les gérer pour lui).`
          : "Décris la collab que tu proposes. Les influenceurs intéressés postuleront, et tu choisis."}
      </p>
      <FormOffre
        businessId={admin ? businessId : undefined}
        villeParDefaut={biz.profiles?.ville ?? ""}
        categorie={biz.categorie ?? ""}
      />
    </EspaceBusiness>
  );
}
