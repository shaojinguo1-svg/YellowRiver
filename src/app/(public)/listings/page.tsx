import { PropertyGrid } from "@/components/property/property-grid";
import { DEMO_PROPERTIES } from "@/lib/demo-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Available Listings | YellowRiver",
  description:
    "Browse current rental properties available through YellowRiver. Find apartments, houses, condos, and more.",
};

export default function ListingsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-charcoal relative py-20 sm:py-28">
        <div className="bg-mesh-dark absolute inset-0" />
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

      {/* Listings Grid */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <p className="text-sm text-warm-500">
              Showing{" "}
              <span className="font-medium text-warm-900">
                {DEMO_PROPERTIES.length}
              </span>{" "}
              properties
            </p>
          </div>

          <PropertyGrid properties={DEMO_PROPERTIES} />
        </div>
      </section>
    </div>
  );
}
