import Image from "next/image";
import Link from "next/link";
import { BedDouble, Bath, Maximize, MapPin } from "lucide-react";

export interface PropertyCardProps {
  id: string;
  slug: string;
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  city: string;
  state: string;
  propertyType: string;
  primaryImage?: {
    url: string;
    alt: string;
  };
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function PropertyCard({
  slug,
  title,
  price,
  bedrooms,
  bathrooms,
  squareFeet,
  city,
  state,
  propertyType,
  primaryImage,
}: PropertyCardProps) {
  return (
    <Link href={`/listings/${slug}`} className="group block">
      <div className="card-luxury overflow-hidden rounded-xl border border-warm-200 bg-white">
        {/* Image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-ivory">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-ivory-warm text-warm-300">
              <svg
                className="size-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
                />
              </svg>
            </div>
          )}
          {/* Property type badge */}
          <span className="absolute top-3 left-3 rounded-md bg-charcoal/90 px-2.5 py-1 text-xs font-medium tracking-wide uppercase text-white">
            {propertyType}
          </span>
        </div>

        {/* Content */}
        <div className="space-y-3 p-4">
          {/* Price */}
          <div className="flex items-baseline justify-between">
            <p className="font-display text-xl font-bold text-gold-dark">
              {formatPrice(price)}
              <span className="font-sans text-sm font-normal text-warm-500">
                /mo
              </span>
            </p>
          </div>

          {/* Title */}
          <h3 className="font-display line-clamp-1 text-base font-semibold text-warm-900 transition-colors group-hover:text-gold">
            {title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-warm-500">
            <MapPin className="size-3.5 shrink-0 text-gold/60" />
            <span className="line-clamp-1">
              {city}, {state}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 border-t border-warm-200 pt-3 text-sm text-warm-500">
            <div className="flex items-center gap-1.5">
              <BedDouble className="size-4 text-gold/70" />
              <span>
                {bedrooms} {bedrooms === 1 ? "Bed" : "Beds"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath className="size-4 text-gold/70" />
              <span>
                {bathrooms} {bathrooms === 1 ? "Bath" : "Baths"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Maximize className="size-4 text-gold/70" />
              <span>{squareFeet.toLocaleString()} sqft</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
