import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  adminMaintenanceRequestInclude,
  MAINTENANCE_REQUEST_CATEGORIES,
  MAINTENANCE_REQUEST_PRIORITIES,
  MAINTENANCE_REQUEST_STATUSES,
  serializeAdminMaintenanceRequest,
} from "@/lib/maintenance-requests";
import { MaintenanceClient } from "./maintenance-client";
import type {
  MaintenanceRequestCategory,
  MaintenanceRequestPriority,
  MaintenanceRequestStatus,
  Prisma,
} from "@/generated/prisma/client";

const PAGE_SIZE = 25;

type MaintenanceFilterValue<T extends string> = T | "all";

function parsePage(value?: string) {
  const page = Number(value ?? "1");
  if (!Number.isInteger(page) || page < 1) return 1;
  return page;
}

function parseFilter<T extends string>(
  value: string | undefined,
  allowed: T[]
): MaintenanceFilterValue<T> {
  if (!value || value === "all") return "all";
  return allowed.includes(value as T) ? (value as T) : "all";
}

export default async function AdminMaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    status?: string;
    priority?: string;
    category?: string;
  }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const requestedPage = parsePage(params.page);
  const status = parseFilter<MaintenanceRequestStatus>(
    params.status,
    MAINTENANCE_REQUEST_STATUSES
  );
  const priority = parseFilter<MaintenanceRequestPriority>(
    params.priority,
    MAINTENANCE_REQUEST_PRIORITIES
  );
  const category = parseFilter<MaintenanceRequestCategory>(
    params.category,
    MAINTENANCE_REQUEST_CATEGORIES
  );

  let requests: ReturnType<typeof serializeAdminMaintenanceRequest>[] = [];
  let fetchError = false;
  let total = 0;
  let page = requestedPage;
  let totalPages = 1;

  try {
    const where: Prisma.MaintenanceRequestWhereInput = {};
    if (status !== "all") where.status = status;
    if (priority !== "all") where.priority = priority;
    if (category !== "all") where.category = category;

    total = await prisma.maintenanceRequest.count({ where });
    totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    page = Math.min(requestedPage, totalPages);

    const rows = await prisma.maintenanceRequest.findMany({
      where,
      include: adminMaintenanceRequestInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });

    requests = rows.map(serializeAdminMaintenanceRequest);
  } catch {
    fetchError = true;
  }

  return (
    <MaintenanceClient
      key={`${page}-${status}-${priority}-${category}-${requests.map((request) => request.id).join("-")}`}
      requests={requests}
      fetchError={fetchError}
      filters={{ status, priority, category }}
      pagination={{ page, pageSize: PAGE_SIZE, total, totalPages }}
    />
  );
}
