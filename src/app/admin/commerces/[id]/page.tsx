import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerProfil } from "@/lib/auth";
import { Avatar, BadgeStatut, EnTeteSection, Vide } from "@/components/ui";
import { EspaceBusiness } from "@/app/business/composants";
import { PROFIL_COLS, type Profil } from "@/lib/types";

/** Fiche d'un commerce côté admin : ses offres, et publier pour lui */
export default async function CommerceAdmin(props: PageProps<"/admin/commerces/[id]">) {
  const { id } = await props.params;
  const { supabase } = await exigerProfil(["admin"]);

  const [{ data: commerce }, { data: biz }, { data: offres }, { data: email }, { data: whatsapp }] = await Promise.all([
    supabase.from("profiles").select(PROFIL_COLS).eq("id", id).eq("role", "business").single<Profil>(),
    supabase.from("businesses").select("categorie").eq("id", id).single(),
    supabase
      .from("offres")
      .select("id, titre, statut, candidatures(statut)")
      .eq("business_id", id)
      .order("created_at", { ascending: false })
      .returns<{ id: string; titre: string; statut: string; candidatures: { statut: string }[] }[]>(),
    supabase.rpc("email_de", { uid: id }),
    supabase.rpc("whatsapp_de", { uid: id }),
  ]);
  if (!commerce) notFound();

  return (
    <EspaceBusiness actif="/admin?statut=commerces" admin>
      <Link href="/admin?statut=commerces" className="text-[11px] text-or-fonce">← Commerces</Link>

      <section className="carte mt-3 flex items-center gap-3 p-4">
        <Avatar texte={commerce.nom} photo={commerce.photo_url} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-titre text-2xl leading-tight">{commerce.nom}</h1>
          <div className="truncate text-[10px] text-muted">
            {[biz?.categorie, commerce.ville, commerce.instagram].filter(Boolean).join(" · ")}
          </div>
          <div className="truncate text-[10px] text-muted">{[email, whatsapp].filter(Boolean).join(" · ")}</div>
        </div>
        <BadgeStatut statut={commerce.statut} />
      </section>

      <Link href={`/business/offres/nouvelle?pour=${commerce.id}`} className="btn-primaire mt-3 w-full">
        + Publier une offre pour ce commerce
      </Link>

      <section className="mt-5">
        <EnTeteSection titre={`Ses offres (${offres?.length ?? 0})`} />
        {!offres?.length && <Vide texte="Aucune offre pour l'instant." />}
        <div className="space-y-2">
          {offres?.map((o) => {
            const attente = o.candidatures.filter((c) => c.statut === "en_attente").length;
            return (
              <Link key={o.id} href={`/business/offres/${o.id}`} className="carte flex items-center justify-between p-3">
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-semibold">{o.titre}</div>
                  <div className="text-[10px] text-muted">
                    {o.candidatures.length} candidature(s){attente ? ` · ${attente} à traiter` : ""}
                  </div>
                </div>
                <BadgeStatut statut={o.statut} />
              </Link>
            );
          })}
        </div>
      </section>
    </EspaceBusiness>
  );
}
