import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase avec la clé « service role » : il contourne la sécurité de la base.
 * À utiliser UNIQUEMENT côté serveur, APRÈS avoir vérifié que l'utilisateur est admin
 * (exigerProfil(["admin"])). Sert à créer le compte d'un commerce à sa place.
 */
export function createAdminClient() {
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!cle) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, cle, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
