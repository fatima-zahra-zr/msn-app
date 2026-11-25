export type Role = "influenceur" | "business" | "admin";
export type StatutCompte = "en_attente" | "valide" | "refuse";
export type StatutOffre = "brouillon" | "publiee" | "fermee";
export type StatutCandidature = "en_attente" | "acceptee" | "refusee";

export type Profil = {
  id: string;
  role: Role;
  statut: StatutCompte;
  nom: string;
  ville: string | null;
  instagram: string | null;
  bio: string | null;
  photo_url: string | null;
  created_at: string;
};

/** Colonnes lisibles d'un profil (l'email est protégé : utiliser la fonction email_de) */
export const PROFIL_COLS = "id, role, statut, nom, ville, instagram, bio, photo_url, created_at";
// Le WhatsApp aussi est protégé : fonction SQL whatsapp_de (visible après une collab acceptée)

export type Offre = {
  id: string;
  business_id: string;
  titre: string;
  description: string | null;
  niche: string | null;
  ville: string | null;
  budget: string | null;
  statut: StatutOffre;
  created_at: string;
};

export const NICHES = ["Food", "Lifestyle", "Beauté", "Sport", "Humour", "Mode", "Voyage"];
export const VILLES = ["Casablanca", "Rabat", "Marrakech", "Tanger", "Agadir", "Fès"];
export const CATEGORIES = ["Restaurant / Café", "Beauté / Spa", "Sport / Fitness", "Mode", "Hôtel", "E-commerce", "Autre"];
