import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, PawPrint, Mail } from "lucide-react";
import { DEMO_PROPERTY_DETAILS } from "@/lib/demo-data";
import { PropertyGallery } from "@/components/property/property-gallery";
import { PropertyDetails } from "@/components/property/property-details";
import { PropertyAmenities } from "@/components/property/property-amenities";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

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
    title: `${property.title} | YellowRiver`,
    description: property.description.slice(0, 160),
  };
}

export default async function ListingDetailPage({
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
      <div className="border-b border-warm-200">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/listings"
            className="inline-flex items-center gap-1.5 text-sm text-warm-500 transition-colors hover:text-gold"
          >
            <ArrowLeft className="size-4" />
            Back to Listings
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Image Gallery */}
        <section className="mb-8">
          <PropertyGallery images={property.images} />
        </section>

        {/* Two-Column Layout */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Details */}
          <div className="space-y-8 lg:col-span-2">
            {/* Title & Location */}
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge className="bg-charcoal text-white hover:bg-charcoal-light">
                  {property.propertyType}
                </Badge>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-warm-900">
                {property.title}
              </h1>
              <div className="mt-2 flex items-center gap-1.5 text-warm-500">
                <MapPin className="size-4 shrink-0 text-gold" />
                <span>
                  {property.addressLine1}, {property.city}, {property.state}
                </span>
              </div>
            </div>

            <Separator className="bg-warm-200" />

            {/* Description */}
            <div>
              <h2 className="font-display text-lg font-semibold text-warm-900 mb-3">
                About This Property
              </h2>
              <p className="leading-relaxed text-warm-500">
                {property.description}
              </p>
            </div>

            <Separator className="bg-warm-200" />

            {/* Property Details Grid */}
            <div>
              <h2 className="font-display text-lg font-semibold text-warm-900 mb-4">
                Property Details
              </h2>
              <PropertyDetails
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                squareFeet={property.squareFeet}
                propertyType={property.propertyType}
                floor={property.floor}
                totalFloors={property.totalFloors}
                yearBuilt={property.yearBuilt}
                parkingSpaces={property.parkingSpaces}
                leaseTermType={property.leaseTermType}
              />
            </div>

            <Separator className="bg-warm-200" />

            {/* Amenities */}
            <div>
              <h2 className="font-display text-lg font-semibold text-warm-900 mb-4">
                Amenities
              </h2>
              <PropertyAmenities amenities={property.amenities} />
            </div>

            <Separator className="bg-warm-200" />

            {/* Pet Policy */}
            <div>
              <h2 className="font-display text-lg font-semibold text-warm-900 mb-3">
                Pet Policy
              </h2>
              <div className="flex items-start gap-3 rounded-lg border border-warm-200 bg-ivory p-4">
                <PawPrint className="mt-0.5 size-5 shrink-0 text-gold" />
                <p className="text-sm leading-relaxed text-warm-500">
                  {property.petPolicy}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Price Card */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <Card className="gap-0 overflow-hidden p-0 border-warm-200">
                {/* Price Header */}
                <CardHeader className="bg-charcoal px-6 py-5 text-white">
                  <CardTitle className="flex items-baseline gap-1">
                    <span className="font-display text-3xl font-bold text-gold-light">
                      {formatPrice(property.price)}
                    </span>
                    <span className="text-sm font-normal text-warm-300">
                      /month
                    </span>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-5 p-6">
                  {/* Pricing Details */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-warm-500">
                        Security Deposit
                      </span>
                      <span className="font-medium text-warm-900">
                        {formatPrice(property.securityDeposit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-warm-500">
                        Available From
                      </span>
                      <span className="font-medium text-warm-900">
                        {formatDate(property.availableFrom)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-warm-500">Lease Term</span>
                      <span className="font-medium text-warm-900">
                        {property.leaseTermType}
                      </span>
                    </div>
                  </div>

                  <Separator className="bg-warm-200" />

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      asChild
                      className="w-full bg-gold text-white hover:bg-gold-dark"
                      size="lg"
                    >
                      <Link href={`/listings/${slug}/apply`}>Apply Now</Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-warm-200 text-warm-700 hover:bg-ivory-warm"
                      size="lg"
                    >
                      Schedule Tour
                    </Button>
                  </div>

                  <Separator className="bg-warm-200" />

                  {/* Contact Link */}
                  <div className="text-center">
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-1.5 text-sm text-warm-500 transition-colors hover:text-gold"
                    >
                      <Mail className="size-4" />
                      Contact Us
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
