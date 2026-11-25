import { exigerProfil } from "@/lib/auth";
import { EspaceBusiness } from "../../composants";
import { FormOffre } from "./form";

export default async function NouvelleOffre() {
  const { supabase, profil } = await exigerProfil(["business"]);
  const { data: biz } = await supabase.from("businesses").select("categorie").eq("id", profil.id).single();

  return (
    <EspaceBusiness actif="/business/offres/nouvelle">
      <h1 className="font-titre text-3xl">Nouvelle offre</h1>
      <p className="mb-4 text-[11px] text-muted">Décris la collab que tu proposes. Les influenceurs intéressés postuleront, et tu choisis.</p>
      <FormOffre villeParDefaut={profil.ville ?? ""} categorie={biz?.categorie ?? ""} />
    </EspaceBusiness>
  );
}
