"use server";

import { revalidatePath } from "next/cache";
import { exigerProfil } from "@/lib/auth";
import { envoyerEmail } from "@/lib/email";

export async function deciderCompte(form: FormData) {
  const { supabase } = await exigerProfil(["admin"]);
  const id = String(form.get("id"));
  const statut = form.get("statut") === "valide" ? "valide" : form.get("statut") === "refuse" ? "refuse" : "en_attente";

  const { data: compte } = await supabase.from("profiles").update({ statut }).eq("id", id).select("nom, role").single();

  if (compte && statut === "valide") {
    const { data: email } = await supabase.rpc("email_de", { uid: id });
    if (email) {
      await envoyerEmail(
        email,
        "🎉 Ton compte MSN est activé !",
        compte.role === "business"
          ? `Bienvenue sur MSN, ${compte.nom} ! Votre compte est validé : vous pouvez publier votre première offre de collaboration et recevoir des candidatures d'influenceurs.`
          : `Bienvenue sur MSN, ${compte.nom} ! Ton compte est validé : découvre les offres des commerces et postule à celles qui te correspondent.`,
      );
    }
  }
  revalidatePath("/admin");
}
