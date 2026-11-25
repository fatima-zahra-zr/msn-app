import Link from "next/link";
import { exigerProfil } from "@/lib/auth";
import { Avatar, BadgeStatut, BottomNav, Kpi, TopBar, Vide, formatAbonnes } from "@/components/ui";
import { BoutonEnvoi } from "@/components/client";
import { PROFIL_COLS, type Profil, type StatutCompte } from "@/lib/types";
import { deciderCompte } from "./actions";

const ONGLETS: { statut: StatutCompte; label: string }[] = [
  { statut: "en_attente", label: "À valider" },
  { statut: "valide", label: "Validés" },
  { statut: "refuse", label: "Refusés" },
];

export default async function Admin(props: PageProps<"/admin">) {
  const { supabase } = await exigerProfil(["admin"]);
  const { statut: s } = await props.searchParams;
  const onglet: StatutCompte = s === "valide" || s === "refuse" ? s : "en_attente";

  const [{ data: comptes }, { data: tous }, { data: infs }, { data: bizs }, { count: nbOffres }] = await Promise.all([
    supabase.from("profiles").select(PROFIL_COLS).eq("statut", onglet).neq("role", "admin").order("created_at", { ascending: false }).returns<Profil[]>(),
    supabase.from("profiles").select("role, statut").neq("role", "admin"),
    supabase.from("influenceurs").select("id, niche, abonnes"),
    supabase.from("businesses").select("id, categorie"),
    supabase.from("offres").select("id", { count: "exact", head: true }).eq("statut", "publiee"),
  ]);

  // emails (lisibles uniquement par l'admin, via la fonction protégée)
  const emails = new Map<string, string>();
  await Promise.all(
    (comptes ?? []).map(async (c) => {
      const { data } = await supabase.rpc("email_de", { uid: c.id });
      if (data) emails.set(c.id, data);
    }),
  );
  const infoInf = new Map((infs ?? []).map((i) => [i.id, i]));
  const infoBiz = new Map((bizs ?? []).map((b) => [b.id, b]));
  const valides = (tous ?? []).filter((t) => t.statut === "valide");
  const compte = (st: string) => (tous ?? []).filter((t) => t.statut === st).length;

  return (
    <>
      <TopBar badge="Admin" />
      <main className="flex-1 px-4 pb-6 pt-3">
        <h1 className="mb-3 font-titre text-2xl">Espace admin</h1>
        <div className="mb-4 flex gap-2">
          <Kpi valeur={valides.filter((v) => v.role === "influenceur").length} label="Influenceurs" />
          <Kpi valeur={valides.filter((v) => v.role === "business").length} label="Business" />
          <Kpi valeur={nbOffres ?? 0} label="Offres actives" />
        </div>

        <nav className="mb-3 flex gap-2">
          {ONGLETS.map((o) => (
            <Link
              key={o.statut}
              href={o.statut === "en_attente" ? "/admin" : `/admin?statut=${o.statut}`}
              className={`rounded-full px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[1px] ${
                onglet === o.statut ? "bg-or text-white" : "border border-bordure bg-surface text-muted"
              }`}
            >
              {o.label} ({compte(o.statut)})
            </Link>
          ))}
        </nav>

        {!comptes?.length && <Vide texte="Rien ici pour le moment." />}
        <div className="space-y-2">
          {comptes?.map((c) => {
            const inf = infoInf.get(c.id);
            const biz = infoBiz.get(c.id);
            const details =
              c.role === "influenceur"
                ? [inf?.niche, inf?.abonnes ? `${formatAbonnes(inf.abonnes)} abonnés` : null]
                : [biz?.categorie];
            return (
              <div key={c.id} className="carte p-3">
                <div className="flex items-start gap-3">
                  <Avatar texte={c.nom} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-semibold">{c.nom}</span>
                      <span className="tag-or">{c.role}</span>
                    </div>
                    <div className="truncate text-[10px] text-muted">{emails.get(c.id)}</div>
                    <div className="text-[10px] text-muted">
                      {[...details, c.ville, c.instagram].filter(Boolean).join(" · ")}
                    </div>
                    <div className="text-[9px] text-muted">Inscrit le {new Date(c.created_at).toLocaleDateString("fr-FR")}</div>
                  </div>
                  {onglet !== "en_attente" && <BadgeStatut statut={c.statut} />}
                </div>
                <div className="mt-3 flex gap-2">
                  {c.role === "influenceur" && (
                    <Link href={`/influenceurs/${c.id}`} className="btn-secondaire flex-1 !py-2">Fiche</Link>
                  )}
                  {onglet !== "valide" && <Action id={c.id} statut="valide" label="Valider" primaire />}
                  {onglet !== "refuse" && <Action id={c.id} statut="refuse" label="Refuser" confirmation={`Refuser le compte de ${c.nom} ?`} />}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <BottomNav
        items={[
          { href: "/admin", icone: "🛡️", label: "Admin" },
          { href: "/profil", icone: "👤", label: "Profil" },
        ]}
        actif="/admin"
      />
    </>
  );
}

function Action({ id, statut, label, primaire, confirmation }: { id: string; statut: string; label: string; primaire?: boolean; confirmation?: string }) {
  return (
    <form action={deciderCompte} className="flex-1">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="statut" value={statut} />
      <BoutonEnvoi className={`${primaire ? "btn-primaire" : "btn-secondaire"} w-full !py-2`} confirmation={confirmation}>
        {label}
      </BoutonEnvoi>
    </form>
  );
}
