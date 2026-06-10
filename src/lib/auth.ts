import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

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

  // First login: create the row. Prisma's upsert is not atomic (select then
  // insert), so concurrent first requests would race a unique-key failure;
  // catch P2002 and re-read the row a parallel request just created.
  try {
    return await prisma.user.create({
      data: {
        supabaseId: authUser.id,
        email: authUser.email!,
        firstName: metadata.first_name || null,
        lastName: metadata.last_name || null,
        role: "TENANT", // Default role; admins are set explicitly
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const racedUser = await prisma.user.findUnique({
        where: { supabaseId: authUser.id },
      });
      if (racedUser) return racedUser;
    }
    throw error;
  }
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
