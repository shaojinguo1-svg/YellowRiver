import Link from "next/link";
import { Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminListingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Manage Listings</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage property listings
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/listings/new">
            <Plus className="size-4" />
            Add New Listing
          </Link>
        </Button>
      </div>

      {/* Listings Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                      <Building2 className="size-7 text-muted-foreground" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-muted-foreground">
                      No listings yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Create your first listing to get started.
                    </p>
                    <Button asChild size="sm" className="mt-4">
                      <Link href="/admin/listings/new">
                        <Plus className="size-4" />
                        Create First Listing
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
