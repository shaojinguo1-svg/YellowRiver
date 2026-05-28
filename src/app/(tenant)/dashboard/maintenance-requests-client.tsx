"use client";

import { useState } from "react";
import {
  ClipboardList,
  Plus,
  RefreshCw,
  Wrench,
  XCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type MaintenanceRequestStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED";
type MaintenanceRequestPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
type MaintenanceRequestCategory =
  | "GENERAL"
  | "PLUMBING"
  | "ELECTRICAL"
  | "HVAC"
  | "APPLIANCE"
  | "OTHER";

type TenantMaintenanceRequest = {
  id: string;
  status: MaintenanceRequestStatus;
  priority: MaintenanceRequestPriority;
  category: MaintenanceRequestCategory;
  title: string;
  description: string;
  location: string | null;
  submittedAt: string;
  resolvedAt: string | null;
  cancelledAt: string | null;
};

type MaintenanceRequestsClientProps = {
  initialRequests: TenantMaintenanceRequest[];
};

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

const STATUS_LABELS: Record<MaintenanceRequestStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<MaintenanceRequestStatus, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  RESOLVED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function enumLabel<T extends string>(
  value: T,
  options: { value: T; label: string }[]
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function MaintenanceRequestsClient({
  initialRequests,
}: MaintenanceRequestsClientProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState<MaintenanceRequestPriority>("NORMAL");
  const [category, setCategory] = useState<MaintenanceRequestCategory>("GENERAL");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/tenant/maintenance-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          location: location || null,
          priority,
          category,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit maintenance request");
      }

      setRequests((current) => [data.request, ...current]);
      setTitle("");
      setDescription("");
      setLocation("");
      setPriority("NORMAL");
      setCategory("GENERAL");
      setMessage("Maintenance request submitted.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to submit maintenance request"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function cancelRequest(requestId: string) {
    setMessage(null);
    setError(null);

    try {
      setCancellingId(requestId);
      const response = await fetch(
        `/api/tenant/maintenance-requests/${requestId}`,
        { method: "PATCH" }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to cancel maintenance request");
      }

      setRequests((current) =>
        current.map((request) =>
          request.id === requestId ? data.request : request
        )
      );
      setMessage("Maintenance request cancelled.");
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Failed to cancel maintenance request"
      );
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wrench className="size-4 text-gold" />
          Maintenance Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="maintenanceTitle">Title</Label>
            <Input
              id="maintenanceTitle"
              required
              maxLength={120}
              placeholder="Brief summary"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="maintenanceCategory">Category</Label>
              <Select
                value={category}
                onValueChange={(value) =>
                  setCategory(value as MaintenanceRequestCategory)
                }
              >
                <SelectTrigger id="maintenanceCategory" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenancePriority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) =>
                  setPriority(value as MaintenanceRequestPriority)
                }
              >
                <SelectTrigger id="maintenancePriority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenanceLocation">Location</Label>
            <Input
              id="maintenanceLocation"
              maxLength={160}
              placeholder="Kitchen, bathroom, entry..."
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenanceDescription">Description</Label>
            <Textarea
              id="maintenanceDescription"
              required
              maxLength={5000}
              rows={5}
              placeholder="Describe what needs attention."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gold text-white hover:bg-gold-dark"
          >
            {isSubmitting ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Submit Request
          </Button>
        </form>

        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-md border border-dashed text-center">
              <ClipboardList className="size-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-warm-900">
                No maintenance requests yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Submitted requests will appear here.
              </p>
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="rounded-md border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-medium text-warm-900">
                      {request.title}
                    </h3>
                    <p className="mt-1 text-sm text-warm-500">
                      {request.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{enumLabel(request.category, CATEGORIES)}</span>
                      <span>&middot;</span>
                      <span>{enumLabel(request.priority, PRIORITIES)}</span>
                      {request.location && (
                        <>
                          <span>&middot;</span>
                          <span>{request.location}</span>
                        </>
                      )}
                      <span>&middot;</span>
                      <span>Submitted {dateLabel(request.submittedAt)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                    <Badge variant="outline" className={STATUS_COLORS[request.status]}>
                      {STATUS_LABELS[request.status]}
                    </Badge>
                    {request.status === "OPEN" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        disabled={cancellingId === request.id}
                        onClick={() => cancelRequest(request.id)}
                      >
                        {cancellingId === request.id ? (
                          <RefreshCw className="size-4 animate-spin" />
                        ) : (
                          <XCircle className="size-4" />
                        )}
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
