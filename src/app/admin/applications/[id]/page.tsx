import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, FileText, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationReviewForm } from "./review-form";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;

  let application;
  try {
    application = await prisma.rentalApplication.findUnique({
      where: { id },
      include: {
        documents: true,
        property: true,
        applicant: true,
      },
    });
  } catch {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/applications">
            <ArrowLeft className="size-4" />
            Back to Applications
          </Link>
        </Button>
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Unable to load application. Database connection may not be
              configured.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!application) {
    notFound();
  }

  const statusConfig = APPLICATION_STATUSES.find(
    (s) => s.value === application.status
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/applications">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
          <div>
            <h2 className="text-lg font-semibold">
              Application {application.applicationNumber}
            </h2>
            <p className="text-sm text-muted-foreground">
              Submitted{" "}
              {format(new Date(application.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={statusConfig?.color}>
          {statusConfig?.label ?? application.status}
        </Badge>
      </div>

      {/* Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Application Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Full Name
                  </dt>
                  <dd className="mt-1 text-sm">
                    {application.firstName} {application.lastName}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Email
                  </dt>
                  <dd className="mt-1 text-sm">{application.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Phone
                  </dt>
                  <dd className="mt-1 text-sm">{application.phone}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Date of Birth
                  </dt>
                  <dd className="mt-1 text-sm">
                    {application.dateOfBirth
                      ? format(new Date(application.dateOfBirth), "MMMM d, yyyy")
                      : "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Number of Occupants
                  </dt>
                  <dd className="mt-1 text-sm">
                    {application.numberOfOccupants}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Pets
                  </dt>
                  <dd className="mt-1 text-sm">
                    {application.hasPets
                      ? application.petDescription || "Yes"
                      : "No"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Desired Move-in Date
                  </dt>
                  <dd className="mt-1 text-sm">
                    {format(new Date(application.moveInDate), "MMMM d, yyyy")}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Property */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Property Applied For</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{application.property.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {application.property.addressLine1},{" "}
                    {application.property.city}, {application.property.state}{" "}
                    {application.property.zipCode}
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    ${Number(application.property.price).toLocaleString()}/mo
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/admin/listings/${application.property.id}/edit`}
                  >
                    View Listing
                    <ExternalLink className="ml-1 size-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Address</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-muted-foreground">
                    Address
                  </dt>
                  <dd className="mt-1 text-sm">
                    {application.currentAddress}, {application.currentCity},{" "}
                    {application.currentState} {application.currentZip}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Current Monthly Rent
                  </dt>
                  <dd className="mt-1 text-sm">
                    {application.monthlyRent
                      ? `$${Number(application.monthlyRent).toLocaleString()}`
                      : "Not provided"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Employment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Employer
                  </dt>
                  <dd className="mt-1 text-sm">
                    {application.employer || "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Job Title
                  </dt>
                  <dd className="mt-1 text-sm">
                    {application.jobTitle || "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Monthly Income
                  </dt>
                  <dd className="mt-1 text-sm">
                    {application.monthlyIncome
                      ? `$${Number(application.monthlyIncome).toLocaleString()}`
                      : "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Employment Length
                  </dt>
                  <dd className="mt-1 text-sm">
                    {application.employmentLength || "Not provided"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* References */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">References</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Landlord Name
                  </dt>
                  <dd className="mt-1 text-sm">
                    {application.landlordName || "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Landlord Phone
                  </dt>
                  <dd className="mt-1 text-sm">
                    {application.landlordPhone || "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Emergency Contact Name
                  </dt>
                  <dd className="mt-1 text-sm">
                    {application.emergencyName || "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Emergency Contact Phone
                  </dt>
                  <dd className="mt-1 text-sm">
                    {application.emergencyPhone || "Not provided"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {application.documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <FileText className="size-5 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    No documents uploaded
                  </p>
                </div>
              ) : (
                <ul className="divide-y">
                  {application.documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded bg-muted">
                          <FileText className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{doc.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.fileType} &middot;{" "}
                            {(doc.fileSize / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button asChild variant="ghost" size="sm">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="size-4" />
                          View
                        </a>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Additional Notes from Applicant */}
          {application.additionalNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Additional Notes from Applicant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {application.additionalNotes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Consent */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Consent</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Background Check Consent
                  </dt>
                  <dd className="mt-1 text-sm">
                    {application.consentBackground ? "Yes" : "No"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Terms & Conditions Consent
                  </dt>
                  <dd className="mt-1 text-sm">
                    {application.consentTerms ? "Yes" : "No"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          <ApplicationReviewForm
            applicationId={application.id}
            currentStatus={application.status}
            currentNotes={application.adminNotes || ""}
            reviewedAt={
              application.reviewedAt
                ? format(
                    new Date(application.reviewedAt),
                    "MMM d, yyyy 'at' h:mm a"
                  )
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}
