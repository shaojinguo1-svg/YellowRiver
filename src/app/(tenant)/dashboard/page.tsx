import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { FileText, Home, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Dashboard | YellowRiver",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }
> = {
  SUBMITTED: { label: "Submitted", variant: "secondary", icon: Clock },
  UNDER_REVIEW: { label: "Under Review", variant: "default", icon: AlertCircle },
  APPROVED: { label: "Approved", variant: "default", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", variant: "destructive", icon: XCircle },
  WITHDRAWN: { label: "Withdrawn", variant: "outline", icon: XCircle },
};

export default async function TenantDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Find applications by email (covers both linked and unlinked applications)
  const applications = await prisma.rentalApplication.findMany({
    where: {
      OR: [
        { applicantId: user.id },
        { email: user.email },
      ],
    },
    include: {
      property: {
        select: {
          title: true,
          slug: true,
          city: true,
          state: true,
          price: true,
        },
      },
      documents: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-warm-900">
          Welcome, {user.firstName || "Tenant"}
        </h1>
        <p className="mt-1 text-sm text-warm-500">
          Track your rental applications and their status.
        </p>
      </div>

      {/* Applications */}
      {applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <FileText className="size-7 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-warm-900">
              No Applications Yet
            </h3>
            <p className="mt-2 max-w-sm text-sm text-warm-500">
              You haven&apos;t submitted any rental applications. Browse our
              listings to find your next home.
            </p>
            <Button asChild className="mt-6 bg-gold text-white hover:bg-gold-dark">
              <Link href="/listings">Browse Listings</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => {
            const status = STATUS_CONFIG[app.status] || STATUS_CONFIG.SUBMITTED;
            const StatusIcon = status.icon;
            const price = Number(app.property.price);

            return (
              <Card key={app.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Property Info */}
                    <div className="flex items-start gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                        <Home className="size-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-warm-900">
                          {app.property.title}
                        </h3>
                        <p className="text-sm text-warm-500">
                          {app.property.city}, {app.property.state} &mdash; $
                          {price.toLocaleString()}/mo
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-warm-400">
                          <span>#{app.applicationNumber}</span>
                          <span>&middot;</span>
                          <span>Applied {format(new Date(app.createdAt), "MMM d, yyyy")}</span>
                          {app.documents.length > 0 && (
                            <>
                              <span>&middot;</span>
                              <span>{app.documents.length} doc(s)</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <Badge variant={status.variant} className="gap-1.5">
                        <StatusIcon className="size-3" />
                        {status.label}
                      </Badge>
                      {app.property.slug && (
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="text-gold hover:text-gold-dark"
                        >
                          <Link href={`/listings/${app.property.slug}`}>
                            View Property
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
