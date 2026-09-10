import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/dashboard/:path*",
    "/courses/:path*",
    "/calendar/:path*",
    "/documents/:path*",
    "/flashcards/:path*",
    "/summaries/:path*",
    "/grades/:path*",
  ],
};
