import { redirect } from "next/navigation";
import { accueilDuRole, exigerProfil } from "@/lib/auth";

/** Page d'accueil : envoie chacun vers son espace */
export default async function Accueil() {
  const { profil } = await exigerProfil();
  redirect(accueilDuRole(profil.role));
}
