/**
 * Envoi d'emails de notification via Resend (https://resend.com, gratuit jusqu'à 3000/mois).
 * Sans RESEND_API_KEY, l'email est juste affiché dans les logs (pratique en test).
 * Une notification qui échoue ne bloque jamais l'action de l'utilisateur.
 */
export async function envoyerEmail(to: string, sujet: string, texte: string) {
  const cle = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "MSN <onboarding@resend.dev>";
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  const corps = `${texte}\n\n${site ? `👉 ${site}\n\n` : ""}L'équipe MSN`;

  if (!cle) {
    console.log(`[email non envoyé — RESEND_API_KEY manquante] à ${to} : ${sujet}\n${corps}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject: sujet, text: corps }),
    });
    if (!res.ok) console.error("Échec envoi email :", res.status, await res.text());
  } catch (e) {
    console.error("Échec envoi email :", e);
  }
}
