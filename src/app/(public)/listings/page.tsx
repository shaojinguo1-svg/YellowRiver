import { PropertyGrid } from "@/components/property/property-grid";
import { prisma } from "@/lib/prisma";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Available Listings | YellowRiver",
  description:
    "Browse current rental properties available through YellowRiver. Find apartments, houses, condos, and more.",
};

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const locationFilter = params.location || "";
  const bedroomFilter = params.bedrooms || "";
  const typeFilter = params.type || "";

  const where: Record<string, unknown> = { status: "ACTIVE" };

  if (locationFilter) {
    where.OR = [
      { city: { contains: locationFilter, mode: "insensitive" } },
      { state: { contains: locationFilter, mode: "insensitive" } },
      { zipCode: { contains: locationFilter } },
    ];
  }

  if (bedroomFilter && !isNaN(Number(bedroomFilter))) {
    const beds = Number(bedroomFilter);
    where.bedrooms = beds >= 4 ? { gte: 4 } : beds;
  }

  if (typeFilter) {
    where.propertyType = typeFilter;
  }

  const properties = await prisma.property.findMany({
    where,
    include: {
      images: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const propertyCards = properties.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    price: Number(p.price),
    bedrooms: p.bedrooms,
    bathrooms: Number(p.bathrooms),
    squareFeet: p.squareFeet ?? 0,
    city: p.city,
    state: p.state,
    propertyType: p.propertyType,
    primaryImage: p.images[0]
      ? { url: p.images[0].url, alt: p.images[0].alt || p.title }
      : undefined,
  }));

  const hasFilters = locationFilter || bedroomFilter || typeFilter;

  return (
    <div>
      {/* Hero */}
      <section className="bg-charcoal relative py-20 sm:py-28">
        <div className="bg-mesh-dark absolute inset-0" />
        <div className="bg-noise absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gold font-medium mb-4">
            Browse Properties
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Available Listings
          </h1>
          <div className="mx-auto mt-4 w-16 h-0.5 bg-gold" />
          <p className="mt-6 text-lg text-warm-300 max-w-2xl mx-auto">
            Browse our current rental properties and find the perfect place to
            call home.
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="border-b border-warm-200 bg-white sticky top-16 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <form method="GET" className="flex flex-col gap-3 py-4 sm:flex-row sm:flex-wrap sm:items-center">
            <input
              type="text"
              name="location"
              placeholder="City or ZIP"
              defaultValue={locationFilter}
              className="w-full rounded-lg border border-warm-200 bg-ivory px-4 py-2.5 text-sm text-warm-900 placeholder:text-warm-500 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50 sm:w-48"
            />
            <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-3">
              <select
                name="bedrooms"
                defaultValue={bedroomFilter}
                className="w-full rounded-lg border border-warm-200 bg-ivory px-4 py-2.5 text-sm text-warm-900 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50 sm:w-auto"
              >
                <option value="">Bedrooms</option>
                <option value="1">1 Bed</option>
                <option value="2">2 Beds</option>
                <option value="3">3 Beds</option>
                <option value="4">4+ Beds</option>
              </select>
              <select
                name="type"
                defaultValue={typeFilter}
                className="w-full rounded-lg border border-warm-200 bg-ivory px-4 py-2.5 text-sm text-warm-900 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50 sm:w-auto"
              >
                <option value="">All Types</option>
                <option value="APARTMENT">Apartment</option>
                <option value="HOUSE">House</option>
                <option value="CONDO">Condo</option>
                <option value="TOWNHOUSE">Townhouse</option>
                <option value="STUDIO">Studio</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold-dark sm:flex-none"
              >
                Filter
              </button>
              {hasFilters && (
                <a
                  href="/listings"
                  className="text-sm text-warm-500 hover:text-gold transition-colors"
                >
                  Clear
                </a>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* Listings Grid */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <p className="text-sm text-warm-500">
              Showing{" "}
              <span className="font-medium text-warm-900">
                {propertyCards.length}
              </span>{" "}
              {propertyCards.length === 1 ? "property" : "properties"}
              {hasFilters && (
                <span className="text-warm-500"> matching your filters</span>
              )}
            </p>
          </div>

          <AnimateOnScroll>
            <PropertyGrid properties={propertyCards} />
          </AnimateOnScroll>
        </div>
      </section>
    </div>
  );
}
