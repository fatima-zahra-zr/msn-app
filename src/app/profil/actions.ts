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
    .update({ nom, ville: txt(form, "ville"), instagram: txt(form, "instagram"), whatsapp: txt(form, "whatsapp"), bio: txt(form, "bio") })
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

const TYPES_PHOTO: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function majPhoto(_: EtatForm, form: FormData): Promise<EtatForm> {
  const { supabase, profil } = await exigerProfil();
  const fichier = form.get("photo");
  if (!(fichier instanceof File) || fichier.size === 0) return { erreur: "Choisis une photo." };
  const ext = TYPES_PHOTO[fichier.type];
  if (!ext) return { erreur: "Format accepté : JPG, PNG ou WEBP." };
  if (fichier.size > 4 * 1024 * 1024) return { erreur: "Photo trop lourde (4 Mo maximum)." };

  // rangée dans le dossier de l'utilisateur : avatars/<son id>/...
  const chemin = `${profil.id}/photo-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(chemin, fichier, { contentType: fichier.type });
  if (error) return { erreur: "Envoi de la photo impossible pour le moment." };

  const { data } = supabase.storage.from("avatars").getPublicUrl(chemin);
  await supabase.from("profiles").update({ photo_url: data.publicUrl }).eq("id", profil.id);

  // supprime l'ancienne photo
  const ancienne = profil.photo_url?.split("/avatars/")[1];
  if (ancienne) await supabase.storage.from("avatars").remove([ancienne]);

  revalidatePath("/", "layout");
  return { ok: "Photo mise à jour ✓" };
}
