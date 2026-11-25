"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { envoyerEmail } from "@/lib/email";

export type EtatForm = { erreur?: string; ok?: string } | null;

const txt = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function seConnecter(_: EtatForm, form: FormData): Promise<EtatForm> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: txt(form, "email"),
    password: String(form.get("password") ?? ""),
  });
  if (error) {
    return {
      erreur: error.message.includes("Email not confirmed")
        ? "Confirme d'abord ton email (regarde ta boîte de réception)."
        : "Email ou mot de passe incorrect.",
    };
  }
  redirect("/");
}

export async function sInscrire(_: EtatForm, form: FormData): Promise<EtatForm> {
  const role = txt(form, "role") === "business" ? "business" : "influenceur";
  const email = txt(form, "email");
  const password = String(form.get("password") ?? "");
  const nom = txt(form, "nom");

  if (!nom) return { erreur: "Indique ton nom (ou le nom de ton commerce)." };
  if (password.length < 8) return { erreur: "Le mot de passe doit faire au moins 8 caractères." };

  const origine = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origine}/auth/callback`,
      // lu par le trigger « creer_profil » en base
      data: {
        role,
        nom,
        ville: txt(form, "ville"),
        instagram: txt(form, "instagram"),
        niche: txt(form, "niche"),
        abonnes: txt(form, "abonnes"),
        categorie: txt(form, "categorie"),
      },
    },
  });
  if (error) {
    return {
      erreur: error.message.includes("already registered")
        ? "Un compte existe déjà avec cet email."
        : `Inscription impossible : ${error.message}`,
    };
  }

  // prévient l'admin qu'un compte attend sa validation
  if (process.env.ADMIN_EMAIL) {
    await envoyerEmail(
      process.env.ADMIN_EMAIL,
      `Nouveau compte ${role} à valider : ${nom}`,
      `${nom} (${email}) vient de s'inscrire comme ${role}. Valide-le depuis l'espace admin.`,
    );
  }

  // si la confirmation d'email est désactivée dans Supabase, on est déjà connecté
  if (data.session) redirect("/");
  return { ok: "Compte créé ! Clique sur le lien reçu par email pour confirmer ton adresse." };
}

export async function seDeconnecter() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
