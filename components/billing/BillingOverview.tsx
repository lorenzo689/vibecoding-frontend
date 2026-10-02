"use client";

import { useEffect, useState } from "react";
import PageHeading from "@/components/ui/PageHeading";
import {
  BillingError,
  getSubscription,
  isActive,
  openBillingPortal,
  startCheckout,
  type Subscription,
} from "@/lib/supabase/queries/billing";
import s from "./billing.module.css";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
}

const BENEFITS = [
  "Unbegrenzte Nutzung des KI-Assistenten",
  "Unbegrenzt viele Karteikarten",
  "Unbegrenzt Vorlesungsfolien hochladen",
];

const STATUS_LABEL: Record<string, string> = {
  active: "Aktiv",
  trialing: "Testphase",
  past_due: "Zahlung ausstehend",
  canceled: "Gekündigt",
  incomplete: "Noch nicht abgeschlossen",
  incomplete_expired: "Abgelaufen",
  unpaid: "Unbezahlt",
  paused: "Pausiert",
};

const ERROR_TEXT: Record<string, string> = {
  NO_SUBSCRIPTION: "Für dein Konto liegt noch kein Abo vor.",
  UNAUTHENTICATED: "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.",
  CONFIGURATION_ERROR: "Die Zahlungsabwicklung ist noch nicht eingerichtet.",
};

export default function BillingOverview() {
  const [subscription, setSubscription] = useState<Subscription | null | undefined>(undefined);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getSubscription()
      .then((value) => { if (active) setSubscription(value); })
      .catch(() => { if (active) { setSubscription(null); setLoadFailed(true); } });
    return () => { active = false; };
  }, []);

  // Both actions lead to a Stripe-hosted page, so they share one handler:
  // start it, follow the returned URL, and on failure stay put with a reason.
  async function leaveTo(action: () => Promise<string>, fallback: string) {
    setBusy(true);
    setError(null);
    try {
      window.location.href = await action();
    } catch (failure) {
      const code = failure instanceof BillingError ? failure.code : "SERVICE_UNAVAILABLE";
      setError(ERROR_TEXT[code] ?? fallback);
      setBusy(false);
    }
  }

  const buyPremium = () =>
    leaveTo(startCheckout, "Der Bezahlvorgang konnte nicht gestartet werden.");
  const openPortal = () =>
    leaveTo(openBillingPortal, "Die Verwaltung konnte nicht geöffnet werden.");

  if (subscription === undefined) {
    return <p className={s.status} aria-live="polite">Abo wird geladen …</p>;
  }

  const active = isActive(subscription);

  return (
    <div className={s.page}>
      <PageHeading
        title="Dein Abo"
        description="Dein aktueller Tarif, Zahlung und Kündigung."
      />

      {loadFailed && (
        <p className={s.status} data-tone="error" role="alert">
          Der Abo-Status konnte nicht geladen werden. Bitte lade die Seite erneut.
        </p>
      )}

      <section className={s.plan} data-active={active || undefined}>
        <div className={s.planHead}>
          <div>
            <span className={s.planName}>{active ? "Premium" : "Kostenlos"}</span>
            {active && subscription && (
              <span className={s.statusBadge} data-tone={subscription.status}>
                {STATUS_LABEL[subscription.status] ?? subscription.status}
              </span>
            )}
          </div>
          {!active && (
            <p className={s.price}>
              <strong>6,99 €</strong> <span>/ Monat</span>
            </p>
          )}
          {active && subscription?.current_period_end && (
            <p className={s.period}>
              {subscription.cancel_at_period_end ? "Endet am" : "Verlängert sich am"}{" "}
              <strong>{formatDate(subscription.current_period_end)}</strong>
            </p>
          )}
        </div>

        <ul className={s.benefits}>
          {BENEFITS.map((benefit) => (
            <li key={benefit}>
              <span className={s.check} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7" /></svg>
              </span>
              {benefit}
            </li>
          ))}
        </ul>

        <div className={s.planFoot}>
          {active ? (
            <>
              <button type="button" className={s.primaryButton} onClick={openPortal} disabled={busy}>
                {busy ? "Wird geöffnet …" : "Abo verwalten"}
              </button>
              <p className={s.note}>Kündigung und Zahlungsmittel änderst du bei Stripe.</p>
            </>
          ) : (
            <>
              <button type="button" className={s.primaryButton} onClick={buyPremium} disabled={busy}>
                {busy ? "Weiterleitung zu Stripe …" : "Premium freischalten"}
              </button>
              <p className={s.note}>
                Monatlich kündbar · Bezahlung über Stripe, Kartendaten erreichen UniVerse nie
              </p>
            </>
          )}
          {error && <p className={s.status} data-tone="error" role="alert">{error}</p>}
        </div>
      </section>
    </div>
  );
}
