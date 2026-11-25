"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigerProfil } from "@/lib/auth";
import { envoyerEmail } from "@/lib/email";

export type EtatForm = { erreur?: string; ok?: string } | null;
const txt = (f: FormData, k: string) => String(f.get(k) ?? "").trim() || null;

/**
 * Crée OU modifie une offre.
 * - un business agit pour lui-même
 * - l'admin (Fz) agit pour le commerce indiqué dans le champ caché business_id
 */
export async function enregistrerOffre(_: EtatForm, form: FormData): Promise<EtatForm> {
  const { supabase, profil } = await exigerProfil(["business", "admin"]);
  const id = txt(form, "id");
  const titre = txt(form, "titre");
  if (!titre) return { erreur: "Donne un titre à l'offre (ex : Story + Reel au restaurant)." };

  const champs = {
    titre,
    description: txt(form, "description"),
    niche: txt(form, "niche"),
    ville: txt(form, "ville"),
    budget: txt(form, "budget"),
  };

  if (id) {
    // modification : le statut ne change pas (la sécurité de la base vérifie le propriétaire)
    const { data, error } = await supabase.from("offres").update(champs).eq("id", id).select("id").single();
    if (error || !data) return { erreur: "Modification impossible." };
  } else {
    const businessId = profil.role === "admin" ? txt(form, "business_id") : profil.id;
    if (!businessId) return { erreur: "Commerce manquant." };
    const { data, error } = await supabase
      .from("offres")
      .insert({ ...champs, business_id: businessId, statut: form.get("publier") === "oui" ? "publiee" : "brouillon" })
      .select("id")
      .single();
    if (error || !data) return { erreur: "Création impossible pour le moment." };
    revalidatePath("/", "layout");
    redirect(`/business/offres/${data.id}`);
  }

  revalidatePath("/", "layout");
  redirect(`/business/offres/${id}`);
}

export async function changerStatutOffre(form: FormData) {
  const { supabase } = await exigerProfil(["business", "admin"]);
  const statut = String(form.get("statut"));
  if (!["brouillon", "publiee", "fermee"].includes(statut)) return;
  // la base n'autorise que le propriétaire de l'offre (ou l'admin)
  await supabase.from("offres").update({ statut }).eq("id", String(form.get("id")));
  revalidatePath("/", "layout");
}

export async function deciderCandidature(form: FormData) {
  const { supabase } = await exigerProfil(["business", "admin"]);
  const id = String(form.get("id"));
  const decision = form.get("decision") === "acceptee" ? "acceptee" : "refusee";

  const { data: cand } = await supabase
    .from("candidatures")
    .update({ statut: decision })
    .eq("id", id)
    .select("influenceur_id, offres(titre, businesses(profiles(nom)))")
    .single<{
      influenceur_id: string;
      offres: { titre: string; businesses: { profiles: { nom: string } | null } | null } | null;
    }>();

  // notification email à l'influenceur
  if (cand) {
    const { data: email } = await supabase.rpc("email_de", { uid: cand.influenceur_id });
    const titre = cand.offres?.titre ?? "ta candidature";
    const commerce = cand.offres?.businesses?.profiles?.nom ?? "Le commerce";
    if (email) {
      await envoyerEmail(
        email,
        decision === "acceptee" ? `🎉 Candidature acceptée : ${titre}` : `Candidature : ${titre}`,
        decision === "acceptee"
          ? `Bonne nouvelle ! ${commerce} a accepté ta candidature pour « ${titre} ». Ouvre MSN pour le contacter sur WhatsApp et organiser la collab.`
          : `${commerce} n'a pas retenu ta candidature pour « ${titre} » cette fois-ci. D'autres offres t'attendent sur MSN !`,
      );
    }
  }
  revalidatePath("/", "layout");
}
