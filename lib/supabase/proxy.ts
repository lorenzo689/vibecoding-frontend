import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isProtectedPath, safeAuthRedirect } from "@/lib/auth/validation";
import { getSupabaseConfig } from "./config";

function redirectWithCookies(url: URL, response: NextResponse) {
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  let config;

  try {
    config = getSupabaseConfig();
  } catch {
    if (isProtectedPath(pathname)) {
      const login = request.nextUrl.clone();
      login.pathname = "/login";
      login.search = "";
      login.searchParams.set("authError", "configuration");
      return NextResponse.redirect(login);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.publicKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const authenticated = !error && Boolean(data?.claims?.sub);

  if (!authenticated && isProtectedPath(pathname)) {
    const login = request.nextUrl.clone();
    const intended = `${pathname}${request.nextUrl.search}`;
    login.pathname = "/login";
    login.search = "";
    login.searchParams.set("next", safeAuthRedirect(intended));
    return redirectWithCookies(login, response);
  }

  if (authenticated && (pathname === "/login" || pathname === "/register")) {
    const destination = safeAuthRedirect(request.nextUrl.searchParams.get("next"));
    return redirectWithCookies(new URL(destination, request.url), response);
  }

  return response;
}
