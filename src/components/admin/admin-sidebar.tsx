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
    <div className="flex h-full flex-col bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-6">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2.5 font-semibold tracking-tight"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500">
            <Building2 className="size-4 text-white" />
          </div>
          <span className="text-lg">YellowRiver</span>
        </Link>
      </div>

      <Separator className="bg-slate-700/50" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
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
                  ? "bg-amber-500/10 text-amber-400"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "size-5",
                    isActive ? "text-amber-400" : "text-slate-400"
                  )}
                />
              )}
              {link.label}
              {isActive && (
                <span className="ml-auto size-1.5 rounded-full bg-amber-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-slate-700/50" />

      {/* User Info */}
      <div className="p-4">
        <div className="flex items-center gap-3 rounded-lg bg-slate-800/50 px-3 py-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm font-semibold text-amber-400">
            {user.firstName?.[0]}
            {user.lastName?.[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
          <Badge className="shrink-0 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-0 text-[10px]">
            {user.role}
          </Badge>
        </div>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="mt-2 w-full justify-start gap-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
