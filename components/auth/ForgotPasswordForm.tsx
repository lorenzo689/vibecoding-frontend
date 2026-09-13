"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import styles from "./auth.module.css";

type State =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export default function ForgotPasswordForm() {
  const [state, setState] = useState<State>({ status: "idle" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "pending" });
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();

    try {
      const response = await fetch("/auth/recovery/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        setState({
          status: "error",
          message: response.status === 429
            ? "Zu viele Versuche. Bitte warte einen Moment."
            : "Die E-Mail konnte gerade nicht gesendet werden. Bitte versuche es später erneut.",
        });
        return;
      }
      setState({
        status: "success",
        message: "Wenn ein Konto zu dieser Adresse existiert, erhältst du eine E-Mail mit den nächsten Schritten.",
      });
    } catch {
      setState({ status: "error", message: "Die Verbindung ist fehlgeschlagen. Bitte versuche es erneut." });
    }
  }

  return (
    <div className={styles.formContent}>
      <p className={styles.eyebrow}>Zurück in deinen Studienraum</p>
      <h1>Passwort vergessen?</h1>
      <p className={styles.subtitle}>Gib deine E-Mail-Adresse ein. Wir senden dir einen sicheren Link zum Zurücksetzen.</p>
      <form onSubmit={submit}>
        <div className={styles.field}>
          <label htmlFor="recovery-email">E-Mail-Adresse</label>
          <input id="recovery-email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required disabled={state.status === "pending"} />
        </div>
        {(state.status === "success" || state.status === "error") && (
          <p className={styles.notice} data-tone={state.status} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>
        )}
        <button className={styles.primary} type="submit" disabled={state.status === "pending"}>
          {state.status === "pending" ? "Wird gesendet …" : "Reset-Link anfordern"}
        </button>
      </form>
      <p className={styles.alternative}><Link href="/login">Zurück zur Anmeldung</Link></p>
    </div>
  );
}
