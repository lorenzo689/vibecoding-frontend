import { NextResponse, type NextRequest } from "next/server";
import { safeAuthRedirect } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const destination = safeAuthRedirect(request.nextUrl.searchParams.get("next"));
  if (!code) return NextResponse.redirect(new URL("/login?authError=confirmation", request.url));

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL("/login?authError=confirmation", request.url));
    return NextResponse.redirect(new URL(destination, request.url));
  } catch {
    return NextResponse.redirect(new URL("/login?authError=configuration", request.url));
  }
}
