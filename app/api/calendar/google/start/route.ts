import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GOOGLE_SCOPE, GOOGLE_STATE_COOKIE, googleConfig } from "@/lib/calendar/googleAuth";

export async function GET() {
  const config = googleConfig();
  if (!config) {
    return NextResponse.json(
      { error: "GOOGLE_NOT_CONFIGURED", message: "Google-Kalender ist auf diesem Server nicht eingerichtet." },
      { status: 503 },
    );
  }

  // Opaque value echoed back by Google; it is what makes the callback
  // attributable to this browser and not to a request someone else started.
  const state = crypto.randomUUID();
  const store = await cookies();
  store.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: 600,
  });

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_SCOPE);
  // No offline access on purpose: we want a short-lived read, not a standing
  // permission that outlives the visit and has to be stored somewhere.
  url.searchParams.set("access_type", "online");
  url.searchParams.set("include_granted_scopes", "false");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
