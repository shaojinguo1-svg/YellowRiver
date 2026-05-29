import { prisma } from "@/lib/prisma";
import { Prisma, type LeaseStatus } from "@/generated/prisma/client";

const LEASE_STATUSES: LeaseStatus[] = ["DRAFT", "ACTIVE", "ENDED", "CANCELLED"];
const ACTIVE_LEASE_PROPERTY_INDEX = "leases_one_active_per_property_key";
const LEASE_TRANSACTION_MAX_ATTEMPTS = 3;

export class LeaseValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "LeaseValidationError";
    this.status = status;
  }
}

function isPrismaKnownRequestError(
  error: unknown
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

function uniqueTargetIncludes(error: Prisma.PrismaClientKnownRequestError, value: string) {
  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.some((item) => String(item) === value);
  }
  return typeof target === "string" && target.includes(value);
}

function isActiveLeasePropertyUniqueConflict(error: unknown) {
  return (
    isPrismaKnownRequestError(error) &&
    error.code === "P2002" &&
    (uniqueTargetIncludes(error, ACTIVE_LEASE_PROPERTY_INDEX) ||
      uniqueTargetIncludes(error, "property_id") ||
      uniqueTargetIncludes(error, "propertyId"))
  );
}

function isRetryableTransactionConflict(error: unknown) {
  return isPrismaKnownRequestError(error) && error.code === "P2034";
}

async function runSerializableLeaseTransaction<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>
) {
  for (let attempt = 1; attempt <= LEASE_TRANSACTION_MAX_ATTEMPTS; attempt++) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (isActiveLeasePropertyUniqueConflict(error)) {
        if (attempt < LEASE_TRANSACTION_MAX_ATTEMPTS) {
          continue;
        }
        throw new LeaseValidationError("This property already has an active lease");
      }

      if (isRetryableTransactionConflict(error)) {
        if (attempt < LEASE_TRANSACTION_MAX_ATTEMPTS) {
          continue;
        }
        throw new LeaseValidationError(
          "Lease save conflicted with another update. Please try again.",
          409
        );
      }

      throw error;
    }
  }

  throw new LeaseValidationError("Lease save conflicted with another update. Please try again.", 409);
}

type LeasePayload = {
  propertyId: string;
  status: LeaseStatus;
  startDate: Date;
  endDate: Date | null;
  rentAmount: string;
  securityDeposit: string | null;
  occupantCount: number;
  notes: string | null;
  residentIds: string[];
  primaryResidentId: string;
};

function readString(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(body: Record<string, unknown>, key: string) {
  const value = readString(body, key);
  return value ? value : null;
}

function parseDateValue(value: string | null, label: string, required = false) {
  if (!value) {
    if (required) throw new LeaseValidationError(`${label} is required`);
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new LeaseValidationError(`${label} is invalid`);
  }

  return date;
}

function parseMoneyValue(value: string | null, label: string, required = false) {
  if (!value) {
    if (required) throw new LeaseValidationError(`${label} is required`);
    return null;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    throw new LeaseValidationError(`${label} must be a positive amount with up to 2 decimals`);
  }

  return value;
}

function parseResidentIds(body: Record<string, unknown>) {
  const residentIds = Array.isArray(body.residentIds)
    ? body.residentIds
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean)
    : [];

  return Array.from(new Set(residentIds));
}

export function parseLeasePayload(body: unknown): LeasePayload {
  if (typeof body !== "object" || body === null) {
    throw new LeaseValidationError("Invalid request body");
  }

  const record = body as Record<string, unknown>;
  const propertyId = readString(record, "propertyId");
  if (!propertyId) throw new LeaseValidationError("Property is required");

  const rawStatus = readString(record, "status") || "DRAFT";
  if (!LEASE_STATUSES.includes(rawStatus as LeaseStatus)) {
    throw new LeaseValidationError("Lease status is invalid");
  }
  const status = rawStatus as LeaseStatus;

  const startDate = parseDateValue(readString(record, "startDate"), "Start date", true);
  if (!startDate) throw new LeaseValidationError("Start date is required");
  const endDate = parseDateValue(readOptionalString(record, "endDate"), "End date");
  if (endDate && endDate < startDate) {
    throw new LeaseValidationError("End date cannot be before start date");
  }

  const rentAmount = parseMoneyValue(readString(record, "rentAmount"), "Rent amount", true);
  if (!rentAmount) throw new LeaseValidationError("Rent amount is required");
  const securityDeposit = parseMoneyValue(
    readOptionalString(record, "securityDeposit"),
    "Security deposit"
  );

  const occupantCountValue = Number(record.occupantCount);
  const occupantCount = Number.isInteger(occupantCountValue)
    ? occupantCountValue
    : Number.parseInt(readString(record, "occupantCount"), 10);
  if (!Number.isInteger(occupantCount) || occupantCount < 1) {
    throw new LeaseValidationError("Occupant count must be at least 1");
  }

  const residentIds = parseResidentIds(record);
  if (residentIds.length === 0) {
    throw new LeaseValidationError("At least one resident is required");
  }

  const primaryResidentId = readString(record, "primaryResidentId") || residentIds[0];
  if (!residentIds.includes(primaryResidentId)) {
    throw new LeaseValidationError("Primary resident must be attached to the lease");
  }

  return {
    propertyId,
    status,
    startDate,
    endDate,
    rentAmount,
    securityDeposit,
    occupantCount,
    notes: readOptionalString(record, "notes"),
    residentIds,
    primaryResidentId,
  };
}

