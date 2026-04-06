import Link from "next/link";
import { Shield, Award, HeartHandshake, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | YellowRiver",
  description:
    "Learn about YellowRiver — a premier property management company offering premium apartment rentals across top neighborhoods.",
};

const CORE_VALUES = [
  {
    icon: Shield,
    title: "Trust",
    description:
      "We build lasting relationships through honesty, transparency, and integrity in every interaction.",
  },
  {
    icon: Award,
    title: "Quality",
    description:
      "Every property in our portfolio meets rigorous standards for comfort, safety, and livability.",
  },
  {
    icon: HeartHandshake,
    title: "Service",
    description:
      "We go above and beyond to deliver a seamless rental experience from first inquiry to move-in day.",
  },
  {
    icon: Users,
    title: "Community",
    description:
      "We believe great neighborhoods start with great neighbors, and we work to foster vibrant communities.",
  },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-charcoal relative py-20 sm:py-28">
        <div className="bg-mesh-dark absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gold font-medium mb-4">
            Our Story
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
            About YellowRiver
          </h1>
          <div className="mx-auto mt-4 w-16 h-0.5 bg-gold" />
          <p className="mt-6 text-lg text-warm-300 max-w-2xl mx-auto">
            A premier property management company offering thoughtfully
            maintained rental homes in the best neighborhoods.
          </p>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-warm-900">
              Our Story
            </h2>
            <div className="mx-auto mt-4 w-12 h-0.5 bg-gold" />
            <div className="mt-8 space-y-5 text-base leading-[1.8] text-warm-500">
              <p>
                YellowRiver was founded with a clear purpose: to offer
                premium rental living with exceptional property management.
                We own and maintain every property in our portfolio, ensuring
                the highest standards of comfort and quality for our residents.
              </p>
              <p>
                From our first apartment to the growing collection of homes we
                manage today, our commitment has remained the same — every
                property is thoughtfully maintained, and every resident is
                treated like family. By combining hands-on management with
                modern technology, we have created a seamless rental experience
                from browsing our listings to move-in day.
              </p>
              <p>
                Whether you are looking for a cozy studio or a spacious
                family home, YellowRiver has a property that fits your
                lifestyle and budget.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-ivory py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Mission */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-4 py-1.5 text-sm font-medium text-gold-dark">
                Our Mission
              </div>
              <h2 className="font-display mt-4 text-2xl font-bold tracking-tight text-warm-900">
                Premium Living, Professionally Managed
              </h2>
              <p className="mt-4 text-base leading-relaxed text-warm-500">
                Our mission is to provide exceptional rental homes that our
                residents are proud to call home. We own, maintain, and manage
                every property in our portfolio with care, ensuring top-quality
                living spaces and responsive service. Every decision we make is
                guided by the comfort and satisfaction of our residents.
              </p>
            </div>

            {/* Vision */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-4 py-1.5 text-sm font-medium text-gold-dark">
                Our Vision
              </div>
              <h2 className="font-display mt-4 text-2xl font-bold tracking-tight text-warm-900">
                The Future of Rental Living
              </h2>
              <p className="mt-4 text-base leading-relaxed text-warm-500">
                We envision YellowRiver as the gold standard in residential
                rentals — where every property reflects our commitment to
                quality, every interaction is guided by care, and every
                resident enjoys a living experience they truly love.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-warm-900">
              Our Core Values
            </h2>
            <div className="mx-auto mt-4 w-12 h-0.5 bg-gold" />
            <p className="mt-4 text-base text-warm-500">
              The principles that guide everything we do.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {CORE_VALUES.map((value) => (
              <div
                key={value.title}
                className="card-luxury flex flex-col items-center rounded-xl border border-warm-200 bg-white p-6 text-center"
              >
                <div className="flex size-14 items-center justify-center rounded-full bg-gold/10">
                  <value.icon className="size-7 text-gold" />
                </div>
                <h3 className="font-display mt-4 text-lg font-semibold text-warm-900">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-500">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-charcoal px-6 py-16 text-center sm:px-12">
            <div className="bg-noise absolute inset-0" />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold tracking-tight text-white">
                Ready to Find Your Next Home?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-warm-300">
                Browse our curated collection of rental properties and find the
                perfect place that fits your lifestyle and budget.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-8 bg-gold text-white hover:bg-gold-dark"
              >
                <Link href="/listings">Browse Our Listings</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
