import Link from "next/link";
import { FileText, Search, Eye } from "lucide-react";
import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  RentalApplication,
  ApplicationDocument,
  Property,
  User,
} from "@/generated/prisma/client";

type ApplicationWithRelations = RentalApplication & {
  documents: ApplicationDocument[];
  property: Property;
  applicant: User | null;
};

function ApplicationStatusBadge({ status }: { status: string }) {
  const config = APPLICATION_STATUSES.find((s) => s.value === status);
  return (
    <Badge variant="outline" className={config?.color}>
      {config?.label ?? status}
    </Badge>
  );
}

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const searchQuery = params.search || "";
  const statusFilter = params.status || "";

  let applications: ApplicationWithRelations[] = [];
  let fetchError = false;

  try {
    const where: Record<string, unknown> = {};

    if (statusFilter && statusFilter !== "all") {
      where.status = statusFilter;
    }

    if (searchQuery) {
      where.OR = [
        { applicationNumber: { contains: searchQuery, mode: "insensitive" } },
        { email: { contains: searchQuery, mode: "insensitive" } },
        { firstName: { contains: searchQuery, mode: "insensitive" } },
        { lastName: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    applications = await prisma.rentalApplication.findMany({
      where,
      include: {
        documents: true,
        property: true,
        applicant: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch {
    fetchError = true;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Rental Applications</h2>
        <p className="text-sm text-muted-foreground">
          Review and manage tenant applications
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <form className="relative flex-1" action="/admin/applications">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Search by application # or email..."
            defaultValue={searchQuery}
            className="pl-9"
          />
          {statusFilter && (
            <input type="hidden" name="status" value={statusFilter} />
          )}
        </form>
        <form action="/admin/applications" className="flex items-center gap-2">
          {searchQuery && (
            <input type="hidden" name="search" value={searchQuery} />
          )}
          <Select name="status" defaultValue={statusFilter || "all"}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {APPLICATION_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" variant="outline">
            Filter
          </Button>
        </form>
      </div>

      {/* Applications Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application #</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                        <FileText className="size-7 text-muted-foreground" />
                      </div>
                      <p className="mt-4 text-sm font-medium text-muted-foreground">
                        {fetchError
                          ? "Unable to load applications"
                          : searchQuery || statusFilter
                            ? "No applications match your filters"
                            : "No applications yet"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {fetchError
                          ? "Database connection may not be configured."
                          : searchQuery || statusFilter
                            ? "Try adjusting your search or filter criteria."
                            : "Applications from tenants will appear here."}
                      </p>
                      {(searchQuery || statusFilter) && !fetchError && (
                        <Button asChild size="sm" variant="outline" className="mt-4">
                          <Link href="/admin/applications">Clear Filters</Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-mono text-sm">
                      {application.applicationNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {application.firstName} {application.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {application.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {application.property.title}
                    </TableCell>
                    <TableCell>
                      <ApplicationStatusBadge status={application.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(application.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/applications/${application.id}`}>
                          <Eye className="size-4" />
                          Review
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
