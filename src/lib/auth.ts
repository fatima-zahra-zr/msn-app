import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PROFIL_COLS, type Profil, type Role } from "@/lib/types";

/** Page d'accueil de chaque rôle */
export function accueilDuRole(role: Role) {
  return role === "admin" ? "/admin" : role === "business" ? "/business" : "/influenceur";
}

/**
 * Récupère l'utilisateur connecté et son profil.
 * - pas connecté → /connexion
 * - compte pas encore validé → /en-attente
 * - mauvais rôle pour la page → renvoyé vers son espace
 */
export async function exigerProfil(roles?: Role[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profil } = await supabase.from("profiles").select(PROFIL_COLS).eq("id", user.id).single<Profil>();
  if (!profil) redirect("/connexion");
  if (profil.role !== "admin" && profil.statut !== "valide") redirect("/en-attente");
  if (roles && !roles.includes(profil.role)) redirect(accueilDuRole(profil.role));

  return { supabase, user, profil };
}
