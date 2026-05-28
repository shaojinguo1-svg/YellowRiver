import { prisma } from "@/lib/prisma";
import { getCurrentLeaseForUser } from "@/lib/resident-leases";
import type {
  MaintenanceRequestCategory,
  MaintenanceRequestPriority,
  MaintenanceRequestStatus,
  Prisma,
} from "@/generated/prisma/client";

export const MAINTENANCE_REQUEST_STATUSES: MaintenanceRequestStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CANCELLED",
];

export const MAINTENANCE_REQUEST_PRIORITIES: MaintenanceRequestPriority[] = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
];

export const MAINTENANCE_REQUEST_CATEGORIES: MaintenanceRequestCategory[] = [
  "GENERAL",
  "PLUMBING",
  "ELECTRICAL",
  "HVAC",
  "APPLIANCE",
  "OTHER",
];

export class MaintenanceRequestValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "MaintenanceRequestValidationError";
    this.status = status;
  }
}

type TenantMaintenancePayload = {
  title: string;
  description: string;
  location: string | null;
  priority: MaintenanceRequestPriority;
  category: MaintenanceRequestCategory;
};

type AdminMaintenancePayload = {
  status: MaintenanceRequestStatus;
  priority: MaintenanceRequestPriority;
  category: MaintenanceRequestCategory;
  adminNotes: string | null;
};

