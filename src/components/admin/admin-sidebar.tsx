"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ADMIN_NAV_LINKS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Building2,
  FileText,
  MessageSquare,
  Settings,
};

interface AdminSidebarProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex h-full flex-col bg-charcoal text-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-6">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2.5"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-gold">
            <Building2 className="size-4 text-white" />
          </div>
          <span className="font-display text-lg tracking-tight">
            <span className="text-white">Yellow</span>
            <span className="text-gold">River</span>
          </span>
        </Link>
      </div>

      <Separator className="bg-charcoal-light" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-warm-500">
          Menu
        </p>
        {ADMIN_NAV_LINKS.map((link) => {
          const Icon = iconMap[link.icon];
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + "/");

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gold/10 text-gold"
                  : "text-warm-300 hover:bg-charcoal-light hover:text-white"
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "size-5",
                    isActive ? "text-gold" : "text-warm-500"
                  )}
                />
              )}
              {link.label}
              {isActive && (
                <span className="ml-auto size-1.5 rounded-full bg-gold" />
              )}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-charcoal-light" />

      {/* User Info */}
      <div className="p-4">
        <div className="flex items-center gap-3 rounded-lg bg-charcoal-light/50 px-3 py-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold/20 text-sm font-semibold text-gold">
            {user.firstName?.[0]}
            {user.lastName?.[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-warm-500">{user.email}</p>
          </div>
          <Badge className="shrink-0 bg-gold/20 text-gold hover:bg-gold/30 border-0 text-[10px]">
            {user.role}
          </Badge>
        </div>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="mt-2 w-full justify-start gap-2 text-warm-500 hover:bg-charcoal-light hover:text-gold"
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
