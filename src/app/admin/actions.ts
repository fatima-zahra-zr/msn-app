"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
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

export type EtatForm = { erreur?: string; ok?: string } | null;
const txt = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/**
 * Fz crée le compte d'un commerce à sa place (le commerce n'a rien à remplir).
 * Le compte est validé directement. Le commerce pourra se connecter plus tard
 * via « Mot de passe oublié » avec son email.
 */
export async function creerCommerce(_: EtatForm, form: FormData): Promise<EtatForm> {
  await exigerProfil(["admin"]);
  const nom = txt(form, "nom");
  const email = txt(form, "email").toLowerCase();
  if (!nom || !email) return { erreur: "Nom et email du commerce sont obligatoires." };

  const service = createAdminClient();
  if (!service) {
    return { erreur: "Il manque la variable SUPABASE_SERVICE_ROLE_KEY dans Vercel (voir le README)." };
  }

  const { data, error } = await service.auth.admin.createUser({
    email,
    email_confirm: true,
    password: crypto.randomUUID() + crypto.randomUUID(), // inconnu de tous : le commerce le changera
    user_metadata: {
      role: "business",
      nom,
      ville: txt(form, "ville"),
      categorie: txt(form, "categorie"),
      instagram: txt(form, "instagram"),
      whatsapp: txt(form, "whatsapp"),
    },
  });
  if (error || !data.user) {
    return { erreur: error?.message.includes("already") ? "Un compte existe déjà avec cet email." : "Création impossible pour le moment." };
  }
  // le profil est créé par la base (trigger) : on le valide tout de suite
  await service.from("profiles").update({ statut: "valide" }).eq("id", data.user.id);

  revalidatePath("/admin");
  redirect(`/admin/commerces/${data.user.id}`);
}
