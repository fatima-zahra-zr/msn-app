"use server";

import { revalidatePath } from "next/cache";
import { exigerProfil } from "@/lib/auth";

export type EtatForm = { erreur?: string; ok?: string } | null;
const txt = (f: FormData, k: string) => String(f.get(k) ?? "").trim() || null;

export async function majProfil(_: EtatForm, form: FormData): Promise<EtatForm> {
  const { supabase, profil } = await exigerProfil();
  const nom = txt(form, "nom");
  if (!nom) return { erreur: "Le nom est obligatoire." };

  const { error } = await supabase
    .from("profiles")
    .update({ nom, ville: txt(form, "ville"), instagram: txt(form, "instagram"), bio: txt(form, "bio") })
    .eq("id", profil.id);
  if (error) return { erreur: "Enregistrement impossible." };

  if (profil.role === "influenceur") {
    const abonnes = Number(String(form.get("abonnes") ?? "").replace(/\D/g, "")) || null;
    await supabase.from("influenceurs").update({ niche: txt(form, "niche"), abonnes }).eq("id", profil.id);
  } else if (profil.role === "business") {
    await supabase
      .from("businesses")
      .update({ categorie: txt(form, "categorie"), site_web: txt(form, "site_web") })
      .eq("id", profil.id);
  }

  revalidatePath("/", "layout");
  return { ok: "Profil enregistré ✓" };
}
