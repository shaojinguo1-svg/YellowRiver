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

/**
 * Role cache for the /admin gate, keyed by the VERIFIED user id returned by
 * supabase.auth.getUser(). Avoids a remote REST lookup on every admin request.
 *
 * - Per-instance and non-durable (Edge runtime): eviction or instance churn
 *   only causes a fallthrough to the live REST check — the safe direction.
 * - Negative results are cached too (fail-closed): role PROMOTION can take up
 *   to ROLE_CACHE_TTL_MS to reach the middleware. Revocation is still
 *   enforced immediately by requireAdmin/requireAdminPage on every data path.
 * - Lookup FAILURES are never cached; the request is blocked and the next one
 *   retries live.
 */
const ROLE_CACHE_TTL_MS = 60_000;
const ROLE_CACHE_MAX_ENTRIES = 1000;
const roleCache = new Map<string, { isAdmin: boolean; expiresAt: number }>();

function readCachedIsAdmin(userId: string): boolean | undefined {
  const entry = roleCache.get(userId);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    roleCache.delete(userId);
    return undefined;
  }
  return entry.isAdmin;
}

function cacheIsAdmin(userId: string, isAdmin: boolean) {
  if (roleCache.size >= ROLE_CACHE_MAX_ENTRIES) {
    const oldestKey = roleCache.keys().next().value;
    if (oldestKey !== undefined) roleCache.delete(oldestKey);
  }
  roleCache.set(userId, { isAdmin, expiresAt: Date.now() + ROLE_CACHE_TTL_MS });
}

async function fetchIsAdmin(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string
): Promise<boolean> {
  const roleCheckUrl = new URL("/rest/v1/users", supabaseUrl);
  roleCheckUrl.searchParams.set("supabase_id", `eq.${userId}`);
  roleCheckUrl.searchParams.set("select", "role");

  const res = await fetch(roleCheckUrl, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Role check failed with status ${res.status}`);
  }

  const rows: unknown = await res.json();
  if (!Array.isArray(rows) || rows.length !== 1) {
    return false;
  }

  const row = rows[0];
  return (
    !!row && typeof row === "object" && "role" in row && row.role === "ADMIN"
  );
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

    // Verify admin role via Supabase REST API (Prisma cannot run in Edge
    // Runtime), with a short-lived per-user cache in front of it.
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return redirectAway(request);
    }

    let isAdmin = readCachedIsAdmin(user.id);
    if (isAdmin === undefined) {
      try {
        isAdmin = await fetchIsAdmin(supabaseUrl, serviceRoleKey, user.id);
        cacheIsAdmin(user.id, isAdmin);
      } catch {
        // If role check fails, block access for safety without caching, so
        // the next request retries the live lookup.
        return redirectAway(request);
      }
    }

    if (!isAdmin) {
      return redirectAway(request);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/dashboard", "/auth/callback"],
};
