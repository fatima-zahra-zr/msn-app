import Link from "next/link";
import { exigerProfil } from "@/lib/auth";
import { EspaceBusiness } from "@/app/business/composants";
import { FormCommerce } from "./form";

export default async function NouveauCommerce() {
  await exigerProfil(["admin"]);
  return (
    <EspaceBusiness actif="/admin?statut=commerces" admin>
      <Link href="/admin?statut=commerces" className="text-[11px] text-or-fonce">← Commerces</Link>
      <h1 className="mt-2 font-titre text-3xl">Ajouter un commerce</h1>
      <p className="mb-4 text-[11px] leading-relaxed text-muted">
        Tu crées le compte à sa place : il est validé tout de suite et tu peux publier ses offres.
        Le commerce pourra se connecter plus tard avec son email via « Mot de passe oublié ».
      </p>
      <FormCommerce />
    </EspaceBusiness>
  );
}
