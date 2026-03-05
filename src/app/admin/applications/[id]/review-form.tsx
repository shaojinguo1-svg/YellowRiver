"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ApplicationReviewFormProps {
  applicationId: string;
  currentStatus: string;
  currentNotes: string;
  reviewedAt: string | null;
}

export function ApplicationReviewForm({
  applicationId,
  currentStatus,
  currentNotes,
  reviewedAt,
}: ApplicationReviewFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [adminNotes, setAdminNotes] = useState(currentNotes);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const statusConfig = APPLICATION_STATUSES.find(
    (s) => s.value === currentStatus
  );

  async function handleSubmit(newStatus?: string) {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus || status,
          adminNotes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update application");
      }

      setSuccess("Application updated successfully.");
      if (newStatus) {
        setStatus(newStatus);
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update application"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className={`text-sm ${statusConfig?.color}`}>
            {statusConfig?.label ?? currentStatus}
          </Badge>
          {reviewedAt && (
            <p className="mt-2 text-xs text-muted-foreground">
              Last reviewed: {reviewedAt}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Update Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Update Application</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Change Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {APPLICATION_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminNotes">Admin Notes</Label>
            <Textarea
              id="adminNotes"
              placeholder="Add internal notes about this application..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              These notes are only visible to administrators.
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
              {success}
            </div>
          )}

          <Button
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => handleSubmit("APPROVED")}
            disabled={
              isSubmitting ||
              currentStatus === "APPROVED" ||
              currentStatus === "WITHDRAWN"
            }
            variant="outline"
            className="w-full border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
          >
            <CheckCircle2 className="size-4" />
            Approve Application
          </Button>
          <Button
            onClick={() => handleSubmit("REJECTED")}
            disabled={
              isSubmitting ||
              currentStatus === "REJECTED" ||
              currentStatus === "WITHDRAWN"
            }
            variant="outline"
            className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
          >
            <XCircle className="size-4" />
            Reject Application
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
