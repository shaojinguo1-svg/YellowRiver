import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/auth";

export default async function AdminPage() {
  await requireAdminPage();
  redirect("/admin/dashboard");
}
