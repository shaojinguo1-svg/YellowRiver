export const LEASE_STATUSES = ["DRAFT", "ACTIVE", "ENDED", "CANCELLED"] as const;

export type LeaseStatusValue = (typeof LEASE_STATUSES)[number];

export type LeasePayload = {
  propertyId: string;
  status: LeaseStatusValue;
  startDate: Date;
  endDate: Date | null;
  rentAmount: string;
  securityDeposit: string | null;
  occupantCount: number;
  notes: string | null;
  residentIds: string[];
  primaryResidentId: string;
};

export class LeaseValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "LeaseValidationError";
    this.status = status;
  }
}

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
  if (!LEASE_STATUSES.includes(rawStatus as LeaseStatusValue)) {
    throw new LeaseValidationError("Lease status is invalid");
  }
  const status = rawStatus as LeaseStatusValue;

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
