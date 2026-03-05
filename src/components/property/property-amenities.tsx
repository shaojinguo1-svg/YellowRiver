import { CircleCheck } from "lucide-react";

interface PropertyAmenitiesProps {
  amenities: string[];
}

export function PropertyAmenities({ amenities }: PropertyAmenitiesProps) {
  if (amenities.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {amenities.map((amenity) => (
        <div
          key={amenity}
          className="flex items-center gap-2 text-sm text-foreground"
        >
          <CircleCheck className="size-4 shrink-0 text-amber-500" />
          <span>{amenity}</span>
        </div>
      ))}
    </div>
  );
}
