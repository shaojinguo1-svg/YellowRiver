import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  adminMaintenanceRequestInclude,
  serializeAdminMaintenanceRequest,
} from "@/lib/maintenance-requests";
import { MaintenanceClient } from "./maintenance-client";

export default async function AdminMaintenancePage() {
  await requireAdmin();

  let requests: ReturnType<typeof serializeAdminMaintenanceRequest>[] = [];
  let fetchError = false;

  try {
    const rows = await prisma.maintenanceRequest.findMany({
      include: adminMaintenanceRequestInclude,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    requests = rows.map(serializeAdminMaintenanceRequest);
  } catch {
    fetchError = true;
  }

  return <MaintenanceClient requests={requests} fetchError={fetchError} />;
}