async function ensurePropertyExists(
  tx: Prisma.TransactionClient,
  propertyId: string
) {
  const property = await tx.property.findUnique({
    where: { id: propertyId },
    select: { id: true },
  });

  if (!property) {
    throw new LeaseValidationError("Property not found", 404);
  }
}

async function ensureResidentsAreTenants(
  tx: Prisma.TransactionClient,
  residentIds: string[]
) {
  const residents = await tx.user.findMany({
    where: {
      id: { in: residentIds },
      role: "TENANT",
      isActive: true,
    },
    select: { id: true },
  });

  if (residents.length !== residentIds.length) {
    throw new LeaseValidationError("All residents must be active tenant users");
  }
}

export async function validateActiveLeaseConflicts(
  tx: Prisma.TransactionClient,
  payload: Pick<LeasePayload, "propertyId" | "status" | "residentIds">,
  currentLeaseId?: string
) {
  if (payload.status !== "ACTIVE") return;

  const propertyConflict = await tx.lease.findFirst({
    where: {
      propertyId: payload.propertyId,
      status: "ACTIVE",
      ...(currentLeaseId ? { NOT: { id: currentLeaseId } } : {}),
    },
    select: { id: true },
  });

  if (propertyConflict) {
    throw new LeaseValidationError("This property already has an active lease");
  }

  const residentConflict = await tx.leaseResident.findFirst({
    where: {
      userId: { in: payload.residentIds },
      lease: {
        status: "ACTIVE",
        ...(currentLeaseId ? { NOT: { id: currentLeaseId } } : {}),
      },
      OR: [{ moveOutDate: null }, { moveOutDate: { gt: new Date() } }],
    },
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  });

  if (residentConflict) {
    const residentName =
      [residentConflict.user.firstName, residentConflict.user.lastName]
        .filter(Boolean)
        .join(" ") || residentConflict.user.email;
    throw new LeaseValidationError(`${residentName} already has an active lease`);
  }
}

export async function createLease(payload: LeasePayload) {
  return runSerializableLeaseTransaction(async (tx) => {
    await ensurePropertyExists(tx, payload.propertyId);
    await ensureResidentsAreTenants(tx, payload.residentIds);
    await validateActiveLeaseConflicts(tx, payload);

    return tx.lease.create({
      data: {
        propertyId: payload.propertyId,
        status: payload.status,
        startDate: payload.startDate,
        endDate: payload.endDate,
        rentAmount: payload.rentAmount,
        securityDeposit: payload.securityDeposit,
        occupantCount: payload.occupantCount,
        notes: payload.notes,
        residents: {
          create: payload.residentIds.map((userId) => ({
            userId,
            isPrimary: userId === payload.primaryResidentId,
            moveInDate: payload.startDate,
          })),
        },
      },
      include: getAdminLeaseInclude(),
    });
  });
}

export async function updateLease(leaseId: string, payload: LeasePayload) {
  return runSerializableLeaseTransaction(async (tx) => {
    const existing = await tx.lease.findUnique({
      where: { id: leaseId },
      select: { id: true },
    });

    if (!existing) {
      throw new LeaseValidationError("Lease not found", 404);
    }

    await ensurePropertyExists(tx, payload.propertyId);
    await ensureResidentsAreTenants(tx, payload.residentIds);
    await validateActiveLeaseConflicts(tx, payload, leaseId);

    await tx.lease.update({
      where: { id: leaseId },
      data: {
        propertyId: payload.propertyId,
        status: payload.status,
        startDate: payload.startDate,
        endDate: payload.endDate,
        rentAmount: payload.rentAmount,
        securityDeposit: payload.securityDeposit,
        occupantCount: payload.occupantCount,
        notes: payload.notes,
      },
    });

    await syncLeaseResidents(tx, leaseId, payload);

    return tx.lease.findUniqueOrThrow({
      where: { id: leaseId },
      include: getAdminLeaseInclude(),
    });
  });
}

function activeLeaseResidentWhere(now = new Date()): Prisma.LeaseResidentWhereInput {
  return {
    OR: [{ moveOutDate: null }, { moveOutDate: { gt: now } }],
  };
}

function isPastMoveOut(moveOutDate: Date | null, now: Date) {
  return !!moveOutDate && moveOutDate <= now;
}

