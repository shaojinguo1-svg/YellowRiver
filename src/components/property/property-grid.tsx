import { Home } from "lucide-react";
import { PropertyCard, type PropertyCardProps } from "./property-card";

interface PropertyGridProps {
  properties: PropertyCardProps[];
  emptyMessage?: string;
}

export function PropertyGrid({
  properties,
  emptyMessage = "No properties found matching your criteria.",
}: PropertyGridProps) {
  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-warm-200 bg-ivory/30 px-6 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-ivory-warm">
          <Home className="size-8 text-warm-300" />
        </div>
        <h3 className="mt-4 font-display text-lg font-semibold text-warm-900">
          No properties available
        </h3>
        <p className="mt-2 max-w-sm text-sm text-warm-500">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <PropertyCard key={property.id} {...property} />
      ))}
    </div>
  );
}
