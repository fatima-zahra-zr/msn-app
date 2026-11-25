import { notFound } from "next/navigation";
import { exigerProfil } from "@/lib/auth";
import { TopBar, formatAbonnes } from "@/components/ui";
import { RetourArriere } from "./retour";

type Fiche = {
  id: string;
  niche: string | null;
  abonnes: number | null;
  profiles: { nom: string; ville: string | null; instagram: string | null; bio: string | null } | null;
};

/** Fiche influenceur : visible par les business et l'admin */
export default async function FicheInfluenceur(props: PageProps<"/influenceurs/[id]">) {
  const { id } = await props.params;
  const { supabase } = await exigerProfil(["business", "admin"]);

  const [{ data: inf }, { data: collabs }] = await Promise.all([
    supabase
      .from("influenceurs")
      .select("id, niche, abonnes, profiles(nom, ville, instagram, bio)")
      .eq("id", id)
      .single<Fiche>(),
    supabase.from("candidatures").select("id").eq("influenceur_id", id).eq("statut", "acceptee"),
  ]);
  if (!inf?.profiles) notFound();
  const p = inf.profiles;
  const insta = p.instagram?.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");

  return (
    <>
      <TopBar />
      <main className="flex-1 px-4 pb-8 pt-3">
        <RetourArriere />
        <section className="carte mt-3 overflow-hidden">
          <div className="bg-gradient-to-b from-or-clair to-surface px-5 pb-4 pt-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-or/25 bg-or/10 font-titre text-4xl text-or-fonce">
              {p.nom.slice(0, 1).toUpperCase()}
            </div>
            <h1 className="mt-3 font-titre text-3xl">{p.nom}</h1>
            <div className="mt-2 flex justify-center gap-1">
              {inf.niche && <span className="tag-or">{inf.niche}</span>}
              {p.ville && <span className="tag-ville">📍 {p.ville}</span>}
            </div>
          </div>
          <div className="grid grid-cols-2 border-y border-bordure text-center">
            <div className="border-r border-bordure py-3">
              <div className="text-xl font-bold text-or-fonce">{formatAbonnes(inf.abonnes)}</div>
              <div className="text-[9px] text-muted">Abonnés</div>
            </div>
            <div className="py-3">
              <div className="text-xl font-bold text-or-fonce">{collabs?.length ?? 0}</div>
              <div className="text-[9px] text-muted">Collabs MSN</div>
            </div>
          </div>
          <div className="p-5">
            {p.bio ? <p className="whitespace-pre-line text-[13px] leading-relaxed">{p.bio}</p> : <p className="text-xs text-muted">Pas encore de bio.</p>}
            {insta && (
              <a href={`https://instagram.com/${insta}`} target="_blank" rel="noopener noreferrer" className="btn-secondaire mt-4 w-full">
                Voir @{insta} sur Instagram
              </a>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
