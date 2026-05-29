import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const metadata = authUser.user_metadata || {};

  // Auto-sync without a find-then-create race on first login.
  const dbUser = await prisma.user.upsert({
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

  return dbUser;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return user;
}