async function syncLeaseResidents(
  tx: Prisma.TransactionClient,
  leaseId: string,
  payload: LeasePayload
) {
  const now = new Date();
  const nextResidentIds = new Set(payload.residentIds);
  const existingResidents = await tx.leaseResident.findMany({
    where: { leaseId },
    select: {
      id: true,
      userId: true,
      isPrimary: true,
      moveOutDate: true,
    },
  });

  const existingResidentIds = new Set(existingResidents.map((resident) => resident.userId));

  for (const resident of existingResidents) {
    const shouldRemain = nextResidentIds.has(resident.userId);

    if (shouldRemain) {
      const shouldBePrimary = resident.userId === payload.primaryResidentId;
      const data: Prisma.LeaseResidentUpdateInput = {};

      if (resident.isPrimary !== shouldBePrimary) {
        data.isPrimary = shouldBePrimary;
      }
      if (isPastMoveOut(resident.moveOutDate, now)) {
        data.moveOutDate = null;
      }
      if (Object.keys(data).length > 0) {
        await tx.leaseResident.update({
          where: { id: resident.id },
          data,
        });
      }
      continue;
    }

    const data: Prisma.LeaseResidentUpdateInput = {};
    if (resident.isPrimary) {
      data.isPrimary = false;
    }
    if (!resident.moveOutDate || resident.moveOutDate > now) {
      data.moveOutDate = now;
    }
    if (Object.keys(data).length > 0) {
      await tx.leaseResident.update({
        where: { id: resident.id },
        data,
      });
    }
  }

  const addedResidentIds = payload.residentIds.filter(
    (residentId) => !existingResidentIds.has(residentId)
  );

  if (addedResidentIds.length > 0) {
    await tx.leaseResident.createMany({
      data: addedResidentIds.map((userId) => ({
        leaseId,
        userId,
        isPrimary: userId === payload.primaryResidentId,
        moveInDate: payload.startDate,
      })),
    });
  }
}

export function getAdminLeaseInclude(now = new Date()) {
  return {
    property: {
      select: {
        id: true,
        title: true,
        slug: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        zipCode: true,
        price: true,
        securityDeposit: true,
      },
    },
    residents: {
      where: activeLeaseResidentWhere(now),
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [{ isPrimary: "desc" as const }, { createdAt: "asc" as const }],
    },
  } satisfies Prisma.LeaseInclude;
}

export function getCurrentLeaseInclude(now = new Date()) {
  return {
    lease: {
      include: {
        property: {
          select: {
            id: true,
            title: true,
            slug: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            zipCode: true,
            price: true,
            securityDeposit: true,
          },
        },
        residents: {
          where: activeLeaseResidentWhere(now),
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: [{ isPrimary: "desc" as const }, { createdAt: "asc" as const }],
        },
      },
    },
  } satisfies Prisma.LeaseResidentInclude;
}

export async function getCurrentLeaseForUser(userId: string) {
  const now = new Date();
  return prisma.leaseResident.findFirst({
    where: {
      userId,
      lease: { status: "ACTIVE" },
      ...activeLeaseResidentWhere(now),
    },
    include: getCurrentLeaseInclude(now),
    orderBy: { createdAt: "desc" },
  });
}

export function serializeLease(lease: Awaited<ReturnType<typeof createLease>>) {
  return {
    ...lease,
    startDate: lease.startDate.toISOString(),
    endDate: lease.endDate?.toISOString() ?? null,
    rentAmount: lease.rentAmount.toString(),
    securityDeposit: lease.securityDeposit?.toString() ?? null,
    createdAt: lease.createdAt.toISOString(),
    updatedAt: lease.updatedAt.toISOString(),
    property: {
      ...lease.property,
      price: lease.property.price.toString(),
      securityDeposit: lease.property.securityDeposit?.toString() ?? null,
    },
    residents: lease.residents.map((resident) => ({
      ...resident,
      moveInDate: resident.moveInDate?.toISOString() ?? null,
      moveOutDate: resident.moveOutDate?.toISOString() ?? null,
      createdAt: resident.createdAt.toISOString(),
      updatedAt: resident.updatedAt.toISOString(),
    })),
  };
}

export function serializeCurrentLeaseResident(
  resident: NonNullable<Awaited<ReturnType<typeof getCurrentLeaseForUser>>>
) {
  const { lease } = resident;

  return {
    ...resident,
    moveInDate: resident.moveInDate?.toISOString() ?? null,
    moveOutDate: resident.moveOutDate?.toISOString() ?? null,
    createdAt: resident.createdAt.toISOString(),
    updatedAt: resident.updatedAt.toISOString(),
    lease: {
      ...lease,
      startDate: lease.startDate.toISOString(),
      endDate: lease.endDate?.toISOString() ?? null,
      rentAmount: lease.rentAmount.toString(),
      securityDeposit: lease.securityDeposit?.toString() ?? null,
      createdAt: lease.createdAt.toISOString(),
      updatedAt: lease.updatedAt.toISOString(),
      property: {
        ...lease.property,
        price: lease.property.price.toString(),
        securityDeposit: lease.property.securityDeposit?.toString() ?? null,
      },
      residents: lease.residents.map((leaseResident) => ({
        ...leaseResident,
        moveInDate: leaseResident.moveInDate?.toISOString() ?? null,
        moveOutDate: leaseResident.moveOutDate?.toISOString() ?? null,
        createdAt: leaseResident.createdAt.toISOString(),
        updatedAt: leaseResident.updatedAt.toISOString(),
      })),
    },
  };
}
