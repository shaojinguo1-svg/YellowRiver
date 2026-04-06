"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NAV_LINKS } from "@/lib/constants";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoggedIn?: boolean;
}

export function MobileNav({ open, onOpenChange, isLoggedIn }: MobileNavProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 bg-ivory">
        <SheetHeader>
          <SheetTitle>
            <Link
              href="/"
              className="flex items-center gap-0.5"
              onClick={() => onOpenChange(false)}
            >
              <span className="font-display text-xl tracking-wide text-warm-900">
                Yellow
              </span>
              <span className="font-display text-xl tracking-wide text-gold">
                River
              </span>
            </Link>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Navigation menu
          </SheetDescription>
        </SheetHeader>
        <Separator className="bg-warm-200" />
        <nav className="flex flex-col gap-1 px-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => onOpenChange(false)}
              className="rounded-sm px-3 py-2 font-sans text-sm tracking-wide text-warm-700 transition-colors hover:bg-gold/5 hover:text-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Separator className="bg-warm-200" />
        <div className="px-4">
          <Button
            asChild
            className="w-full rounded-sm bg-gold text-white hover:bg-gold-dark"
          >
            <Link href={isLoggedIn ? "/dashboard" : "/login"} onClick={() => onOpenChange(false)}>
              {isLoggedIn ? "Dashboard" : "Sign In"}
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
