"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
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
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>
            <Link
              href="/"
              className="flex items-center gap-2"
              onClick={() => onOpenChange(false)}
            >
              <Building2 className="size-6 text-amber-500" />
              <span className="text-xl font-bold tracking-tight">
                Yellow<span className="text-amber-500">River</span>
              </span>
            </Link>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Navigation menu
          </SheetDescription>
        </SheetHeader>
        <Separator />
        <nav className="flex flex-col gap-1 px-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => onOpenChange(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-amber-50 hover:text-amber-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Separator />
        <div className="px-4">
          <Button
            asChild
            className="w-full bg-amber-500 text-white hover:bg-amber-600"
          >
            <Link href="/login" onClick={() => onOpenChange(false)}>
              Sign In
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
