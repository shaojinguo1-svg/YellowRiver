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
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSearch } from "@/components/property/hero-search";
import { PropertyCard } from "@/components/property/property-card";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import { prisma } from "@/lib/prisma";
import { toPropertyCardData } from "@/lib/mappers";

// ISR: revalidate every 5 minutes
export const revalidate = 300;

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
// Testimonials
// ---------------------------------------------------------------------------
const TESTIMONIALS = [
  {
    name: "Sarah M.",
    role: "Tenant since 2024",
    quote:
      "YellowRiver made the entire rental process incredibly smooth. From browsing listings to move-in day, every step was handled professionally. I love my new apartment!",
    rating: 5,
  },
  {
    name: "James L.",
    role: "Tenant since 2023",
    quote:
      "The maintenance team is outstanding. Any issue I've had was resolved within 24 hours. It's clear they genuinely care about their tenants' comfort.",
    rating: 5,
  },
  {
    name: "Emily R.",
    role: "Tenant since 2024",
    quote:
      "The online application was so easy, and I was approved within two days. The apartment is exactly as advertised — beautiful and well-maintained.",
    rating: 5,
  },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default async function HomePage() {
  // Fetch featured properties from the database
  let featuredProperties: import("@/lib/mappers").PropertyCardData[] = [];

  try {
    const properties = await prisma.property.findMany({
      where: { status: "ACTIVE" },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    featuredProperties = properties.map(toPropertyCardData);
  } catch {
    // DB may not be available — show page without featured properties
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* ----------------------------------------------------------------- */}
        {/* Hero Section                                                      */}
        {/* ----------------------------------------------------------------- */}
        <section className="relative overflow-hidden bg-charcoal py-20 sm:py-32 lg:py-48">
          {/* Mesh gradient overlay */}
          <div className="absolute inset-0 bg-mesh-dark" />

          {/* Animated gradient orbs */}
          <div className="absolute -top-40 -left-40 size-80 rounded-full bg-gold/[0.06] blur-3xl animate-pulse-slow" />
          <div className="absolute -bottom-40 -right-40 size-96 rounded-full bg-gold/[0.04] blur-3xl animate-pulse-slow delay-1000" />

          {/* Noise texture */}
          <div className="bg-noise absolute inset-0" />

          <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <p className="animate-fade-in text-xs font-medium uppercase tracking-[0.3em] text-gold">
              Premium Rental Living
            </p>

            <h1 className="animate-fade-in-up mt-6 font-display text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-7xl">
              Find Your Perfect
              <br />
              <span className="text-gradient-gold">Rental Home</span>
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
            <div className="animate-fade-in-up delay-300 rounded-2xl bg-white p-6 shadow-xl ring-1 ring-warm-200/50 sm:p-8 lg:p-12">
              <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
                {STATS.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold/10 sm:size-14">
                      <stat.icon className="size-5 text-gold sm:size-7" />
                    </div>
                    <p className="mt-3 font-display text-2xl font-bold text-warm-900 sm:mt-4 sm:text-4xl">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-xs text-warm-500 sm:mt-1 sm:text-sm">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Featured Properties Section                                       */}
        {/* ----------------------------------------------------------------- */}
        {featuredProperties.length > 0 && (
          <section className="py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <AnimateOnScroll>
                <div className="text-center">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
                    Featured Properties
                  </p>
                  <h2 className="mt-3 font-display text-3xl font-bold text-warm-900 sm:text-4xl">
                    Recently Listed Homes
                  </h2>
                  <div className="mx-auto mt-4 h-0.5 w-16 bg-gold" />
                  <p className="mx-auto mt-4 max-w-2xl text-lg text-warm-500">
                    Explore our newest additions — hand-picked properties ready
                    for move-in.
                  </p>
                </div>
              </AnimateOnScroll>

              <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {featuredProperties.map((property, i) => (
                  <AnimateOnScroll key={property.id} delay={i * 150}>
                    <PropertyCard {...property} />
                  </AnimateOnScroll>
                ))}
              </div>

              <AnimateOnScroll>
                <div className="mt-12 text-center">
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-gold/30 text-gold-dark hover:bg-gold/5"
                  >
                    <Link href="/listings">
                      View All Listings
                      <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </div>
              </AnimateOnScroll>
            </div>
          </section>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Why Choose Us Section                                             */}
        {/* ----------------------------------------------------------------- */}
        <section className="bg-ivory bg-mesh-light py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll>
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
            </AnimateOnScroll>

            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {ADVANTAGES.map((adv, i) => (
                <AnimateOnScroll key={adv.title} delay={i * 100}>
                  <div className="group rounded-xl border border-warm-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-gold/20">
                    <div className="flex size-12 items-center justify-center rounded-full bg-gold/10 transition-colors duration-300 group-hover:bg-gold/20">
                      <adv.icon className="size-6 text-gold" />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-semibold text-warm-900">
                      {adv.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-warm-500">
                      {adv.description}
                    </p>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Testimonials Section                                              */}
        {/* ----------------------------------------------------------------- */}
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll>
              <div className="text-center">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
                  Testimonials
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold text-warm-900 sm:text-4xl">
                  What Our Tenants Say
                </h2>
                <div className="mx-auto mt-4 h-0.5 w-16 bg-gold" />
              </div>
            </AnimateOnScroll>

            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
              {TESTIMONIALS.map((testimonial, i) => (
                <AnimateOnScroll key={testimonial.name} delay={i * 150}>
                  <div className="relative rounded-xl border border-warm-200 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    {/* Quote icon */}
                    <Quote className="absolute top-6 right-6 size-8 text-gold/10" />

                    {/* Stars */}
                    <div className="flex gap-0.5">
                      {Array.from({ length: testimonial.rating }).map(
                        (_, j) => (
                          <Star
                            key={j}
                            className="size-4 fill-gold text-gold"
                          />
                        )
                      )}
                    </div>

                    {/* Quote */}
                    <p className="mt-4 text-sm leading-relaxed text-warm-500 italic">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>

                    {/* Author */}
                    <div className="mt-6 flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-gold/10 font-display text-sm font-bold text-gold">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-warm-900">
                          {testimonial.name}
                        </p>
                        <p className="text-xs text-warm-500">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* How It Works Section                                              */}
        {/* ----------------------------------------------------------------- */}
        <section className="bg-ivory bg-mesh-light py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll>
              <div className="text-center">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
                  How It Works
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold text-warm-900 sm:text-4xl">
                  Renting Made Simple
                </h2>
                <div className="mx-auto mt-4 h-0.5 w-16 bg-gold" />
              </div>
            </AnimateOnScroll>

            <div className="mt-20 grid grid-cols-1 gap-16 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <AnimateOnScroll key={step.title} delay={index * 150}>
                  <div className="relative text-center">
                    {/* Large watermark step number */}
                    <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2">
                      <span className="font-display text-[5rem] font-bold leading-none text-gold/[0.07]">
                        {index + 1}
                      </span>
                    </div>

                    {/* Connector line */}
                    {index < STEPS.length - 1 && (
                      <div className="absolute top-8 left-[calc(50%+3rem)] hidden h-px w-[calc(100%-6rem)] bg-gradient-to-r from-gold/20 to-gold/5 md:block" />
                    )}

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
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* CTA Section                                                       */}
        {/* ----------------------------------------------------------------- */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gold via-gold-dark to-amber-800 py-24 sm:py-32">
          {/* Subtle pattern */}
          <div className="bg-noise absolute inset-0 opacity-30" />

          <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <AnimateOnScroll>
              <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
                Ready to Find Your New Home?
              </h2>
              <div className="mx-auto mt-4 h-0.5 w-16 bg-white/30" />
              <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
                Start browsing our listings today or get in touch with our team.
                We are here to help you every step of the way.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-gold-dark hover:bg-ivory font-semibold shadow-lg"
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
                  className="border-white/40 text-white hover:bg-white/10"
                >
                  <Link href="/contact">
                    <Phone className="mr-2 size-4" />
                    Contact Us
                  </Link>
                </Button>
              </div>
            </AnimateOnScroll>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
