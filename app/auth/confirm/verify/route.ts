import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
  parsePendingConfirmation,
  PENDING_CONFIRMATION_COOKIE,
  RECOVERY_SESSION_COOKIE,
  requestHasTrustedOrigin,
  trustedOrigin,
} from "@/lib/auth/confirmation";
import { createClient } from "@/lib/supabase/server";

const responseHeaders = {
  "cache-control": "no-store",
  "referrer-policy": "no-referrer",
};

export async function POST(request: NextRequest) {
  let origin: string;
  try {
    origin = trustedOrigin(process.env.AUTH_SITE_URL, request.nextUrl.origin);
  } catch {
    return NextResponse.json({ error: "configuration" }, { status: 500, headers: responseHeaders });
  }
  if (!requestHasTrustedOrigin(request.headers.get("origin"), origin)) {
    return NextResponse.json({ error: "origin" }, { status: 403, headers: responseHeaders });
  }

  const cookieStore = await cookies();
  const pending = parsePendingConfirmation(cookieStore.get(PENDING_CONFIRMATION_COOKIE)?.value);
  if (!pending) {
    return NextResponse.json({ error: "invalid" }, { status: 400, headers: responseHeaders });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: pending.tokenHash,
    type: pending.type,
  });
  cookieStore.delete(PENDING_CONFIRMATION_COOKIE);

  if (error) {
    return NextResponse.json({ error: "invalid" }, { status: 400, headers: responseHeaders });
  }

  if (pending.type === "recovery") {
    cookieStore.set(RECOVERY_SESSION_COOKIE, "active", {
      httpOnly: true,
      sameSite: "strict",
      secure: request.nextUrl.protocol === "https:",
      path: "/auth",
      maxAge: 10 * 60,
    });
  }

  return NextResponse.json(
    { destination: pending.type === "recovery" ? "/auth/reset-password" : "/dashboard" },
    { headers: responseHeaders }
  );
}
