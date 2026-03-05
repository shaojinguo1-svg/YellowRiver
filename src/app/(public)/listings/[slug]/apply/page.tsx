import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DEMO_PROPERTY_DETAILS } from "@/lib/demo-data";
import { ApplicationForm } from "@/components/application/application-form";
import type { Metadata } from "next";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = DEMO_PROPERTY_DETAILS[slug];

  if (!property) {
    return { title: "Property Not Found | YellowRiver" };
  }

  return {
    title: `Apply for ${property.title} | YellowRiver`,
    description: `Submit your rental application for ${property.title}.`,
  };
}

export default async function ApplyPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const property = DEMO_PROPERTY_DETAILS[slug];

  if (!property) {
    notFound();
  }

  return (
    <div>
      {/* Back Link */}
      <div className="border-b">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href={`/listings/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-amber-600"
          >
            <ArrowLeft className="size-4" />
            Back to Listing
          </Link>
        </div>
      </div>

      {/* Page Header */}
      <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Apply for {property.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {property.addressLine1}, {property.city}, {property.state} &mdash;
            ${property.price.toLocaleString()}/mo
          </p>
        </div>
      </div>

      {/* Application Form */}
      <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
        <ApplicationForm
          propertySlug={slug}
          propertyTitle={property.title}
        />
      </div>
    </div>
  );
}
