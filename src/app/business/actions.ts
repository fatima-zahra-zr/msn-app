"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigerProfil } from "@/lib/auth";
import { envoyerEmail } from "@/lib/email";

export type EtatForm = { erreur?: string; ok?: string } | null;
const txt = (f: FormData, k: string) => String(f.get(k) ?? "").trim() || null;

export async function creerOffre(_: EtatForm, form: FormData): Promise<EtatForm> {
  const { supabase, profil } = await exigerProfil(["business"]);
  const titre = txt(form, "titre");
  if (!titre) return { erreur: "Donne un titre à ton offre (ex : Story + Reel au restaurant)." };

  const { data, error } = await supabase
    .from("offres")
    .insert({
      business_id: profil.id,
      titre,
      description: txt(form, "description"),
      niche: txt(form, "niche"),
      ville: txt(form, "ville"),
      budget: txt(form, "budget"),
      statut: form.get("publier") === "oui" ? "publiee" : "brouillon",
    })
    .select("id")
    .single();
  if (error || !data) return { erreur: "Création impossible pour le moment." };

  revalidatePath("/business");
  redirect(`/business/offres/${data.id}`);
}

export async function changerStatutOffre(form: FormData) {
  const { supabase, profil } = await exigerProfil(["business"]);
  const statut = String(form.get("statut"));
  if (!["brouillon", "publiee", "fermee"].includes(statut)) return;
  await supabase.from("offres").update({ statut }).eq("id", String(form.get("id"))).eq("business_id", profil.id);
  revalidatePath("/business", "layout");
}

export async function deciderCandidature(form: FormData) {
  const { supabase, profil } = await exigerProfil(["business"]);
  const id = String(form.get("id"));
  const decision = form.get("decision") === "acceptee" ? "acceptee" : "refusee";

  const { data: cand } = await supabase
    .from("candidatures")
    .update({ statut: decision })
    .eq("id", id)
    .select("influenceur_id, offres(titre)")
    .single<{ influenceur_id: string; offres: { titre: string } | null }>();

  // notification email à l'influenceur
  if (cand) {
    const { data: email } = await supabase.rpc("email_de", { uid: cand.influenceur_id });
    const titre = cand.offres?.titre ?? "votre candidature";
    if (email) {
      await envoyerEmail(
        email,
        decision === "acceptee" ? `🎉 Candidature acceptée : ${titre}` : `Candidature : ${titre}`,
        decision === "acceptee"
          ? `Bonne nouvelle ! ${profil.nom} a accepté ta candidature pour « ${titre} ». Le commerce va te contacter pour organiser la collab.`
          : `${profil.nom} n'a pas retenu ta candidature pour « ${titre} » cette fois-ci. D'autres offres t'attendent sur MSN !`,
      );
    }
  }
  revalidatePath("/business", "layout");
}
