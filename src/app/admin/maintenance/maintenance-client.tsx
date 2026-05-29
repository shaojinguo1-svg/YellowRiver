"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ClipboardList,
  RefreshCw,
  Save,
  Search,
  Wrench,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type MaintenanceRequestStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED";
type MaintenanceRequestPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
type MaintenanceRequestCategory =
  | "GENERAL"
  | "PLUMBING"
  | "ELECTRICAL"
  | "HVAC"
  | "APPLIANCE"
  | "OTHER";

type AdminMaintenanceRequest = {
  id: string;
  status: MaintenanceRequestStatus;
  priority: MaintenanceRequestPriority;
  category: MaintenanceRequestCategory;
  title: string;
  description: string;
  location: string | null;
  adminNotes: string | null;
  submittedAt: string;
  resolvedAt: string | null;
  cancelledAt: string | null;
  updatedAt: string;
  property: {
    title: string;
    city: string;
    state: string;
  };
  submittedBy: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
};

type MaintenanceClientProps = {
  requests: AdminMaintenanceRequest[];
  fetchError: boolean;
  filters: {
    status: MaintenanceRequestStatus | "all";
    priority: MaintenanceRequestPriority | "all";
    category: MaintenanceRequestCategory | "all";
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type FormState = {
  status: MaintenanceRequestStatus;
  priority: MaintenanceRequestPriority;
  category: MaintenanceRequestCategory;
  adminNotes: string;
};

const STATUSES: { value: MaintenanceRequestStatus; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PRIORITIES: { value: MaintenanceRequestPriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const CATEGORIES: { value: MaintenanceRequestCategory; label: string }[] = [
  { value: "GENERAL", label: "General" },
  { value: "PLUMBING", label: "Plumbing" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "HVAC", label: "HVAC" },
  { value: "APPLIANCE", label: "Appliance" },
  { value: "OTHER", label: "Other" },
];

const STATUS_COLORS: Record<MaintenanceRequestStatus, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  RESOLVED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

const PRIORITY_COLORS: Record<MaintenanceRequestPriority, string> = {
  LOW: "bg-gray-100 text-gray-800",
  NORMAL: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

function residentName(request: AdminMaintenanceRequest) {
  return (
    [request.submittedBy.firstName, request.submittedBy.lastName]
      .filter(Boolean)
      .join(" ") || request.submittedBy.email
  );
}

function optionLabel<T extends string>(
  value: T,
  options: { value: T; label: string }[]
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formFromRequest(request: AdminMaintenanceRequest): FormState {
  return {
    status: request.status,
    priority: request.priority,
    category: request.category,
    adminNotes: request.adminNotes ?? "",
  };
}

function requestMatchesFilters(
  request: AdminMaintenanceRequest,
  filters: MaintenanceClientProps["filters"]
) {
  return (
    (filters.status === "all" || request.status === filters.status) &&
    (filters.priority === "all" || request.priority === filters.priority) &&
    (filters.category === "all" || request.category === filters.category)
  );
}

function maintenanceHref(
  filters: MaintenanceClientProps["filters"],
  page = 1
) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.priority !== "all") params.set("priority", filters.priority);
  if (filters.category !== "all") params.set("category", filters.category);

  const query = params.toString();
  return query ? `/admin/maintenance?${query}` : "/admin/maintenance";
}

export function MaintenanceClient({
  requests: initialRequests,
  fetchError,
  filters,
  pagination,
}: MaintenanceClientProps) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [selectedId, setSelectedId] = useState(initialRequests[0]?.id ?? "");
  const selectedRequest =
    requests.find((request) => request.id === selectedId) ?? requests[0] ?? null;
  const [form, setForm] = useState<FormState | null>(
    selectedRequest ? formFromRequest(selectedRequest) : null
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function selectRequest(request: AdminMaintenanceRequest) {
    setSelectedId(request.id);
    setForm(formFromRequest(request));
    setMessage(null);
    setError(null);
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  function updateFilter<K extends keyof MaintenanceClientProps["filters"]>(
    key: K,
    value: MaintenanceClientProps["filters"][K]
  ) {
    router.push(maintenanceHref({ ...filters, [key]: value }, 1));
  }

  async function saveRequest() {
    if (!selectedRequest || !form) return;

    setMessage(null);
    setError(null);

    try {
      setIsSaving(true);
      const response = await fetch(
        `/api/admin/maintenance-requests/${selectedRequest.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: form.status,
            priority: form.priority,
            category: form.category,
            adminNotes: form.adminNotes || null,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update maintenance request");
      }

      const updatedRequest = data.request as AdminMaintenanceRequest;
      const nextRequests = requestMatchesFilters(updatedRequest, filters)
        ? requests.map((request) =>
            request.id === selectedRequest.id ? updatedRequest : request
          )
        : requests.filter((request) => request.id !== selectedRequest.id);

      setRequests(nextRequests);
      if (requestMatchesFilters(updatedRequest, filters)) {
        setSelectedId(updatedRequest.id);
        setForm(formFromRequest(updatedRequest));
      } else {
        const nextSelected = nextRequests[0] ?? null;
        setSelectedId(nextSelected?.id ?? "");
        setForm(nextSelected ? formFromRequest(nextSelected) : null);
      }
      setMessage("Maintenance request updated.");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update maintenance request"
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Maintenance Requests</h2>
          <p className="text-sm text-muted-foreground">
            Review resident requests and update their internal status.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <Select
            value={filters.status}
            onValueChange={(value) =>
              updateFilter("status", value as MaintenanceRequestStatus | "all")
            }
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.priority}
            onValueChange={(value) =>
              updateFilter("priority", value as MaintenanceRequestPriority | "all")
            }
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {PRIORITIES.map((priority) => (
                <SelectItem key={priority.value} value={priority.value}>
                  {priority.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.category}
            onValueChange={(value) =>
              updateFilter("category", value as MaintenanceRequestCategory | "all")
            }
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {fetchError && (
        <Alert variant="destructive">
          <AlertDescription>
            Unable to load maintenance requests. Check database configuration
            and try again.
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4 text-gold" />
              Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Search className="size-8 text-muted-foreground" />
                        <p className="mt-3 text-sm font-medium text-muted-foreground">
                          No maintenance requests found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request) => (
                    <TableRow
                      key={request.id}
                      className={cn(
                        "cursor-pointer",
                        selectedRequest?.id === request.id && "bg-muted/60"
                      )}
                      onClick={() => selectRequest(request)}
                    >
                      <TableCell>
                        <div className="max-w-[260px]">
                          <p className="truncate font-medium">{request.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {residentName(request)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">
                        {request.property.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLORS[request.status]}>
                          {optionLabel(request.status, STATUSES)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={PRIORITY_COLORS[request.priority]}>
                          {optionLabel(request.priority, PRIORITIES)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {dateLabel(request.submittedAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                {pagination.total === 0
                  ? "No requests"
                  : `Showing ${(pagination.page - 1) * pagination.pageSize + 1}-${Math.min(
                      pagination.page * pagination.pageSize,
                      pagination.total
                    )} of ${pagination.total}`}
              </span>
              <div className="flex items-center gap-2">
                {pagination.page <= 1 ? (
                  <Button type="button" variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link href={maintenanceHref(filters, pagination.page - 1)}>
                      Previous
                    </Link>
                  </Button>
                )}
                <span className="min-w-20 text-center text-xs">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                {pagination.page >= pagination.totalPages ? (
                  <Button type="button" variant="outline" size="sm" disabled>
                    Next
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link href={maintenanceHref(filters, pagination.page + 1)}>
                      Next
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="size-4 text-gold" />
              Request Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedRequest || !form ? (
              <p className="text-sm text-muted-foreground">
                Select a request to manage status and internal notes.
              </p>
            ) : (
              <div className="space-y-5">
                <div>
                  <h3 className="font-medium text-warm-900">
                    {selectedRequest.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedRequest.description}
                  </p>
                  <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                    <span>{selectedRequest.property.title}</span>
                    <span>{residentName(selectedRequest)}</span>
                    {selectedRequest.location && (
                      <span>Location: {selectedRequest.location}</span>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(value) =>
                        updateForm("status", value as MaintenanceRequestStatus)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={form.priority}
                      onValueChange={(value) =>
                        updateForm("priority", value as MaintenanceRequestPriority)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:col-span-2 xl:col-span-1">
                    <Label>Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(value) =>
                        updateForm("category", value as MaintenanceRequestCategory)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminNotes">Internal admin notes</Label>
                  <Textarea
                    id="adminNotes"
                    rows={5}
                    placeholder="Internal notes only"
                    value={form.adminNotes}
                    onChange={(event) =>
                      updateForm("adminNotes", event.target.value)
                    }
                  />
                </div>

                <Button
                  type="button"
                  disabled={isSaving}
                  className="w-full bg-gold text-white hover:bg-gold-dark"
                  onClick={saveRequest}
                >
                  {isSaving ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
