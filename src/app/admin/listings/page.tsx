import Link from "next/link";
import Image from "next/image";
import { Plus, Building2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { PROPERTY_STATUSES, PROPERTY_TYPES } from "@/lib/constants";
import type { Property, PropertyImage } from "@/generated/prisma/client";

type PropertyWithImages = Property & {
  images: PropertyImage[];
};

export default async function AdminListingsPage() {
  let properties: PropertyWithImages[] = [];
  let fetchError = false;

  try {
    properties = await prisma.property.findMany({
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch {
    // DB may not be connected yet -- show empty state gracefully
    fetchError = true;
  }

  const getStatusBadge = (status: string) => {
    const config = PROPERTY_STATUSES.find((s) => s.value === status);
    return (
      <Badge variant="outline" className={config?.color}>
        {config?.label ?? status}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    return PROPERTY_TYPES.find((t) => t.value === type)?.label ?? type;
  };

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
              {properties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                        <Building2 className="size-7 text-muted-foreground" />
                      </div>
                      <p className="mt-4 text-sm font-medium text-muted-foreground">
                        {fetchError
                          ? "Unable to load listings"
                          : "No listings yet"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {fetchError
                          ? "Database connection may not be configured."
                          : "Create your first listing to get started."}
                      </p>
                      {!fetchError && (
                        <Button asChild size="sm" className="mt-4">
                          <Link href="/admin/listings/new">
                            <Plus className="size-4" />
                            Create First Listing
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      {property.images[0] ? (
                        <Image
                          src={property.images[0].url}
                          alt={property.images[0].alt ?? property.title}
                          width={48}
                          height={48}
                          className="size-12 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex size-12 items-center justify-center rounded-md bg-muted">
                          <Building2 className="size-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {property.title}
                    </TableCell>
                    <TableCell>{getStatusBadge(property.status)}</TableCell>
                    <TableCell>
                      ${Number(property.price).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {getTypeLabel(property.propertyType)}
                    </TableCell>
                    <TableCell>
                      {property.city}, {property.state}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/listings/${property.id}/edit`}>
                          <Pencil className="size-4" />
                          Edit
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
