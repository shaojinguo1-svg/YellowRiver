import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  // Try to find existing Prisma user
  let dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  });

  // Auto-sync: if Supabase Auth user exists but no Prisma record, create one
  if (!dbUser) {
    const metadata = authUser.user_metadata || {};
    dbUser = await prisma.user.create({
      data: {
        supabaseId: authUser.id,
        email: authUser.email!,
        firstName: metadata.first_name || null,
        lastName: metadata.last_name || null,
        role: "TENANT", // Default role; admins are set explicitly
      },
    });
  }

  return dbUser;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return user;
}
