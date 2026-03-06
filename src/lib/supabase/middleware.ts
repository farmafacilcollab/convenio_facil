import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database.types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes that don't require auth
  const isLoginPage = request.nextUrl.pathname === "/login";
  const isPublicRoute =
    request.nextUrl.pathname === "/" || isLoginPage;

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    // Read cached role from cookie to avoid DB query on every request
    const cachedRole = request.cookies.get("x-user-role")?.value as string | undefined;
    let role = cachedRole;

    if (!role) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, store_id")
        .eq("id", user.id)
        .single();
      role = profile?.role ?? undefined;
      if (role) {
        supabaseResponse.cookies.set("x-user-role", role, {
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: 60 * 60, // 1 hour
        });
      }
    }

    const pathname = request.nextUrl.pathname;

    // Redirect authenticated users away from login
    if (isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = role === "admin" ? "/admin/dashboard" : "/store/dashboard";
      return NextResponse.redirect(url);
    }

    // Redirect root to appropriate dashboard
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = role === "admin" ? "/admin/dashboard" : "/store/dashboard";
      return NextResponse.redirect(url);
    }

    // Role-based route protection
    if (pathname.startsWith("/admin") && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/store/dashboard";
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/store") && role !== "store") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
