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
  // onglet « Commerces » : tous les commerces validés, pour gérer leurs offres
  if (s === "commerces") return <OngletCommerces />;
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

        <nav className="mb-3 flex flex-wrap gap-2">
          {ONGLETS.map((o) => (
            <Link
              key={o.statut}
              href={o.statut === "en_attente" ? "/admin" : `/admin?statut=${o.statut}`}
              className={`rounded-full px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[1px] ${
                onglet === o.statut ? "bg-or-fonce text-white" : "border border-bordure bg-surface text-muted"
              }`}
            >
              {o.label} ({compte(o.statut)})
            </Link>
          ))}
          <Link href="/admin?statut=commerces" className="rounded-full border border-bordure bg-surface px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[1px] text-muted">
            Commerces
          </Link>
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
                  <Avatar texte={c.nom} photo={c.photo_url} />
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
      <BottomNav items={NAV_ADMIN} actif="/admin" />
    </>
  );
}

const NAV_ADMIN = [
  { href: "/admin", icone: "🛡️", label: "Admin" },
  { href: "/admin?statut=commerces", icone: "🏪", label: "Commerces" },
  { href: "/profil", icone: "👤", label: "Profil" },
];

async function OngletCommerces() {
  const { supabase } = await exigerProfil(["admin"]);
  const [{ data: commerces }, { data: bizs }, { data: offres }] = await Promise.all([
    supabase.from("profiles").select(PROFIL_COLS).eq("role", "business").eq("statut", "valide").order("nom").returns<Profil[]>(),
    supabase.from("businesses").select("id, categorie"),
    supabase.from("offres").select("business_id, statut"),
  ]);
  const categorie = new Map((bizs ?? []).map((b) => [b.id, b.categorie]));

  return (
    <>
      <TopBar badge="Admin" />
      <main className="flex-1 px-4 pb-6 pt-3">
        <Link href="/admin" className="text-[11px] text-or-fonce">← Espace admin</Link>
        <h1 className="mb-1 mt-2 font-titre text-2xl">Commerces ({commerces?.length ?? 0})</h1>
        <p className="mb-3 text-[11px] text-muted">Ajoute un commerce démarché et publie ses offres à sa place.</p>
        <Link href="/admin/commerces/nouveau" className="btn-primaire mb-3 w-full">+ Ajouter un commerce</Link>
        {!commerces?.length && <Vide texte="Aucun commerce validé pour l'instant." />}
        <div className="space-y-2">
          {commerces?.map((c) => {
            const actives = (offres ?? []).filter((o) => o.business_id === c.id && o.statut === "publiee").length;
            return (
              <Link key={c.id} href={`/admin/commerces/${c.id}`} className="carte flex items-center gap-3 p-3">
                <Avatar texte={c.nom} photo={c.photo_url} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold">{c.nom}</div>
                  <div className="truncate text-[10px] text-muted">{[categorie.get(c.id), c.ville].filter(Boolean).join(" · ")}</div>
                </div>
                <span className="text-[10px] text-muted">{actives} offre(s) active(s)</span>
              </Link>
            );
          })}
        </div>
      </main>
      <BottomNav items={NAV_ADMIN} actif="/admin?statut=commerces" />
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
