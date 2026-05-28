import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Home,
  Users,
  XCircle,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentLeaseForUser } from "@/lib/resident-leases";
import {
  listTenantMaintenanceRequests,
  serializeTenantMaintenanceRequest,
} from "@/lib/maintenance-requests";
import { MaintenanceRequestsClient } from "./maintenance-requests-client";
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

function formatMoney(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "$0";
  return `$${amount.toLocaleString()}`;
}

export default async function TenantDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const currentLeaseResident = await getCurrentLeaseForUser(user.id);

  if (currentLeaseResident) {
    const { lease } = currentLeaseResident;
    const maintenanceRequests = (
      await listTenantMaintenanceRequests(user.id)
    ).map(serializeTenantMaintenanceRequest);
    const primaryResident = lease.residents.find((resident) => resident.isPrimary);
    const residentNames = lease.residents
      .map((resident) =>
        [resident.user.firstName, resident.user.lastName]
          .filter(Boolean)
          .join(" ") || "Resident"
      )
      .join(", ");

    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-warm-900">
            Welcome, {user.firstName || "Resident"}
          </h1>
          <p className="mt-1 text-sm text-warm-500">
            View your active lease and property details.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Home className="size-4 text-gold" />
                Current Residence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-semibold text-warm-900">
                  {lease.property.title}
                </h2>
                <p className="mt-1 text-sm text-warm-500">
                  {lease.property.addressLine1}
                  {lease.property.addressLine2
                    ? `, ${lease.property.addressLine2}`
                    : ""}
                </p>
                <p className="text-sm text-warm-500">
                  {lease.property.city}, {lease.property.state}{" "}
                  {lease.property.zipCode}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-warm-900">
                    <CalendarDays className="size-4 text-gold" />
                    Lease dates
                  </div>
                  <p className="mt-2 text-sm text-warm-500">
                    {format(new Date(lease.startDate), "MMM d, yyyy")} -{" "}
                    {lease.endDate
                      ? format(new Date(lease.endDate), "MMM d, yyyy")
                      : "No end date"}
                  </p>
                </div>

                <div className="rounded-md border p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-warm-900">
                    <DollarSign className="size-4 text-gold" />
                    Monthly rent
                  </div>
                  <p className="mt-2 text-sm text-warm-500">
                    {formatMoney(lease.rentAmount)}
                  </p>
                </div>

                <div className="rounded-md border p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-warm-900">
                    <Users className="size-4 text-gold" />
                    Residents
                  </div>
                  <p className="mt-2 text-sm text-warm-500">
                    {residentNames || "Not recorded"}
                  </p>
                </div>

                <div className="rounded-md border p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-warm-900">
                    <FileText className="size-4 text-gold" />
                    Occupants
                  </div>
                  <p className="mt-2 text-sm text-warm-500">
                    {lease.occupantCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lease Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-warm-500">Status</span>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-warm-500">Primary resident</span>
                <span className="text-right font-medium text-warm-900">
                  {primaryResident
                    ? [primaryResident.user.firstName, primaryResident.user.lastName]
                        .filter(Boolean)
                        .join(" ") || "Resident"
                    : "Not recorded"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-warm-500">Security deposit</span>
                <span className="font-medium text-warm-900">
                  {lease.securityDeposit
                    ? formatMoney(lease.securityDeposit)
                    : "Not recorded"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <MaintenanceRequestsClient initialRequests={maintenanceRequests} />
      </div>
    );
  }

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
