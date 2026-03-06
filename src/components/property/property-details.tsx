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
  squareFeet: number | null;
  propertyType: string;
  floor?: number | null;
  totalFloors?: number | null;
  yearBuilt: number | null;
  parkingSpaces: number | null;
  leaseTermType: string;
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Apartment",
  CONDO: "Condo",
  HOUSE: "House",
  STUDIO: "Studio",
  TOWNHOUSE: "Townhouse",
};

const LEASE_TERM_LABELS: Record<string, string> = {
  MONTH_TO_MONTH: "Month to Month",
  SIX_MONTHS: "6 Months",
  ONE_YEAR: "12 Months",
  TWO_YEARS: "24 Months",
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
      value: squareFeet ? squareFeet.toLocaleString() : "—",
    },
    {
      icon: Building2,
      label: "Property Type",
      value: PROPERTY_TYPE_LABELS[propertyType] || propertyType,
    },
    ...(floor && totalFloors
      ? [{ icon: Layers, label: "Floor", value: `${floor} of ${totalFloors}` }]
      : []),
    {
      icon: CalendarDays,
      label: "Year Built",
      value: yearBuilt ? yearBuilt.toString() : "—",
    },
    {
      icon: Car,
      label: "Parking",
      value: !parkingSpaces ? "Street Only" : `${parkingSpaces} ${parkingSpaces === 1 ? "Space" : "Spaces"}`,
    },
    {
      icon: FileText,
      label: "Lease Term",
      value: LEASE_TERM_LABELS[leaseTermType] || leaseTermType,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {details.map((detail) => {
        const Icon = detail.icon;
        return (
          <div
            key={detail.label}
            className="flex flex-col gap-1.5 rounded-lg border border-warm-200 bg-ivory p-3"
          >
            <div className="flex items-center gap-2">
              <Icon className="size-4 shrink-0 text-gold" />
              <span className="text-xs text-warm-500">{detail.label}</span>
            </div>
            <p className="text-sm font-medium text-warm-900">
              {detail.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
