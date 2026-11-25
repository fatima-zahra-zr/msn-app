"use server";

import { revalidatePath } from "next/cache";
import { exigerProfil } from "@/lib/auth";
import { envoyerEmail } from "@/lib/email";

export type EtatForm = { erreur?: string; ok?: string } | null;

export async function postuler(_: EtatForm, form: FormData): Promise<EtatForm> {
  const { supabase, profil } = await exigerProfil(["influenceur"]);
  const offreId = String(form.get("offre_id"));
  const message = String(form.get("message") ?? "").trim() || null;

  const { error } = await supabase
    .from("candidatures")
    .insert({ offre_id: offreId, influenceur_id: profil.id, message });

  if (error) {
    return { erreur: error.code === "23505" ? "Tu as déjà postulé à cette offre." : "Candidature impossible pour le moment." };
  }

  // prévient le business (son email est accessible via la fonction protégée email_de)
  const { data: offre } = await supabase.from("offres").select("titre, business_id").eq("id", offreId).single();
  if (offre) {
    const { data: email } = await supabase.rpc("email_de", { uid: offre.business_id });
    if (email) {
      await envoyerEmail(
        email,
        `Nouvelle candidature pour « ${offre.titre} »`,
        `${profil.nom} vient de postuler à votre offre « ${offre.titre} ». Consultez son profil et répondez depuis votre espace MSN.`,
      );
    }
  }

  revalidatePath("/influenceur", "layout");
  return { ok: "Candidature envoyée ! Le commerce va l'examiner." };
}

export async function retirerCandidature(form: FormData) {
  const { supabase, profil } = await exigerProfil(["influenceur"]);
  await supabase.from("candidatures").delete().eq("id", String(form.get("id"))).eq("influenceur_id", profil.id);
  revalidatePath("/influenceur", "layout");
}
