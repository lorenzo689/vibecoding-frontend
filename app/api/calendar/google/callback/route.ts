import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { GOOGLE_STATE_COOKIE, GOOGLE_TOKEN_COOKIE, googleConfig } from "@/lib/calendar/googleAuth";

function back(request: NextRequest, status: string) {
  const target = new URL("/calendar", request.nextUrl.origin);
  target.searchParams.set("import", status);
  return NextResponse.redirect(target);
}

export async function GET(request: NextRequest) {
  const config = googleConfig();
  if (!config) return back(request, "google-unconfigured");

  const store = await cookies();
  const expectedState = store.get(GOOGLE_STATE_COOKIE)?.value;
  store.delete(GOOGLE_STATE_COOKIE);

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (request.nextUrl.searchParams.get("error")) return back(request, "google-denied");
  if (!code || !state || !expectedState || state !== expectedState) return back(request, "google-failed");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) return back(request, "google-failed");

  const payload = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!payload.access_token) return back(request, "google-failed");

  // The cookie never outlives the token Google issued, so an expired read
  // presents itself as "not connected" rather than as a puzzling failure.
  store.set(GOOGLE_TOKEN_COOKIE, payload.access_token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/",
    maxAge: Math.max(60, Math.min(payload.expires_in ?? 3600, 3600)),
  });

  return back(request, "google-ready");
}
