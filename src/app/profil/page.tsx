import { exigerProfil } from "@/lib/auth";
import { BottomNav, TopBar } from "@/components/ui";
import { seDeconnecter } from "../(auth)/actions";
import { FormProfil } from "./form";

const NAV = {
  influenceur: [
    { href: "/influenceur", icone: "⚡", label: "Offres" },
    { href: "/influenceur/candidatures", icone: "📋", label: "Candidatures" },
    { href: "/profil", icone: "👤", label: "Profil" },
  ],
  business: [
    { href: "/business", icone: "📊", label: "Dashboard" },
    { href: "/business/offres/nouvelle", icone: "📢", label: "Publier" },
    { href: "/profil", icone: "👤", label: "Profil" },
  ],
  admin: [
    { href: "/admin", icone: "🛡️", label: "Admin" },
    { href: "/profil", icone: "👤", label: "Profil" },
  ],
};

export default async function Profil() {
  const { supabase, profil } = await exigerProfil();

  let extra: Record<string, string | number | null> = {};
  if (profil.role === "influenceur") {
    const { data } = await supabase.from("influenceurs").select("niche, abonnes").eq("id", profil.id).single();
    extra = data ?? {};
  } else if (profil.role === "business") {
    const { data } = await supabase.from("businesses").select("categorie, site_web").eq("id", profil.id).single();
    extra = data ?? {};
  }

  return (
    <>
      <TopBar badge={profil.role === "business" ? "Business" : profil.role === "admin" ? "Admin" : undefined} />
      <main className="flex-1 px-4 pb-6 pt-4">
        <h1 className="font-titre text-3xl">Mon profil</h1>
        <p className="mb-4 text-[11px] text-muted">Ces infos sont visibles par les {profil.role === "business" ? "influenceurs" : "commerces"} de MSN.</p>
        <FormProfil role={profil.role} valeurs={{ ...profil, ...extra }} />
        <form action={seDeconnecter} className="mt-6">
          <button className="btn-secondaire w-full">Se déconnecter</button>
        </form>
      </main>
      <BottomNav items={NAV[profil.role]} actif="/profil" />
    </>
  );
}
