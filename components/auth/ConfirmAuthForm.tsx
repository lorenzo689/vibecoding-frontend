"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SupportedEmailOtpType } from "@/lib/auth/confirmation";
import styles from "./auth.module.css";

export default function ConfirmAuthForm({
  type,
}: {
  type: SupportedEmailOtpType | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/auth/confirm/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      const body = (await response.json()) as { destination?: string };
      if (!response.ok || !body.destination) {
        setError("Der Link ist ungültig, abgelaufen oder wurde bereits verwendet.");
        return;
      }
      router.replace(body.destination);
      router.refresh();
    } catch {
      setError("Die Bestätigung konnte wegen eines Netzwerkfehlers nicht abgeschlossen werden.");
    } finally {
      setPending(false);
    }
  }

  if (!type) {
    return (
      <div className={styles.formContent}>
        <p className={styles.eyebrow}>Sicherer Kontozugang</p>
        <h1>Link nicht verfügbar</h1>
        <p className={styles.subtitle}>
          Der Bestätigungslink fehlt, ist abgelaufen oder wurde bereits verwendet.
        </p>
        <p className={styles.alternative}>
          <Link href="/login">Zur Anmeldung</Link>
        </p>
      </div>
    );
  }

  const recovering = type === "recovery";
  return (
    <div className={styles.formContent}>
      <p className={styles.eyebrow}>Sicherer Kontozugang</p>
      <h1>{recovering ? "Passwort zurücksetzen" : "E-Mail bestätigen"}</h1>
      <p className={styles.subtitle}>
        {recovering
          ? "Bestätige den Link, um anschließend ein neues Passwort festzulegen."
          : "Bestätige deine E-Mail-Adresse, um deinen Studienraum zu öffnen."}
      </p>
      {error && <p className={styles.notice} data-tone="error" role="alert">{error}</p>}
      <button type="button" className={styles.primary} onClick={confirm} disabled={pending}>
        {pending ? "Wird bestätigt …" : recovering ? "Weiter zum neuen Passwort" : "E-Mail bestätigen"}
      </button>
      <p className={styles.alternative}><Link href="/login">Abbrechen und anmelden</Link></p>
    </div>
  );
}
