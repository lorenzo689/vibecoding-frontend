"use client";

import Link from "next/link";
import s from "./billing.module.css";

/**
 * Landing page Stripe returns to after checkout.
 *
 * Deliberately makes no claim that the payment succeeded: arriving here only
 * means Stripe redirected the browser, and anyone can open the URL directly.
 * The subscription is activated by the webhook, server-side — so this page
 * points at the billing overview, which reads the real status, instead of
 * announcing a result it cannot verify.
 */
export default function BillingResult({ outcome }: { outcome: "success" | "cancel" }) {
  const success = outcome === "success";

  return (
    <div className={s.page}>
      <section className={s.resultCard}>
        <span className={s.resultIcon} data-tone={success ? "success" : "neutral"} aria-hidden="true">
          {success ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
          )}
        </span>

        <h1>{success ? "Danke für deinen Kauf" : "Vorgang abgebrochen"}</h1>

        <p className={s.lead}>
          {success
            ? "Dein Abo wird gerade aktiviert. Das dauert meist nur wenige Sekunden — den aktuellen Stand siehst du in deiner Abo-Übersicht."
            : "Es wurde nichts berechnet. Du kannst den Kauf jederzeit erneut starten."}
        </p>

        <div className={s.resultActions}>
          <Link href="/billing" className={s.primaryButton}>Zur Abo-Übersicht</Link>
          <Link href="/dashboard" className={s.secondaryButton}>Zurück zur Übersicht</Link>
        </div>
      </section>
    </div>
  );
}
