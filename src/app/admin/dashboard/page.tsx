import Link from "next/link";
import {
  Building2,
  FileText,
  Clock,
  MessageSquare,
  Plus,
  ArrowRight,
} from "lucide-react";
import { StatsCard } from "@/components/admin/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Active Listings"
          value="0"
          description="Published properties"
          icon={Building2}
          iconClassName="bg-gold/10 text-gold"
        />
        <StatsCard
          title="Applications This Month"
          value="0"
          description="Received this month"
          icon={FileText}
          iconClassName="bg-green-50 text-green-600"
        />
        <StatsCard
          title="Pending Applications"
          value="0"
          description="Awaiting review"
          icon={Clock}
          iconClassName="bg-blue-50 text-blue-600"
        />
        <StatsCard
          title="New Inquiries"
          value="0"
          description="Unread messages"
          icon={MessageSquare}
          iconClassName="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Applications */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="font-display text-base">Recent Applications</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/applications" className="gap-1 text-xs">
                View all
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <FileText className="size-6 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                No applications yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Applications will appear here when tenants apply for your
                listings.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Inquiries */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="font-display text-base">Recent Inquiries</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/inquiries" className="gap-1 text-xs">
                View all
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <MessageSquare className="size-6 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                No inquiries yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Contact form submissions will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-gold text-white hover:bg-gold-dark">
              <Link href="/admin/listings/new">
                <Plus className="size-4" />
                Add New Listing
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/applications">
                <FileText className="size-4" />
                Review Applications
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/inquiries">
                <MessageSquare className="size-4" />
                Check Inquiries
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