function readString(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(body: Record<string, unknown>, key: string) {
  const value = readString(body, key);
  return value ? value : null;
}

function assertBody(body: unknown) {
  if (typeof body !== "object" || body === null) {
    throw new MaintenanceRequestValidationError("Invalid request body");
  }

  return body as Record<string, unknown>;
}

function parseStatus(value: string) {
  if (!MAINTENANCE_REQUEST_STATUSES.includes(value as MaintenanceRequestStatus)) {
    throw new MaintenanceRequestValidationError("Maintenance status is invalid");
  }

  return value as MaintenanceRequestStatus;
}

function parsePriority(value: string | null) {
  const priority = value || "NORMAL";
  if (!MAINTENANCE_REQUEST_PRIORITIES.includes(priority as MaintenanceRequestPriority)) {
    throw new MaintenanceRequestValidationError("Maintenance priority is invalid");
  }

  return priority as MaintenanceRequestPriority;
}

function parseCategory(value: string | null) {
  const category = value || "GENERAL";
  if (!MAINTENANCE_REQUEST_CATEGORIES.includes(category as MaintenanceRequestCategory)) {
    throw new MaintenanceRequestValidationError("Maintenance category is invalid");
  }

  return category as MaintenanceRequestCategory;
}

function requireBoundedText(value: string, label: string, maxLength: number) {
  if (!value) {
    throw new MaintenanceRequestValidationError(`${label} is required`);
  }

  if (value.length > maxLength) {
    throw new MaintenanceRequestValidationError(
      `${label} must be ${maxLength} characters or fewer`
    );
  }

  return value;
}

function boundedOptionalText(
  value: string | null,
  label: string,
  maxLength: number
) {
  if (value && value.length > maxLength) {
    throw new MaintenanceRequestValidationError(
      `${label} must be ${maxLength} characters or fewer`
    );
  }

  return value;
}

export function parseTenantMaintenancePayload(
  body: unknown
): TenantMaintenancePayload {
  const record = assertBody(body);

  return {
    title: requireBoundedText(readString(record, "title"), "Title", 120),
    description: requireBoundedText(
      readString(record, "description"),
      "Description",
      5000
    ),
    location: boundedOptionalText(readOptionalString(record, "location"), "Location", 160),
    priority: parsePriority(readOptionalString(record, "priority")),
    category: parseCategory(readOptionalString(record, "category")),
  };
}

export function parseAdminMaintenancePayload(
  body: unknown
): AdminMaintenancePayload {
  const record = assertBody(body);

  return {
    status: parseStatus(readString(record, "status")),
    priority: parsePriority(readOptionalString(record, "priority")),
    category: parseCategory(readOptionalString(record, "category")),
    adminNotes: boundedOptionalText(
      readOptionalString(record, "adminNotes"),
      "Admin notes",
      5000
    ),
  };
}

export const tenantMaintenanceRequestSelect = {
  id: true,
  leaseId: true,
  propertyId: true,
  submittedById: true,
  status: true,
  priority: true,
  category: true,
  title: true,
  description: true,
  location: true,
  submittedAt: true,
  resolvedAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  property: {
    select: {
      id: true,
      title: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      zipCode: true,
    },
  },
} satisfies Prisma.MaintenanceRequestSelect;

export const adminMaintenanceRequestInclude = {
  property: {
    select: {
      id: true,
      title: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      zipCode: true,
    },
  },
  lease: {
    select: {
      id: true,
      startDate: true,
      endDate: true,
      status: true,
    },
  },
  submittedBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
} satisfies Prisma.MaintenanceRequestInclude;

type TenantMaintenanceRequest = Prisma.MaintenanceRequestGetPayload<{
  select: typeof tenantMaintenanceRequestSelect;
}>;

type AdminMaintenanceRequest = Prisma.MaintenanceRequestGetPayload<{
  include: typeof adminMaintenanceRequestInclude;
}>;

function serializeMaintenanceDates<T extends {
  submittedAt: Date;
  resolvedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}>(request: T) {
  return {
    ...request,
    submittedAt: request.submittedAt.toISOString(),
    resolvedAt: request.resolvedAt?.toISOString() ?? null,
    cancelledAt: request.cancelledAt?.toISOString() ?? null,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  };
}

export function serializeTenantMaintenanceRequest(
  request: TenantMaintenanceRequest
) {
  return serializeMaintenanceDates(request);
}

export function serializeAdminMaintenanceRequest(
  request: AdminMaintenanceRequest
) {
  return {
    ...serializeMaintenanceDates(request),
    lease: {
      ...request.lease,
      startDate: request.lease.startDate.toISOString(),
      endDate: request.lease.endDate?.toISOString() ?? null,
    },
  };
}

export async function listTenantMaintenanceRequests(userId: string) {
  const leaseResident = await getCurrentLeaseForUser(userId);
  if (!leaseResident) return [];

  return prisma.maintenanceRequest.findMany({
    where: {
      leaseId: leaseResident.lease.id,
      submittedById: userId,
    },
    select: tenantMaintenanceRequestSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function createTenantMaintenanceRequest(
  userId: string,
  payload: TenantMaintenancePayload
) {
  const leaseResident = await getCurrentLeaseForUser(userId);
  if (!leaseResident) {
    throw new MaintenanceRequestValidationError(
      "Active lease required to submit maintenance requests",
      403
    );
  }

  return prisma.maintenanceRequest.create({
    data: {
      leaseId: leaseResident.lease.id,
      propertyId: leaseResident.lease.propertyId,
      submittedById: userId,
      title: payload.title,
      description: payload.description,
      location: payload.location,
      priority: payload.priority,
      category: payload.category,
    },
    select: tenantMaintenanceRequestSelect,
  });
}

export async function cancelTenantMaintenanceRequest(
  requestId: string,
  userId: string
) {
  const leaseResident = await getCurrentLeaseForUser(userId);
  if (!leaseResident) {
    throw new MaintenanceRequestValidationError(
      "Active lease required to manage maintenance requests",
      403
    );
  }

  const request = await prisma.maintenanceRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      leaseId: true,
      submittedById: true,
      status: true,
    },
  });

  if (
    !request ||
    request.leaseId !== leaseResident.lease.id ||
    request.submittedById !== userId
  ) {
    throw new MaintenanceRequestValidationError("Maintenance request not found", 404);
  }

  if (request.status !== "OPEN") {
    throw new MaintenanceRequestValidationError(
      "Only open maintenance requests can be cancelled"
    );
  }

  return prisma.maintenanceRequest.update({
    where: { id: request.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      resolvedAt: null,
    },
    select: tenantMaintenanceRequestSelect,
  });
}

export async function updateAdminMaintenanceRequest(
  requestId: string,
  payload: AdminMaintenancePayload
) {
  const existing = await prisma.maintenanceRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      resolvedAt: true,
      cancelledAt: true,
    },
  });

  if (!existing) {
    throw new MaintenanceRequestValidationError("Maintenance request not found", 404);
  }

  const now = new Date();

  return prisma.maintenanceRequest.update({
    where: { id: existing.id },
    data: {
      status: payload.status,
      priority: payload.priority,
      category: payload.category,
      adminNotes: payload.adminNotes,
      resolvedAt:
        payload.status === "RESOLVED"
          ? existing.resolvedAt ?? now
          : null,
      cancelledAt:
        payload.status === "CANCELLED"
          ? existing.cancelledAt ?? now
          : null,
    },
    include: adminMaintenanceRequestInclude,
  });
}
