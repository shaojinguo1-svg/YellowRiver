import { describe, expect, it } from "vitest";
import { LeaseValidationError, parseLeasePayload } from "@/lib/lease-payload";

function validLeaseBody(overrides: Record<string, unknown> = {}) {
  return {
    propertyId: "property-1",
    status: "ACTIVE",
    startDate: "2026-06-01",
    endDate: "2027-05-31",
    rentAmount: "1995.00",
    securityDeposit: "1995.00",
    occupantCount: "2",
    notes: " Resident prefers text updates. ",
    residentIds: ["tenant-1", "tenant-2"],
    primaryResidentId: "tenant-1",
    ...overrides,
  };
}

describe("parseLeasePayload", () => {
  it("normalizes a valid lease payload", () => {
    const payload = parseLeasePayload(validLeaseBody());

    expect(payload).toMatchObject({
      propertyId: "property-1",
      status: "ACTIVE",
      rentAmount: "1995.00",
      securityDeposit: "1995.00",
      occupantCount: 2,
      notes: "Resident prefers text updates.",
      residentIds: ["tenant-1", "tenant-2"],
      primaryResidentId: "tenant-1",
    });
    expect(payload.startDate.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(payload.endDate?.toISOString()).toBe("2027-05-31T00:00:00.000Z");
  });

  it("defaults status, removes duplicate residents, and defaults primary resident", () => {
    const payload = parseLeasePayload(
      validLeaseBody({
        status: "",
        residentIds: ["tenant-1", "tenant-1", "tenant-2", ""],
        primaryResidentId: "",
      })
    );

    expect(payload.status).toBe("DRAFT");
    expect(payload.residentIds).toEqual(["tenant-1", "tenant-2"]);
    expect(payload.primaryResidentId).toBe("tenant-1");
  });

  it("rejects invalid status, dates, money, occupants, and resident state", () => {
    expect(() => parseLeasePayload(validLeaseBody({ status: "PENDING" }))).toThrow(
      LeaseValidationError
    );
    expect(() =>
      parseLeasePayload(validLeaseBody({ startDate: "2027-06-01", endDate: "2026-06-01" }))
    ).toThrow("End date cannot be before start date");
    expect(() => parseLeasePayload(validLeaseBody({ rentAmount: "1200.999" }))).toThrow(
      "Rent amount must be a positive amount with up to 2 decimals"
    );
    expect(() => parseLeasePayload(validLeaseBody({ occupantCount: "0" }))).toThrow(
      "Occupant count must be at least 1"
    );
    expect(() => parseLeasePayload(validLeaseBody({ residentIds: [] }))).toThrow(
      "At least one resident is required"
    );
    expect(() =>
      parseLeasePayload(validLeaseBody({ primaryResidentId: "tenant-3" }))
    ).toThrow("Primary resident must be attached to the lease");
  });

  it("rejects non-object and missing required fields", () => {
    expect(() => parseLeasePayload(null)).toThrow("Invalid request body");
    expect(() => parseLeasePayload(validLeaseBody({ propertyId: "" }))).toThrow(
      "Property is required"
    );
    expect(() => parseLeasePayload(validLeaseBody({ startDate: "" }))).toThrow(
      "Start date is required"
    );
  });
});
