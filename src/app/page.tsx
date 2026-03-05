import Link from "next/link";
import {
  Building2,
  Users,
  MapPin,
  Star,
  Search,
  FileText,
  Home,
  ArrowRight,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PropertyGrid } from "@/components/property/property-grid";
import { HeroSearch } from "@/components/property/hero-search";
import type { PropertyCardProps } from "@/components/property/property-card";

// ---------------------------------------------------------------------------
// Demo data -- will be replaced with real DB queries once connected
// ---------------------------------------------------------------------------
const DEMO_PROPERTIES: PropertyCardProps[] = [
  {
    id: "1",
    slug: "modern-downtown-apartment",
    title: "Modern Downtown Apartment with City Views",
    price: 2450,
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1100,
    city: "Sacramento",
    state: "CA",
    propertyType: "Apartment",
    primaryImage: {
      url: "https://placehold.co/800x600/f59e0b/ffffff?text=Property+1",
      alt: "Modern downtown apartment",
    },
  },
  {
    id: "2",
    slug: "cozy-suburban-house",
    title: "Cozy Suburban House with Large Backyard",
    price: 3200,
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2400,
    city: "Elk Grove",
    state: "CA",
    propertyType: "House",
    primaryImage: {
      url: "https://placehold.co/800x600/d97706/ffffff?text=Property+2",
      alt: "Cozy suburban house",
    },
  },
  {
    id: "3",
    slug: "luxury-waterfront-condo",
    title: "Luxury Waterfront Condo in Riverview",
    price: 3800,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1800,
    city: "West Sacramento",
    state: "CA",
    propertyType: "Condo",
    primaryImage: {
      url: "https://placehold.co/800x600/b45309/ffffff?text=Property+3",
      alt: "Luxury waterfront condo",
    },
  },
  {
    id: "4",
    slug: "charming-midtown-studio",
    title: "Charming Midtown Studio Near Light Rail",
    price: 1450,
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 550,
    city: "Sacramento",
    state: "CA",
    propertyType: "Studio",
    primaryImage: {
      url: "https://placehold.co/800x600/92400e/ffffff?text=Property+4",
      alt: "Charming midtown studio",
    },
  },
  {
    id: "5",
    slug: "spacious-family-townhouse",
    title: "Spacious Family Townhouse with Garage",
    price: 2800,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1950,
    city: "Roseville",
    state: "CA",
    propertyType: "Townhouse",
    primaryImage: {
      url: "https://placehold.co/800x600/78350f/ffffff?text=Property+5",
      alt: "Spacious family townhouse",
    },
  },
  {
    id: "6",
    slug: "renovated-historic-flat",
    title: "Renovated Historic Flat in Old Town",
    price: 1950,
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 900,
    city: "Folsom",
    state: "CA",
    propertyType: "Apartment",
    primaryImage: {
      url: "https://placehold.co/800x600/451a03/ffffff?text=Property+6",
      alt: "Renovated historic flat",
    },
  },
];

// ---------------------------------------------------------------------------
// Stats data
// ---------------------------------------------------------------------------
const STATS = [
  { icon: Building2, value: "50+", label: "Properties" },
  { icon: Users, value: "200+", label: "Happy Tenants" },
  { icon: MapPin, value: "15+", label: "Cities" },
  { icon: Star, value: "5 Star", label: "Rating" },
];

// ---------------------------------------------------------------------------
// How it works steps
// ---------------------------------------------------------------------------
const STEPS = [
  {
    icon: Search,
    title: "Browse Listings",
    description:
      "Search our curated collection of rental properties by location, price, and amenities to find the perfect match.",
  },
  {
    icon: FileText,
    title: "Submit Application",
    description:
      "Found your ideal home? Complete a simple online application and our team will review it promptly.",
  },
  {
    icon: Home,
    title: "Move In",
    description:
      "Once approved, sign your lease and pick up your keys. Welcome to your new home!",
  },
];

// ---------------------------------------------------------------------------
// Page component (Server Component)
// ---------------------------------------------------------------------------
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* ----------------------------------------------------------------- */}
        {/* Hero Section                                                      */}
        {/* ----------------------------------------------------------------- */}
        <section className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 py-24 sm:py-32 lg:py-40">
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/20" />
            <div className="absolute -bottom-32 -left-32 size-[30rem] rounded-full bg-white/10" />
            <div className="absolute top-1/2 left-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Find Your Perfect
              <br />
              Rental Home
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-amber-100 sm:text-xl">
              Browse apartments, houses, and condos in your neighborhood.
              Quality rentals made simple and transparent.
            </p>

            {/* Search bar */}
            <div className="mt-10">
              <HeroSearch />
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Featured Listings Section                                         */}
        {/* ----------------------------------------------------------------- */}
        <section className="bg-white py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Featured Properties
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Explore our handpicked selection of premium rental properties
              </p>
            </div>

            <div className="mt-12">
              <PropertyGrid properties={DEMO_PROPERTIES} />
            </div>

            <div className="mt-12 text-center">
              <Button
                asChild
                size="lg"
                className="bg-amber-500 text-white hover:bg-amber-600"
              >
                <Link href="/listings">
                  View All Listings
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Stats Section                                                     */}
        {/* ----------------------------------------------------------------- */}
        <section className="border-y bg-amber-50/50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-100">
                    <stat.icon className="size-7 text-amber-600" />
                  </div>
                  <p className="mt-4 text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* How It Works Section                                              */}
        {/* ----------------------------------------------------------------- */}
        <section className="bg-white py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How It Works
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Renting your next home is as easy as 1-2-3
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <div key={step.title} className="relative text-center">
                  {/* Step number */}
                  <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-100">
                    <step.icon className="size-8 text-amber-600" />
                  </div>
                  <span className="absolute -top-2 left-1/2 ml-8 flex size-7 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-6 text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* CTA Section                                                       */}
        {/* ----------------------------------------------------------------- */}
        <section className="bg-gradient-to-r from-amber-500 to-amber-600 py-20">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Find Your New Home?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-amber-100">
              Start browsing our listings today or get in touch with our team.
              We are here to help you every step of the way.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-white text-amber-600 hover:bg-amber-50"
              >
                <Link href="/listings">
                  <Search className="mr-2 size-4" />
                  Browse Listings
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                <Link href="/contact">
                  <Phone className="mr-2 size-4" />
                  Contact Us
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
