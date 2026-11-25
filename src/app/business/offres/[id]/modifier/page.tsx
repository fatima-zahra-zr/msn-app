import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerProfil } from "@/lib/auth";
import { EspaceBusiness } from "../../../composants";
import { FormOffre, type OffreModifiable } from "../../nouvelle/form";

export default async function ModifierOffre(props: PageProps<"/business/offres/[id]/modifier">) {
  const { id } = await props.params;
  const { supabase, profil } = await exigerProfil(["business", "admin"]);
  const admin = profil.role === "admin";

  const { data: offre } = await supabase
    .from("offres")
    .select("id, business_id, titre, description, niche, ville, budget")
    .eq("id", id)
    .single<OffreModifiable & { business_id: string }>();
  if (!offre || (!admin && offre.business_id !== profil.id)) notFound();

  return (
    <EspaceBusiness actif={admin ? "/admin?statut=commerces" : "/business"} admin={admin}>
      <Link href={`/business/offres/${offre.id}`} className="text-[11px] text-or-fonce">← Retour à l&apos;offre</Link>
      <h1 className="mt-2 font-titre text-3xl">Modifier l&apos;offre</h1>
      <p className="mb-4 text-[11px] text-muted">Les influenceurs qui ont déjà postulé verront la nouvelle version.</p>
      <FormOffre offre={offre} />
    </EspaceBusiness>
  );
}
