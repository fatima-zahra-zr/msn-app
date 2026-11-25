import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Liens reçus par email (confirmation d'inscription, mot de passe oublié) :
 * Supabase renvoie ici avec ?code=…, et éventuellement ?next=/page-suivante
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") ?? "/";
  // sécurité : on ne redirige que vers une page de l'app (pas vers un autre site)
  const destination = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(destination, request.url));
  }
  return NextResponse.redirect(new URL("/connexion?lien=expire", request.url));
}
