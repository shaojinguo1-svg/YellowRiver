import {
  BedDouble,
  Bath,
  Maximize,
  Building2,
  Layers,
  CalendarDays,
  Car,
  FileText,
} from "lucide-react";

interface PropertyDetailsProps {
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  propertyType: string;
  floor: number;
  totalFloors: number;
  yearBuilt: number;
  parkingSpaces: number;
  leaseTermType: string;
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Apartment",
  CONDO: "Condo",
  HOUSE: "House",
  STUDIO: "Studio",
  TOWNHOUSE: "Townhouse",
};

export function PropertyDetails({
  bedrooms,
  bathrooms,
  squareFeet,
  propertyType,
  floor,
  totalFloors,
  yearBuilt,
  parkingSpaces,
  leaseTermType,
}: PropertyDetailsProps) {
  const details = [
    {
      icon: BedDouble,
      label: "Bedrooms",
      value: bedrooms.toString(),
    },
    {
      icon: Bath,
      label: "Bathrooms",
      value: bathrooms.toString(),
    },
    {
      icon: Maximize,
      label: "Square Feet",
      value: squareFeet.toLocaleString(),
    },
    {
      icon: Building2,
      label: "Property Type",
      value: PROPERTY_TYPE_LABELS[propertyType] || propertyType,
    },
    {
      icon: Layers,
      label: "Floor",
      value: `${floor} of ${totalFloors}`,
    },
    {
      icon: CalendarDays,
      label: "Year Built",
      value: yearBuilt.toString(),
    },
    {
      icon: Car,
      label: "Parking",
      value: parkingSpaces === 0 ? "Street Only" : `${parkingSpaces} ${parkingSpaces === 1 ? "Space" : "Spaces"}`,
    },
    {
      icon: FileText,
      label: "Lease Term",
      value: leaseTermType,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {details.map((detail) => {
        const Icon = detail.icon;
        return (
          <div
            key={detail.label}
            className="flex flex-col gap-1.5 rounded-lg border bg-card p-3"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="size-4 shrink-0 text-amber-500" />
              <span className="text-xs font-medium">{detail.label}</span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {detail.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
