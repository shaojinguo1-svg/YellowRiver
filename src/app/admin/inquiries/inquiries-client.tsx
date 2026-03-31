"use client";

import { Fragment, useState } from "react";
import { format } from "date-fns";
import {
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SerializedInquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  propertyId: string | null;
  userId: string | null;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const INQUIRY_STATUS_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  NEW: { label: "New", color: "bg-blue-100 text-blue-800" },
  READ: { label: "Read", color: "bg-yellow-100 text-yellow-800" },
  REPLIED: { label: "Replied", color: "bg-green-100 text-green-800" },
  ARCHIVED: { label: "Archived", color: "bg-gray-100 text-gray-800" },
};

function InquiryStatusBadge({ status }: { status: string }) {
  const config = INQUIRY_STATUS_CONFIG[status] || {
    label: status,
    color: "",
  };
  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
}

interface InquiriesClientProps {
  inquiries: SerializedInquiry[];
  fetchError: boolean;
}

export function InquiriesClient({
  inquiries: initialInquiries,
  fetchError,
}: InquiriesClientProps) {
  const [inquiries, setInquiries] =
    useState<SerializedInquiry[]>(initialInquiries);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  async function handleToggle(inquiry: SerializedInquiry) {
    if (expandedId === inquiry.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(inquiry.id);
    setError(null);
    setSuccessId(null);

    // Mark as read if it is NEW
    if (inquiry.status === "NEW") {
      try {
        const response = await fetch(`/api/inquiries/${inquiry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "READ" }),
        });

        if (response.ok) {
          setInquiries((prev) =>
            prev.map((inq) =>
              inq.id === inquiry.id ? { ...inq, status: "READ" } : inq
            )
          );
        }
      } catch {
        // Silently fail for mark-as-read -- not critical
      }
    }
  }

  async function handleReply(inquiryId: string) {
    const reply = replyText[inquiryId]?.trim();
    if (!reply) return;

    setSubmittingId(inquiryId);
    setError(null);
    setSuccessId(null);

    try {
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REPLIED",
          adminReply: reply,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to send reply");
      }

      const updatedInquiry = await response.json();

      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === inquiryId
            ? {
                ...inq,
                status: "REPLIED",
                adminReply: reply,
                repliedAt: updatedInquiry.repliedAt || new Date().toISOString(),
              }
            : inq
        )
      );

      setReplyText((prev) => ({ ...prev, [inquiryId]: "" }));
      setSuccessId(inquiryId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send reply"
      );
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Contact Inquiries</h2>
        <p className="text-sm text-muted-foreground">
          View and respond to contact form submissions
        </p>
      </div>

      {/* Inquiries Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {inquiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                        <MessageSquare className="size-7 text-muted-foreground" />
                      </div>
                      <p className="mt-4 text-sm font-medium text-muted-foreground">
                        {fetchError
                          ? "Unable to load inquiries"
                          : "No inquiries yet"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {fetchError
                          ? "Database connection may not be configured."
                          : "Contact form submissions will appear here."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                inquiries.map((inquiry) => (
                  <Fragment key={inquiry.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleToggle(inquiry)}
                    >
                      <TableCell className="font-medium">
                        {inquiry.name}
                      </TableCell>
                      <TableCell className="text-sm">
                        {inquiry.email}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {inquiry.subject}
                      </TableCell>
                      <TableCell>
                        <InquiryStatusBadge status={inquiry.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(inquiry.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {expandedId === inquiry.id ? (
                          <ChevronUp className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="size-4 text-muted-foreground" />
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expanded Detail Row */}
                    {expandedId === inquiry.id && (
                      <TableRow key={`${inquiry.id}-detail`}>
                        <TableCell colSpan={6} className="bg-muted/30 p-0">
                          <div className="space-y-4 p-6">
                            {/* Message */}
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">
                                Message
                              </h4>
                              <p className="mt-1 text-sm whitespace-pre-wrap">
                                {inquiry.message}
                              </p>
                            </div>

                            {/* Contact Info */}
                            <div className="flex gap-6 text-sm">
                              <div>
                                <span className="font-medium text-muted-foreground">
                                  Email:{" "}
                                </span>
                                <a
                                  href={`mailto:${inquiry.email}`}
                                  className="text-blue-600 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {inquiry.email}
                                </a>
                              </div>
                              {inquiry.phone && (
                                <div>
                                  <span className="font-medium text-muted-foreground">
                                    Phone:{" "}
                                  </span>
                                  {inquiry.phone}
                                </div>
                              )}
                            </div>

                            {/* Previous Reply */}
                            {inquiry.adminReply && (
                              <div className="rounded-md border bg-white p-4">
                                <div className="flex items-center gap-2">
                                  <Mail className="size-4 text-green-600" />
                                  <h4 className="text-sm font-medium">
                                    Admin Reply
                                  </h4>
                                  {inquiry.repliedAt && (
                                    <span className="text-xs text-muted-foreground">
                                      &middot;{" "}
                                      {format(
                                        new Date(inquiry.repliedAt),
                                        "MMM d, yyyy 'at' h:mm a"
                                      )}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-2 text-sm whitespace-pre-wrap">
                                  {inquiry.adminReply}
                                </p>
                              </div>
                            )}

                            {/* Reply Form */}
                            <div className="space-y-3">
                              <Label htmlFor={`reply-${inquiry.id}`}>
                                {inquiry.adminReply
                                  ? "Update Reply"
                                  : "Send Reply"}
                              </Label>
                              <Textarea
                                id={`reply-${inquiry.id}`}
                                placeholder="Type your reply..."
                                value={replyText[inquiry.id] || ""}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setReplyText((prev) => ({
                                    ...prev,
                                    [inquiry.id]: e.target.value,
                                  }));
                                }}
                                onClick={(e) => e.stopPropagation()}
                                rows={3}
                              />

                              {error && expandedId === inquiry.id && (
                                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                                  {error}
                                </div>
                              )}
                              {successId === inquiry.id && (
                                <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                                  Reply saved successfully.
                                </div>
                              )}

                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReply(inquiry.id);
                                }}
                                disabled={
                                  submittingId === inquiry.id ||
                                  !replyText[inquiry.id]?.trim()
                                }
                              >
                                {submittingId === inquiry.id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Send className="size-4" />
                                )}
                                {inquiry.adminReply
                                  ? "Update Reply"
                                  : "Send Reply"}
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
