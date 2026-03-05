import Link from "next/link";
import { Shield, Award, HeartHandshake, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | YellowRiver",
  description:
    "Learn about YellowRiver — our mission to simplify apartment rentals and connect quality properties with quality tenants.",
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
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              About <span className="text-amber-500">YellowRiver</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              We are a real estate company dedicated to making the rental
              experience simple, transparent, and enjoyable for everyone.
            </p>
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Our Story
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>
                YellowRiver was founded with a clear purpose: to simplify
                apartment rentals and bridge the gap between quality properties
                and quality tenants. We saw an industry weighed down by
                complicated processes, hidden fees, and poor communication, and
                we set out to change that.
              </p>
              <p>
                From our first listing to the hundreds of properties we manage
                today, our commitment has remained the same. We treat every
                property as if it were our own, and every tenant as a valued
                partner. By combining local market expertise with modern
                technology, we have streamlined the entire rental journey — from
                browsing listings to signing a lease.
              </p>
              <p>
                Whether you are searching for your next home or looking for
                reliable tenants, YellowRiver is here to make the process
                straightforward and stress-free.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Mission */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-700">
                Our Mission
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
                Simplifying Rentals for Everyone
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Our mission is to create a rental marketplace that puts people
                first. We strive to connect quality properties with quality
                tenants through a platform built on transparency, efficiency, and
                mutual respect. Every decision we make is guided by the goal of
                making renting as easy and rewarding as possible.
              </p>
            </div>

            {/* Vision */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-700">
                Our Vision
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
                The Future of Rental Living
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                We envision a world where finding the perfect rental home is as
                simple as a few clicks. By investing in technology, cultivating
                strong relationships, and maintaining the highest standards of
                service, we aim to be the most trusted name in residential
                rentals across the country.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Our Core Values
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              The principles that guide everything we do.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {CORE_VALUES.map((value) => (
              <div
                key={value.title}
                className="flex flex-col items-center rounded-xl border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex size-14 items-center justify-center rounded-full bg-amber-50">
                  <value.icon className="size-7 text-amber-500" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Our Team
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              Our dedicated team of real estate professionals brings decades of
              combined experience in property management, tenant relations, and
              local market analysis. Every member of the YellowRiver team shares
              a passion for helping people find the right place to call home. We
              are here to guide you through every step of the rental process with
              expertise and care.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-slate-900 px-6 py-16 text-center sm:px-12">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Ready to Find Your Next Home?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-slate-300">
              Browse our curated collection of rental properties and find the
              perfect place that fits your lifestyle and budget.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 bg-amber-500 text-white hover:bg-amber-600"
            >
              <Link href="/listings">Browse Our Listings</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
