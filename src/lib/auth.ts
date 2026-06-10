import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * cache() dedupes the auth lookup across layout + page within a single
 * request (it is a no-op in route handlers, which call this once anyway).
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const existingUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  });
  if (existingUser) return existingUser;

  const metadata = authUser.user_metadata || {};

  // First login only: upsert (not create) so concurrent first requests
  // cannot race a duplicate-key failure.
  return prisma.user.upsert({
    where: { supabaseId: authUser.id },
    update: {},
    create: {
      supabaseId: authUser.id,
      email: authUser.email!,
      firstName: metadata.first_name || null,
      lastName: metadata.last_name || null,
      role: "TENANT", // Default role; admins are set explicitly
    },
  });
});

/** For API routes: api-handler.ts maps the thrown "Unauthorized" to a 401. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * For pages: redirects instead of throwing — there is no error.tsx under
 * /admin, so a bare throw would render a 500.
 */
export async function requireAdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }
  return user;
}
