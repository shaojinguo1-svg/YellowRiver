import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import { DEMO_PROPERTY_DETAILS } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href={`/listings/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-amber-600"
          >
            <ArrowLeft className="size-4" />
            Back to Listing
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <Card className="text-center">
          <CardContent className="space-y-6 p-8 sm:p-12">
            {/* Icon */}
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-50">
              <Mail className="size-8 text-amber-500" />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Apply for {property.title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {property.addressLine1}, {property.city}, {property.state}
              </p>
            </div>

            {/* Message */}
            <p className="mx-auto max-w-md leading-relaxed text-muted-foreground">
              Online application coming soon. Please contact us for more
              information about applying for this property.
            </p>

            {/* Actions */}
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                asChild
                className="bg-amber-500 text-white hover:bg-amber-600"
                size="lg"
              >
                <Link href="/contact">Contact Us</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={`/listings/${slug}`}>Back to Listing</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
