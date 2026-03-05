"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, Menu } from "lucide-react";
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
        "sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-sm transition-shadow duration-200",
        scrolled && "header-scrolled"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Building2 className="size-6 text-amber-500" />
          <span className="text-xl font-bold tracking-tight">
            Yellow<span className="text-amber-500">River</span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:text-amber-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Sign In button */}
        <Button
          asChild
          className="hidden bg-amber-500 text-white hover:bg-amber-600 md:inline-flex"
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
