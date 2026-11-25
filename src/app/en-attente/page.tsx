import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoGrand } from "@/components/ui";
import { seDeconnecter } from "../(auth)/actions";
import { PROFIL_COLS, type Profil } from "@/lib/types";

export default async function EnAttente() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const { data: profil } = await supabase.from("profiles").select(PROFIL_COLS).eq("id", user.id).single<Profil>();
  if (profil?.statut === "valide" || profil?.role === "admin") redirect("/");

  const refuse = profil?.statut === "refuse";
  return (
    <main className="flex flex-1 flex-col px-6 pt-6">
      <LogoGrand />
      <div className="carte p-6 text-center">
        <div className="text-3xl">{refuse ? "🙏" : "⏳"}</div>
        <h1 className="mt-3 font-titre text-2xl">{refuse ? "Compte non retenu" : "Compte en cours de validation"}</h1>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          {refuse
            ? "Ton inscription n'a pas été retenue pour le moment. Écris-nous sur Instagram @moroccansocialnetwork pour en parler."
            : `Merci ${profil?.nom ?? ""} ! L'équipe MSN vérifie ton profil. Tu recevras un email dès que ton compte sera activé.`}
        </p>
      </div>
      <form action={seDeconnecter} className="mt-6">
        <button className="btn-secondaire w-full">Se déconnecter</button>
      </form>
    </main>
  );
}
