"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  LogOut,
  User,
  Building2,
  LayoutDashboard,
  FileText,
  MessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ADMIN_NAV_LINKS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Building2,
  FileText,
  MessageSquare,
  Settings,
};

interface AdminTopbarProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return "Dashboard";

  const lastSegment = segments[segments.length - 1];
  const titleMap: Record<string, string> = {
    dashboard: "Dashboard",
    listings: "Listings",
    applications: "Applications",
    inquiries: "Inquiries",
    settings: "Settings",
    new: "New",
    edit: "Edit",
  };

  return titleMap[lastSegment] || lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
}

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [];

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    breadcrumbs.push({
      label: segment.charAt(0).toUpperCase() + segment.slice(1),
      href: currentPath,
    });
  }

  return breadcrumbs;
}

export function AdminTopbar({ user }: AdminTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pageTitle = getPageTitle(pathname);
  const breadcrumbs = getBreadcrumbs(pathname);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b bg-white px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="size-5" />
          <span className="sr-only">Open sidebar</span>
        </Button>

        {/* Page Title & Breadcrumb */}
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
          <Breadcrumb className="hidden sm:block">
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <BreadcrumbItem key={crumb.href}>
                  {index < breadcrumbs.length - 1 ? (
                    <>
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href} className="text-xs">
                          {crumb.label}
                        </Link>
                      </BreadcrumbLink>
                      <BreadcrumbSeparator />
                    </>
                  ) : (
                    <BreadcrumbPage className="text-xs">
                      {crumb.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar size="sm">
                <AvatarFallback className="bg-amber-500/20 text-xs font-semibold text-amber-600">
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline-block">
                {user.firstName} {user.lastName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/settings">
                <Settings className="mr-2 size-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} variant="destructive">
              <LogOut className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 bg-slate-900 p-0 text-white">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle className="flex items-center gap-2.5 text-white">
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500">
                <Building2 className="size-4 text-white" />
              </div>
              <span className="text-lg">YellowRiver</span>
            </SheetTitle>
          </SheetHeader>

          <Separator className="bg-slate-700/50" />

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
                  onClick={() => setMobileMenuOpen(false)}
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
                </Link>
              );
            })}
          </nav>

          <Separator className="bg-slate-700/50" />

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
        </SheetContent>
      </Sheet>
    </>
  );
}
