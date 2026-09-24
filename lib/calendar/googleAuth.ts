import { cookies } from "next/headers";

/**
 * Calendar access is deliberately NOT tied to the Supabase login session. A
 * person may have registered with e-mail and password; running them through a
 * Google sign-in to read a calendar would change how they authenticate. So this
 * is a separate, read-only consent whose token lives in one httpOnly cookie and
 * dies with it. Nothing is written to the database, no refresh token is kept,
 * and revoking access in the Google account ends it immediately.
 */
export const GOOGLE_TOKEN_COOKIE = "lernapp_gcal";
export const GOOGLE_STATE_COOKIE = "lernapp_gcal_state";
export const GOOGLE_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

export type GoogleConfig = { clientId: string; clientSecret: string; redirectUri: string };

export function googleConfig(): GoogleConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const siteUrl = process.env.AUTH_SITE_URL;
  if (!clientId || !clientSecret || !siteUrl) return null;
  return { clientId, clientSecret, redirectUri: `${siteUrl.replace(/\/$/, "")}/api/calendar/google/callback` };
}

export async function readAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(GOOGLE_TOKEN_COOKIE)?.value ?? null;
}
