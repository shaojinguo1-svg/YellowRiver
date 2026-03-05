"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "header-glass border-b border-warm-200/50 shadow-sm"
          : "bg-white/80 backdrop-blur-sm"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="text-warm-700 hover:text-warm-900 hover:bg-warm-200/50 md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-0.5">
          <span className="font-display text-xl tracking-wide text-warm-900">
            Yellow
          </span>
          <span className="font-display text-xl tracking-wide text-gold">
            River
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="link-underline text-sm font-medium uppercase tracking-wide text-warm-700 transition-colors hover:text-warm-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Sign In button */}
        <Button
          asChild
          className="hidden rounded-sm bg-gold text-white hover:bg-gold-dark md:inline-flex"
        >
          <Link href="/login">Sign In</Link>
        </Button>

        {/* Spacer for mobile to balance the layout */}
        <div className="w-9 md:hidden" />
      </div>

      {/* Mobile navigation */}
      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
    </header>
  );
}
