import Link from "next/link";
import { exigerProfil } from "@/lib/auth";
import { BadgeStatut, BoutonWhatsApp, EnTeteSection, Vide } from "@/components/ui";
import { BoutonEnvoi } from "@/components/client";
import { EspaceInfluenceur } from "../nav";
import { retirerCandidature } from "../actions";

type Ligne = {
  id: string;
  statut: string;
  created_at: string;
  offres: { id: string; titre: string; business_id: string; businesses: { profiles: { nom: string } | null } | null } | null;
};

export default async function MesCandidatures() {
  const { supabase, profil } = await exigerProfil(["influenceur"]);
  const { data } = await supabase
    .from("candidatures")
    .select("id, statut, created_at, offres(id, titre, business_id, businesses(profiles(nom)))")
    .eq("influenceur_id", profil.id)
    .order("created_at", { ascending: false })
    .returns<Ligne[]>();

  // WhatsApp du commerce, seulement pour les candidatures acceptées (fonction protégée)
  const whatsapps = new Map<string, string | null>();
  await Promise.all(
    (data ?? [])
      .filter((c) => c.statut === "acceptee" && c.offres)
      .map(async (c) => {
        const { data: w } = await supabase.rpc("whatsapp_de", { uid: c.offres!.business_id });
        whatsapps.set(c.id, (w as string | null) ?? null);
      }),
  );

  return (
    <EspaceInfluenceur actif="/influenceur/candidatures">
      <EnTeteSection titre="Mes candidatures" />
      {!data?.length && <Vide texte="Tu n'as pas encore postulé. Va voir les offres disponibles !" />}
      <div className="space-y-2">
        {data?.map((c) => (
          <div key={c.id} className="carte p-3">
          <div className="flex items-center gap-3">
            <Link href={c.offres ? `/influenceur/offres/${c.offres.id}` : "#"} className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">{c.offres?.businesses?.profiles?.nom}</div>
              <div className="truncate text-[11px] text-muted">{c.offres?.titre}</div>
              <div className="mt-1 text-[10px] text-muted">{new Date(c.created_at).toLocaleDateString("fr-FR")}</div>
            </Link>
            <div className="flex flex-col items-end gap-2">
              <BadgeStatut statut={c.statut} />
              {c.statut === "en_attente" && (
                <form action={retirerCandidature}>
                  <input type="hidden" name="id" value={c.id} />
                  <BoutonEnvoi
                    className="text-[10px] text-muted underline"
                    enCours="…"
                    confirmation="Retirer cette candidature ?"
                  >
                    Retirer
                  </BoutonEnvoi>
                </form>
              )}
            </div>
          </div>
          {c.statut === "acceptee" && (
            <BoutonWhatsApp
              numero={whatsapps.get(c.id)}
              message={`Bonjour ${c.offres?.businesses?.profiles?.nom ?? ""}, c'est ${profil.nom} (via MSN) : ma candidature pour « ${c.offres?.titre ?? ""} » a été acceptée. On organise la collab ?`}
            />
          )}
          </div>
        ))}
      </div>
    </EspaceInfluenceur>
  );
}
