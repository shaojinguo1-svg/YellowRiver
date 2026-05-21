import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

function redirectAway(request: NextRequest) {
  return NextResponse.redirect(new URL("/", request.url));
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isAdminRoute) {
      return redirectAway(request);
    }
    if (isDashboardRoute) {
      return redirectToLogin(request);
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the auth session to keep it alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /dashboard (tenant) routes — require login
  if (isDashboardRoute) {
    if (!user) {
      return redirectToLogin(request);
    }
  }

  // Protect /admin routes
  if (isAdminRoute) {
    // Redirect unauthenticated users to login
    if (!user) {
      return redirectToLogin(request);
    }

    // Verify admin role via Supabase REST API (Prisma cannot run in Edge Runtime)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return redirectAway(request);
    }

    try {
      const roleCheckUrl = new URL("/rest/v1/users", supabaseUrl);
      roleCheckUrl.searchParams.set("supabase_id", `eq.${user.id}`);
      roleCheckUrl.searchParams.set("select", "role");

      const res = await fetch(roleCheckUrl, {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        cache: "no-store",
      });

      if (!res.ok) {
        return redirectAway(request);
      }

      const rows: unknown = await res.json();
      if (!Array.isArray(rows) || rows.length !== 1) {
        return redirectAway(request);
      }

      const row = rows[0];
      if (!row || typeof row !== "object" || !("role" in row) || row.role !== "ADMIN") {
        return redirectAway(request);
      }
    } catch {
      // If role check fails, block access for safety
      return redirectAway(request);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/dashboard", "/auth/callback"],
};
