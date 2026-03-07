import { PropertyGrid } from "@/components/property/property-grid";
import { prisma } from "@/lib/prisma";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import { toPropertyCardData } from "@/lib/mappers";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Available Listings | YellowRiver",
  description:
    "Browse current rental properties available through YellowRiver. Find apartments, houses, condos, and more.",
};

// ISR: revalidate every 5 minutes — property data changes infrequently
export const revalidate = 300;

const PAGE_SIZE = 12;

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const locationFilter = params.location || "";
  const bedroomFilter = params.bedrooms || "";
  const typeFilter = params.type || "";
  const sortBy = params.sort || "newest";
  const currentPage = Math.max(1, Number(params.page) || 1);
  const skip = (currentPage - 1) * PAGE_SIZE;

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

  let orderBy: Record<string, string> = { createdAt: "desc" };
  if (sortBy === "price-asc") orderBy = { price: "asc" };
  else if (sortBy === "price-desc") orderBy = { price: "desc" };
  else if (sortBy === "oldest") orderBy = { createdAt: "asc" };

  // Fetch current page + total count in parallel
  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
      },
      orderBy,
      take: PAGE_SIZE,
      skip,
    }),
    prisma.property.count({ where }),
  ]);

  const propertyCards = properties.map(toPropertyCardData);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = locationFilter || bedroomFilter || typeFilter || sortBy !== "newest";

  /** Build URL for a given page, preserving existing filter params */
  function pageUrl(page: number): string {
    const qs = new URLSearchParams();
    if (locationFilter) qs.set("location", locationFilter);
    if (bedroomFilter) qs.set("bedrooms", bedroomFilter);
    if (typeFilter) qs.set("type", typeFilter);
    if (sortBy !== "newest") qs.set("sort", sortBy);
    if (page > 1) qs.set("page", String(page));
    const str = qs.toString();
    return `/listings${str ? `?${str}` : ""}`;
  }

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
            <select
              name="sort"
              defaultValue={sortBy}
              className="w-full rounded-lg border border-warm-200 bg-ivory px-4 py-2.5 text-sm text-warm-900 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50 sm:w-auto"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
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
              {total > 0 ? (
                <>
                  Showing{" "}
                  <span className="font-medium text-warm-900">
                    {skip + 1}–{Math.min(skip + PAGE_SIZE, total)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-warm-900">{total}</span>{" "}
                  {total === 1 ? "property" : "properties"}
                  {hasFilters && <span> matching your filters</span>}
                </>
              ) : (
                <>No properties found{hasFilters && " matching your filters"}</>
              )}
            </p>
          </div>

          <AnimateOnScroll>
            <PropertyGrid properties={propertyCards} />
          </AnimateOnScroll>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12">
              <Pagination>
                <PaginationContent>
                  {/* Previous */}
                  <PaginationItem>
                    <PaginationPrevious
                      href={currentPage > 1 ? pageUrl(currentPage - 1) : undefined}
                      aria-disabled={currentPage <= 1}
                      className={currentPage <= 1 ? "pointer-events-none opacity-40" : ""}
                    />
                  </PaginationItem>

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first, last, current ± 1, and ellipsis
                    const show =
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1;

                    const showEllipsisBefore =
                      page === currentPage - 2 && currentPage > 3;
                    const showEllipsisAfter =
                      page === currentPage + 2 && currentPage < totalPages - 2;

                    if (showEllipsisBefore || showEllipsisAfter) {
                      return (
                        <PaginationItem key={`ellipsis-${page}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    if (!show) return null;

                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href={pageUrl(page)}
                          isActive={page === currentPage}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  {/* Next */}
                  <PaginationItem>
                    <PaginationNext
                      href={currentPage < totalPages ? pageUrl(currentPage + 1) : undefined}
                      aria-disabled={currentPage >= totalPages}
                      className={currentPage >= totalPages ? "pointer-events-none opacity-40" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
