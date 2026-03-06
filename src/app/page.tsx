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
  Shield,
  Headphones,
  DollarSign,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSearch } from "@/components/property/hero-search";

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
// Why Choose Us advantages
// ---------------------------------------------------------------------------
const ADVANTAGES = [
  {
    icon: Shield,
    title: "Quality Properties",
    description:
      "Hand-selected, well-maintained rental homes in top neighborhoods. Every property meets our high standards for comfort and quality.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description:
      "Responsive maintenance and a dedicated property management team ready to help whenever you need us.",
  },
  {
    icon: DollarSign,
    title: "Transparent Pricing",
    description:
      "Clear pricing with no hidden fees or surprise charges. What you see is what you pay, every month.",
  },
  {
    icon: Zap,
    title: "Easy Application",
    description:
      "Simple online application with fast review and approval. Move into your new home in days, not weeks.",
  },
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
// Page component
// ---------------------------------------------------------------------------
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* ----------------------------------------------------------------- */}
        {/* Hero Section                                                      */}
        {/* ----------------------------------------------------------------- */}
        <section className="relative overflow-hidden bg-charcoal py-32 sm:py-40 lg:py-48">
          {/* Mesh gradient overlay */}
          <div className="absolute inset-0 bg-mesh-dark" />

          {/* Noise texture */}
          <div className="bg-noise absolute inset-0" />

          <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="animate-fade-in-up font-display text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Find Your Perfect
              <br />
              Rental Home
            </h1>

            {/* Gold separator */}
            <div className="animate-fade-in-up delay-100 mx-auto mt-8">
              <div className="mx-auto h-0.5 w-16 bg-gold" />
            </div>

            <p className="animate-fade-in-up delay-200 mx-auto mt-6 max-w-xl text-lg text-warm-300 sm:text-xl">
              Discover our collection of premium apartments and rental homes,
              professionally managed for your comfort.
            </p>

            {/* Search bar */}
            <div className="animate-fade-in-up delay-400 mt-12">
              <HeroSearch />
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Stats Section (floating card, pulled up)                          */}
        {/* ----------------------------------------------------------------- */}
        <section className="relative -mt-16 z-10">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="animate-fade-in-up delay-300 rounded-2xl bg-white p-8 shadow-xl sm:p-12">
              <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                {STATS.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-gold/10">
                      <stat.icon className="size-7 text-gold" />
                    </div>
                    <p className="mt-4 font-display text-3xl font-bold text-warm-900 sm:text-4xl">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-sm text-warm-500">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Why Choose Us Section                                             */}
        {/* ----------------------------------------------------------------- */}
        <section className="bg-ivory bg-mesh-light py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
                Why Choose Us
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold text-warm-900 sm:text-4xl">
                Professional Property Management
              </h2>
              <div className="mx-auto mt-4 h-0.5 w-16 bg-gold mb-6" />
              <p className="mx-auto max-w-2xl text-lg text-warm-500">
                We take pride in providing exceptional rental experiences with
                properties you can truly call home.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {ADVANTAGES.map((adv) => (
                <div
                  key={adv.title}
                  className="rounded-xl border border-warm-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-gold/10">
                    <adv.icon className="size-6 text-gold" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-warm-900">
                    {adv.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-warm-500">
                    {adv.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Button
                asChild
                size="lg"
                className="bg-gold text-white hover:bg-gold-dark"
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
        {/* How It Works Section                                              */}
        {/* ----------------------------------------------------------------- */}
        <section className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
                How It Works
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold text-warm-900 sm:text-4xl">
                Renting Made Simple
              </h2>
              <div className="mx-auto mt-4 h-0.5 w-16 bg-gold" />
            </div>

            <div className="mt-20 grid grid-cols-1 gap-16 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <div key={step.title} className="relative text-center">
                  {/* Large watermark step number */}
                  <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2">
                    <span className="font-display text-[5rem] font-bold leading-none text-gold/[0.07]">
                      {index + 1}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="relative mx-auto flex size-16 items-center justify-center rounded-2xl bg-gold/10">
                    <step.icon className="size-8 text-gold" />
                  </div>

                  <h3 className="mt-6 font-display text-lg font-semibold text-warm-900">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-warm-500">
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
        <section className="relative bg-charcoal py-24 sm:py-32">
          {/* Noise texture */}
          <div className="bg-noise absolute inset-0" />

          <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Ready to Find Your New Home?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-warm-300">
              Start browsing our listings today or get in touch with our team.
              We are here to help you every step of the way.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-gold text-white hover:bg-gold-dark"
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
                className="border-gold/30 text-gold hover:bg-gold/10"
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
