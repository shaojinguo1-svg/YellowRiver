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
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Available <span className="text-amber-500">Listings</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Browse our current rental properties and find the perfect place to
            call home.
          </p>
        </div>
      </section>

      {/* Listings Grid */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
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
