import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminLeaseInclude, serializeLease } from "@/lib/resident-leases";
import { ResidentsClient } from "./residents-client";

export default async function AdminResidentsPage() {
  await requireAdmin();

  let tenants: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  }[] = [];
  let properties: {
    id: string;
    title: string;
    city: string;
    state: string;
    status: string;
    price: string;
  }[] = [];
  let leases: ReturnType<typeof serializeLease>[] = [];
  let fetchError = false;

  try {
    const [tenantUsers, propertyRows, leaseRows] = await Promise.all([
      prisma.user.findMany({
        where: { role: "TENANT", isActive: true },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { email: "asc" }],
      }),
      prisma.property.findMany({
        select: {
          id: true,
          title: true,
          city: true,
          state: true,
          status: true,
          price: true,
        },
        orderBy: [{ title: "asc" }],
      }),
      prisma.lease.findMany({
        include: getAdminLeaseInclude(),
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      }),
    ]);

    tenants = tenantUsers;
    properties = propertyRows.map((property) => ({
      ...property,
      price: property.price.toString(),
    }));
    leases = leaseRows.map(serializeLease);
  } catch {
    fetchError = true;
  }

  return (
    <ResidentsClient
      tenants={tenants}
      properties={properties}
      leases={leases}
      fetchError={fetchError}
    />
  );
}
