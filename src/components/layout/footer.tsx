import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { NAV_LINKS, APP_NAME } from "@/lib/constants";

const CONTACT_INFO = [
  {
    icon: Phone,
    label: "(626) 492-6480",
    href: "tel:+16264926480",
  },
  {
    icon: Mail,
    label: "info@yellowriver.com",
    href: "mailto:info@yellowriver.com",
  },
  {
    icon: MapPin,
    label: "301 E Colorado Blvd, Pasadena, CA 91101",
    href: "#",
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-gold/20 bg-charcoal text-warm-300">
      {/* Noise texture overlay */}
      <div className="bg-noise pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company info */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-0.5">
              <span className="font-display text-xl tracking-wide text-ivory">
                Yellow
              </span>
              <span className="font-display text-xl tracking-wide text-gold">
                River
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-warm-300">
              Premium apartment living, professionally managed. Explore our
              collection of quality rental homes across top neighborhoods.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-sm uppercase tracking-[0.2em] text-gold">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-warm-300 transition-colors hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/login"
                  className="text-sm text-warm-300 transition-colors hover:text-gold"
                >
                  Admin Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-display text-sm uppercase tracking-[0.2em] text-gold">
              Contact Us
            </h3>
            <ul className="mt-4 space-y-3">
              {CONTACT_INFO.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="flex items-start gap-3 text-sm text-warm-300 transition-colors hover:text-gold"
                  >
                    <item.icon className="mt-0.5 size-4 shrink-0" />
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Business Hours */}
          <div>
            <h3 className="font-display text-sm uppercase tracking-[0.2em] text-gold">
              Business Hours
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-warm-300">
              <li className="flex justify-between">
                <span>Monday - Friday</span>
                <span>9:00 AM - 6:00 PM</span>
              </li>
              <li className="flex justify-between">
                <span>Saturday</span>
                <span>10:00 AM - 4:00 PM</span>
              </li>
              <li className="flex justify-between">
                <span>Sunday</span>
                <span>Closed</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-charcoal-light" />

        {/* Copyright */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-warm-500" suppressHydrationWarning>
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-warm-500">
            <Link href="#" className="transition-colors hover:text-gold">
              Privacy Policy
            </Link>
            <Link href="#" className="transition-colors hover:text-gold">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
