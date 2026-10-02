"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeading from "@/components/ui/PageHeading";
import {
  BillingError,
  billingErrorMessage,
  describeBilling,
  hasProAccess,
  loadOwnSubscription,
  PRO_PRICE_LABEL,
  requestStripeRedirect,
  type OwnSubscription,
  type StripeRedirectAction,
} from "@/lib/billing";
import { createClient } from "@/lib/supabase/browser";
import s from "./billing.module.css";

type LoadState =
  | { status: "ready"; subscription: OwnSubscription | null }
  | { status: "loading" }
  | { status: "error"; message: string };

type ActionState =
  | { status: "idle" }
  | { status: "redirecting"; action: StripeRedirectAction }
  | { status: "error"; message: string };

const LOGIN_PATH = "/login?next=%2Fbilling";

export default function BillingPage({
  initialSubscription,
  initialError,
}: {
  initialSubscription: OwnSubscription | null;
  initialError: string | null;
}) {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>(
    initialError ? { status: "error", message: initialError } : { status: "ready", subscription: initialSubscription }
  );
  const [actionState, setActionState] = useState<ActionState>({ status: "idle" });

  // Beim Zurück-Navigieren von Stripe (Browser-Cache) soll die Seite nicht im Weiterleitungs-Zustand hängen.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setActionState({ status: "idle" });
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  async function reload(keepActionError = false) {
    setLoadState({ status: "loading" });
    if (!keepActionError) setActionState({ status: "idle" });
    try {
      const subscription = await loadOwnSubscription(createClient());
      setLoadState({ status: "ready", subscription });
    } catch {
      setLoadState({ status: "error", message: "Dein Abo-Status konnte gerade nicht geladen werden. Bitte versuche es erneut." });
    }
  }

  async function open(action: StripeRedirectAction) {
    setActionState({ status: "redirecting", action });
    try {
      const url = await requestStripeRedirect(createClient(), action);
      window.location.assign(url);
    } catch (error) {
      if (error instanceof BillingError && error.code === "UNAUTHENTICATED") {
        router.replace(LOGIN_PATH);
        router.refresh();
        return;
      }
      setActionState({ status: "error", message: billingErrorMessage(error, action) });
      // Bei einem schon bestehenden Abo den echten Stand nachladen, damit die richtige Aktion erscheint.
      if (error instanceof BillingError && (error.code === "ALREADY_SUBSCRIBED" || error.code === "NO_SUBSCRIPTION")) {
        void reload(true);
      }
    }
  }

  if (loadState.status !== "ready") {
    return (
      <div className={s.page}>
        <PageHeading title="UniVerse Pro" description="Dein Abo und deine Zahlungsdaten." />
        <section className={s.errorCard} aria-live="polite" aria-busy={loadState.status === "loading"}>
          <h2>{loadState.status === "loading" ? "Abo-Status wird geladen …" : "Abo-Status nicht verfügbar"}</h2>
          {loadState.status === "error" && <p>{loadState.message}</p>}
          <div className={s.actions}>
            <button type="button" className={s.primary} onClick={() => void reload()} disabled={loadState.status === "loading"}>
              {loadState.status === "loading" ? "Wird geladen …" : "Erneut versuchen"}
            </button>
          </div>
        </section>
      </div>
    );
  }

  const { subscription } = loadState;
  const view = describeBilling(subscription);
  const busy = actionState.status === "redirecting";

  return (
    <div className={s.page}>
      <PageHeading title="UniVerse Pro" description="Dein Abo und deine Zahlungsdaten." />

      <div className={s.grid}>
        <div className={s.column}>
          <section className={s.card} aria-labelledby="billing-status-heading">
            <span className={s.badge} data-tone={view.tone}>{hasProAccess(subscription) ? "Pro" : "Kein Pro"}</span>
            <h2 id="billing-status-heading">{view.title}</h2>
            <p>{view.detail}</p>

            {view.canSubscribe && <p className={s.offerLine}>UniVerse Pro · {PRO_PRICE_LABEL}</p>}

            <div className={s.actions}>
              {view.canSubscribe && (
                <button type="button" className={s.primary} onClick={() => void open("checkout")} disabled={busy}>
                  {actionState.status === "redirecting" && actionState.action === "checkout" ? "Weiterleitung zu Stripe …" : "UniVerse Pro abonnieren"}
                </button>
              )}
              {view.canManage && (
                <button type="button" className={s.secondary} onClick={() => void open("portal")} disabled={busy}>
                  {actionState.status === "redirecting" && actionState.action === "portal" ? "Weiterleitung zu Stripe …" : view.manageLabel}
                </button>
              )}
              <button type="button" className={s.secondary} onClick={() => void reload()} disabled={busy}>Status aktualisieren</button>
            </div>

            <div
              className={actionState.status === "error" ? s.errorMessage : s.statusMessage}
              role={actionState.status === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              {actionState.status === "error" && actionState.message}
              {actionState.status === "redirecting" && "Du wirst zur sicheren Seite von Stripe weitergeleitet."}
            </div>
          </section>
        </div>

        <aside className={s.card} aria-labelledby="billing-info-heading">
          <h2 id="billing-info-heading">UniVerse Pro</h2>
          <p className={s.price}>{PRO_PRICE_LABEL}</p>
          <p>Monatlich abgerechnet über Stripe. Zahlungsdetails siehst du dort noch einmal, bevor du bestätigst.</p>
          <p className={s.note}>
            Kündigen kannst du jederzeit im Abo-Bereich. Dein Abo läuft dann bis zum Ende des bezahlten Zeitraums weiter.
          </p>
        </aside>
      </div>
    </div>
  );
}
