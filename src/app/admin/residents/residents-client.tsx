"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Users,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type LeaseStatus = "DRAFT" | "ACTIVE" | "ENDED" | "CANCELLED";

type Tenant = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

type PropertyOption = {
  id: string;
  title: string;
  city: string;
  state: string;
  status: string;
  price: string;
};

type LeaseResident = {
  id: string;
  userId: string;
  isPrimary: boolean;
  moveInDate: string | null;
  moveOutDate: string | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
};

type LeaseView = {
  id: string;
  propertyId: string;
  status: LeaseStatus;
  startDate: string;
  endDate: string | null;
  rentAmount: string;
  securityDeposit: string | null;
  occupantCount: number;
  notes: string | null;
  property: {
    id: string;
    title: string;
    slug: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    zipCode: string;
    price: string;
    securityDeposit: string | null;
  };
  residents: LeaseResident[];
};

type ResidentsClientProps = {
  tenants: Tenant[];
  properties: PropertyOption[];
  leases: LeaseView[];
  fetchError: boolean;
};

type FormState = {
  leaseId: string | null;
  propertyId: string;
  status: LeaseStatus;
  startDate: string;
  endDate: string;
  rentAmount: string;
  securityDeposit: string;
  occupantCount: string;
  notes: string;
  residentIds: string[];
  primaryResidentId: string;
};

const LEASE_STATUSES: { value: LeaseStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "ENDED", label: "Ended" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_BADGES: Record<LeaseStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  ACTIVE: "bg-green-100 text-green-800",
  ENDED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-red-100 text-red-800",
};

function tenantName(tenant: Tenant | LeaseResident["user"]) {
  return (
    [tenant.firstName, tenant.lastName].filter(Boolean).join(" ") ||
    tenant.email
  );
}

function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function moneyLabel(value: string | null) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "$0";
  return `$${amount.toLocaleString()}`;
}

