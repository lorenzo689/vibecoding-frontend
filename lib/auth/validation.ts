export const DEFAULT_AUTH_REDIRECT = "/dashboard";

const protectedPrefixes = [
  "/dashboard",
  "/courses",
  "/calendar",
  "/documents",
  "/flashcards",
  "/summaries",
  "/grades",
  "/profile",
];

export function isProtectedPath(pathname: string): boolean {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function safeAuthRedirect(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  try {
    const parsed = new URL(value, "https://lernapp.invalid");
    const destination = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return parsed.origin === "https://lernapp.invalid" && isProtectedPath(parsed.pathname)
      ? destination
      : DEFAULT_AUTH_REDIRECT;
  } catch {
    return DEFAULT_AUTH_REDIRECT;
  }
}

export function validateDisplayName(value: string):
  | { valid: true; value: string }
  | { valid: false; message: string } {
  const trimmed = value.trim();
  const length = Array.from(trimmed).length;

  if (length === 0) {
    return { valid: false, message: "Bitte gib einen Anzeigenamen ein." };
  }
  if (length > 60) {
    return { valid: false, message: "Der Anzeigename darf höchstens 60 Zeichen enthalten." };
  }
  return { valid: true, value: trimmed };
}

export function validateRegistrationPassword(password: string): string | null {
  return password.length >= 8 ? null : "Das Passwort muss mindestens 8 Zeichen lang sein.";
}

export function validateLoginPassword(password: string): string | null {
  return password.length > 0 ? null : "Bitte gib dein Passwort ein.";
}

type AuthErrorLike = { code?: string; status?: number; message?: string };

export function authErrorMessage(error: AuthErrorLike, context: "login" | "register" | "resend") {
  if (error.status === 429 || error.code === "over_request_rate_limit" || error.code === "over_email_send_rate_limit") {
    return "Zu viele Versuche. Bitte warte einen Moment und versuche es erneut.";
  }
  if (error.code === "email_not_confirmed") {
    return "Bitte bestätige zuerst deine E-Mail-Adresse.";
  }
  if (context === "login" && error.code === "invalid_credentials") {
    return "E-Mail-Adresse oder Passwort ist nicht korrekt.";
  }
  if (context === "register") {
    return "Die Registrierung konnte nicht abgeschlossen werden. Bitte prüfe deine Angaben und versuche es erneut.";
  }
  if (context === "resend") {
    return "Die Bestätigungs-E-Mail konnte nicht gesendet werden. Bitte versuche es später erneut.";
  }
  return "Die Anmeldung konnte nicht abgeschlossen werden. Bitte versuche es erneut.";
}
