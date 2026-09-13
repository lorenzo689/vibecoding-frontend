"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  authErrorMessage,
  safeAuthRedirect,
  validateDisplayName,
  validateLoginPassword,
  validateRegistrationPassword,
} from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/browser";
import { registrationProfileMetadata } from "@/lib/auth/profile";
import styles from "./auth.module.css";

type Notice = { tone: "error" | "success"; message: string } | null;

const initialMessages: Record<string, string> = {
  confirmation: "Der Bestätigungslink ist ungültig oder abgelaufen. Bitte fordere bei der Registrierung eine neue E-Mail an.",
  configuration: "Die Supabase-Verbindung ist noch nicht konfiguriert. Bitte prüfe die öffentliche Frontend-Konfiguration.",
};

const initialNotices: Record<string, string> = {
  passwordUpdated: "Dein Passwort wurde geändert. Du kannst dich jetzt anmelden.",
};

export default function AuthForm({ mode, next, initialError, initialNotice }: {
  mode: "login" | "register";
  next?: string;
  initialError?: string;
  initialNotice?: string;
}) {
  const router = useRouter();
  const registering = mode === "register";
  const destination = safeAuthRedirect(next);
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState<Notice>(
    initialError && initialMessages[initialError]
      ? { tone: "error", message: initialMessages[initialError] }
      : initialNotice && initialNotices[initialNotice]
        ? { tone: "success", message: initialNotices[initialNotice] }
      : null
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function verifyProfile(userId: string) {
    const { data, error } = await createClient()
      .from("profiles")
      .select("id, name")
      .eq("user_id", userId)
      .maybeSingle();
    return !error && Boolean(data);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    try {
      const supabase = createClient();
      if (registering) {
        const displayName = validateDisplayName(String(form.get("display_name") ?? ""));
        if (!displayName.valid) {
          setNotice({ tone: "error", message: displayName.message });
          return;
        }
        const passwordError = validateRegistrationPassword(password);
        if (passwordError) {
          setNotice({ tone: "error", message: passwordError });
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: registrationProfileMetadata(displayName.value),
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          },
        });
        if (error) {
          setNotice({ tone: "error", message: authErrorMessage(error, "register") });
          return;
        }
        if (!data.session) {
          setConfirmationEmail(email);
          setCooldown(60);
          setNotice({ tone: "success", message: "Wenn die Adresse registriert werden kann, erhältst du eine Bestätigungs-E-Mail. Prüfe auch deinen Spam-Ordner." });
          return;
        }
        if (!data.user || !(await verifyProfile(data.user.id))) {
          await supabase.auth.signOut({ scope: "local" });
          setNotice({ tone: "error", message: "Dein Konto wurde erstellt, aber das Profil konnte nicht geladen werden. Bitte versuche die Anmeldung erneut." });
          return;
        }
      } else {
        const passwordError = validateLoginPassword(password);
        if (passwordError) {
          setNotice({ tone: "error", message: passwordError });
          return;
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setNotice({ tone: "error", message: authErrorMessage(error, "login") });
          return;
        }
        if (!(await verifyProfile(data.user.id))) {
          await supabase.auth.signOut({ scope: "local" });
          setNotice({ tone: "error", message: "Die Anmeldung war erfolgreich, aber dein Profil konnte nicht geladen werden. Bitte versuche es erneut." });
          return;
        }
      }
      router.replace(destination);
      router.refresh();
    } catch {
      setNotice({ tone: "error", message: "Die Verbindung konnte nicht hergestellt werden. Bitte prüfe deine Netzwerk- und Supabase-Konfiguration." });
    } finally {
      setPending(false);
    }
  }

  async function resendConfirmation() {
    if (!confirmationEmail || cooldown > 0) return;
    setPending(true);
    setNotice(null);
    try {
      const { error } = await createClient().auth.resend({
        type: "signup",
        email: confirmationEmail,
        options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
      });
      if (error) {
        setNotice({ tone: "error", message: authErrorMessage(error, "resend") });
        return;
      }
      setCooldown(60);
      setNotice({ tone: "success", message: "Wenn die Adresse registriert ist, wurde eine neue Bestätigungs-E-Mail gesendet." });
    } catch {
      setNotice({ tone: "error", message: "Die Bestätigungs-E-Mail konnte wegen eines Netzwerkfehlers nicht gesendet werden." });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.formContent}>
      <p className={styles.eyebrow}>Mehr Klarheit. Semester für Semester.</p>
      <h1>{registering ? "Konto erstellen" : "Willkommen zurück"}</h1>
      <p className={styles.subtitle}>{registering ? "Organisiere dein Semester und dein Lernen an einem Ort." : "Melde dich an, um in deinem Studienraum weiterzulernen."}</p>
      {confirmationEmail ? (
        <section className={styles.confirmation} aria-labelledby="confirmation-heading">
          <span aria-hidden="true">✓</span>
          <h2 id="confirmation-heading">Bestätige deine E-Mail</h2>
          <p>Wir haben einen Bestätigungslink an <strong>{confirmationEmail}</strong> gesendet.</p>
          {notice && <p className={styles.notice} data-tone={notice.tone} role="status">{notice.message}</p>}
          <button type="button" className={styles.secondary} disabled={pending || cooldown > 0} onClick={resendConfirmation}>
            {pending ? "Wird gesendet …" : cooldown > 0 ? `Erneut senden in ${cooldown} s` : "Bestätigungs-E-Mail erneut senden"}
          </button>
          <Link href="/login">Zur Anmeldung</Link>
        </section>
      ) : (
        <form onSubmit={submit}>
          {registering && <div className={styles.field}>
            <label htmlFor="display-name">Anzeigename</label>
            <input id="display-name" name="display_name" autoComplete="nickname" placeholder="Wie dürfen wir dich nennen?" required disabled={pending} />
            <small>1–60 Zeichen</small>
          </div>}
          <div className={styles.field}>
            <label htmlFor="email">E-Mail-Adresse</label>
            <input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="du@hochschule.de" required disabled={pending} />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Passwort</label>
            <div className={styles.passwordWrap}>
              <input id="password" name="password" type={visible ? "text" : "password"} autoComplete={registering ? "new-password" : "current-password"} placeholder={registering ? "Mindestens 8 Zeichen" : "Dein Passwort"} minLength={registering ? 8 : undefined} required disabled={pending} />
              <button className={styles.visibility} type="button" aria-label={visible ? "Passwort ausblenden" : "Passwort anzeigen"} aria-controls="password" onClick={() => setVisible(!visible)} disabled={pending}>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{visible && <path d="m3 3 18 18" />}</svg>
              </button>
            </div>
            {!registering && (
              <Link className={styles.forgotPassword} href="/forgot-password">
                Passwort vergessen?
              </Link>
            )}
          </div>
          {notice && <p className={styles.notice} data-tone={notice.tone} role="alert">{notice.message}</p>}
          <button className={styles.primary} type="submit" disabled={pending}>{pending ? "Bitte warten …" : registering ? "Konto erstellen" : "Anmelden"}<span aria-hidden="true">→</span></button>
        </form>
      )}
      {!confirmationEmail && <p className={styles.alternative}>{registering ? "Du hast bereits ein Konto?" : "Du hast noch kein Konto?"}{" "}<Link href={registering ? "/login" : "/register"}>{registering ? "Anmelden" : "Jetzt registrieren"}</Link></p>}
    </div>
  );
}