function dateLabel(value: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function createEmptyForm(defaultPropertyId = ""): FormState {
  return {
    leaseId: null,
    propertyId: defaultPropertyId,
    status: "DRAFT",
    startDate: "",
    endDate: "",
    rentAmount: "",
    securityDeposit: "",
    occupantCount: "1",
    notes: "",
    residentIds: [],
    primaryResidentId: "",
  };
}

export function ResidentsClient({
  tenants,
  properties,
  leases,
  fetchError,
}: ResidentsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() =>
    createEmptyForm(properties[0]?.id ?? "")
  );

  const activeLeaseByTenant = useMemo(() => {
    const map = new Map<string, LeaseView>();
    for (const lease of leases) {
      if (lease.status !== "ACTIVE") continue;
      for (const resident of lease.residents) {
        map.set(resident.userId, lease);
      }
    }
    return map;
  }, [leases]);

  const activeLeases = leases.filter((lease) => lease.status === "ACTIVE");
  const attachedTenants = tenants.filter((tenant) =>
    form.residentIds.includes(tenant.id)
  );

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(createEmptyForm(properties[0]?.id ?? ""));
    setMessage(null);
    setError(null);
  }

  function editLease(lease: LeaseView) {
    setForm({
      leaseId: lease.id,
      propertyId: lease.propertyId,
      status: lease.status,
      startDate: toDateInput(lease.startDate),
      endDate: toDateInput(lease.endDate),
      rentAmount: lease.rentAmount,
      securityDeposit: lease.securityDeposit ?? "",
      occupantCount: String(lease.occupantCount),
      notes: lease.notes ?? "",
      residentIds: lease.residents.map((resident) => resident.userId),
      primaryResidentId:
        lease.residents.find((resident) => resident.isPrimary)?.userId ??
        lease.residents[0]?.userId ??
        "",
    });
    setMessage(null);
    setError(null);
  }

  function toggleResident(userId: string, checked: boolean) {
    setForm((current) => {
      const residentIds = checked
        ? Array.from(new Set([...current.residentIds, userId]))
        : current.residentIds.filter((id) => id !== userId);
      const primaryResidentId = residentIds.includes(current.primaryResidentId)
        ? current.primaryResidentId
        : residentIds[0] ?? "";

      return { ...current, residentIds, primaryResidentId };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const endpoint = form.leaseId
      ? `/api/admin/leases/${form.leaseId}`
      : "/api/admin/leases";
    const method = form.leaseId ? "PATCH" : "POST";

    try {
      setIsSaving(true);
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: form.propertyId,
          status: form.status,
          startDate: form.startDate,
          endDate: form.endDate || null,
          rentAmount: form.rentAmount,
          securityDeposit: form.securityDeposit || null,
          occupantCount: form.occupantCount,
          notes: form.notes || null,
          residentIds: form.residentIds,
          primaryResidentId: form.primaryResidentId,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save lease");
      }

      setMessage(form.leaseId ? "Lease updated." : "Lease created.");
      startTransition(() => router.refresh());
      if (!form.leaseId) {
        setForm(createEmptyForm(properties[0]?.id ?? ""));
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save lease"
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Residents & Leases</h2>
          <p className="text-sm text-muted-foreground">
            Create resident lease records and connect tenants to properties.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={resetForm}>
          <Plus className="size-4" />
          New Lease
        </Button>
      </div>

      {fetchError && (
        <Alert variant="destructive">
          <AlertDescription>
            Unable to load resident records. Check database configuration and
            try again.
          </AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="size-4 text-gold" />
                Lease Basics
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="propertyId">Property</Label>
                <Select
                  value={form.propertyId}
                  onValueChange={(value) => updateForm("propertyId", value)}
                >
                  <SelectTrigger id="propertyId" className="w-full">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.title} - {property.city}, {property.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    updateForm("status", value as LeaseStatus)
                  }
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEASE_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupantCount">Occupants</Label>
                <Input
                  id="occupantCount"
                  min={1}
                  type="number"
                  value={form.occupantCount}
                  onChange={(event) =>
                    updateForm("occupantCount", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start date</Label>
                <Input
                  id="startDate"
                  required
                  type="date"
                  value={form.startDate}
                  onChange={(event) => updateForm("startDate", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(event) => updateForm("endDate", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rentAmount">Monthly rent</Label>
                <Input
                  id="rentAmount"
                  required
                  inputMode="decimal"
                  placeholder="2400.00"
                  value={form.rentAmount}
                  onChange={(event) =>
                    updateForm("rentAmount", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="securityDeposit">Security deposit</Label>
                <Input
                  id="securityDeposit"
                  inputMode="decimal"
                  placeholder="Optional"
                  value={form.securityDeposit}
                  onChange={(event) =>
                    updateForm("securityDeposit", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="Internal lease notes"
                  value={form.notes}
                  onChange={(event) => updateForm("notes", event.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4 text-gold" />
                Attached Tenants
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tenants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active tenant users are available.
                </p>
              ) : (
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {tenants.map((tenant) => {
                    const activeLease = activeLeaseByTenant.get(tenant.id);
                    const selected = form.residentIds.includes(tenant.id);
                    const activeElsewhere =
                      activeLease && activeLease.id !== form.leaseId;

                    return (
                      <div
                        key={tenant.id}
                        className={cn(
                          "flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between",
                          selected && "border-gold/60 bg-gold/5"
                        )}
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <Checkbox
                            checked={selected}
                            onCheckedChange={(checked) =>
                              toggleResident(tenant.id, checked === true)
                            }
                            aria-label={`Attach ${tenantName(tenant)}`}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {tenantName(tenant)}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {tenant.email}
                            </p>
                            {activeLease && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Active lease: {activeLease.property.title}
                                {activeElsewhere ? "" : " (this lease)"}
                              </p>
                            )}
                          </div>
                        </div>
                        {selected && (
                          <label className="flex items-center gap-2 text-xs text-muted-foreground">
                            <input
                              type="radio"
                              name="primaryResident"
                              checked={form.primaryResidentId === tenant.id}
                              onChange={() =>
                                updateForm("primaryResidentId", tenant.id)
                              }
                            />
                            Primary
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {attachedTenants.length} tenant(s) attached. Active property
                  and tenant conflicts are checked before saving.
                </p>
                <Button
                  type="submit"
                  disabled={isSaving || isPending || tenants.length === 0}
                  className="bg-gold text-white hover:bg-gold-dark"
                >
                  {isSaving || isPending ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {form.leaseId ? "Update Lease" : "Create Lease"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tenant Status</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="py-8 text-center text-sm text-muted-foreground">
                        No tenant users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tenants.map((tenant) => {
                      const activeLease = activeLeaseByTenant.get(tenant.id);
                      return (
                        <TableRow key={tenant.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{tenantName(tenant)}</p>
                              <p className="text-xs text-muted-foreground">
                                {tenant.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {activeLease ? (
                              <Badge variant="outline" className={STATUS_BADGES.ACTIVE}>
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline">No active lease</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Leases</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leases.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No leases have been created yet.
                </p>
              ) : (
                leases.map((lease) => (
                  <div key={lease.id} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {lease.property.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dateLabel(lease.startDate)} - {dateLabel(lease.endDate)}
                        </p>
                      </div>
                      <Badge variant="outline" className={STATUS_BADGES[lease.status]}>
                        {LEASE_STATUSES.find((status) => status.value === lease.status)?.label}
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                      <span>{moneyLabel(lease.rentAmount)}/mo</span>
                      <span>
                        {lease.residents.map((resident) => tenantName(resident.user)).join(", ")}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-3 text-gold hover:text-gold-dark"
                      onClick={() => editLease(lease)}
                    >
                      <Pencil className="size-4" />
                      Edit
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium">{activeLeases.length} active lease(s)</p>
              <p className="mt-1 text-xs text-muted-foreground">
                One active lease is allowed per property. A tenant can keep
                historical leases and one current lease.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
