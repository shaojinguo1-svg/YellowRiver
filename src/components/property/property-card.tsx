import Image from "next/image";
import Link from "next/link";
import { BedDouble, Bath, Maximize, MapPin, ArrowRight, CalendarDays } from "lucide-react";
import { formatPrice, formatAvailableDate } from "@/lib/format";

// Lightweight base64 grey placeholder — avoids blank flash on image load (P2 #8)
const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAI8wNPvd7POQAAAABJRU5ErkJggg==";

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
  availableFrom?: string;
  primaryImage?: {
    url: string;
    alt: string;
  };
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
  availableFrom,
  primaryImage,
}: PropertyCardProps) {
  const availableText = formatAvailableDate(availableFrom);
  return (
    <Link href={`/listings/${slug}`} className="group block">
      <div className="card-luxury overflow-hidden rounded-xl border border-warm-200 bg-white">
        {/* Image with hover overlay */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-ivory">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
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

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* View details prompt on hover */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 transition-all duration-500 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0">
            <span className="text-sm font-medium text-white">View Details</span>
            <div className="flex size-8 items-center justify-center rounded-full bg-gold text-white">
              <ArrowRight className="size-4" />
            </div>
          </div>

          {/* Property type badge */}
          <span className="absolute top-3 left-3 rounded-md bg-charcoal/90 px-2.5 py-1 text-xs font-medium tracking-wide uppercase text-white backdrop-blur-sm">
            {propertyType}
          </span>

          {/* Price badge on image */}
          <div className="absolute top-3 right-3 rounded-md bg-white/95 px-3 py-1.5 backdrop-blur-sm shadow-sm">
            <p className="font-display text-sm font-bold text-gold-dark">
              {formatPrice(price)}
              <span className="font-sans text-[10px] font-normal text-warm-500">/mo</span>
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3 p-5">
          {/* Title */}
          <h3 className="font-display line-clamp-1 text-base font-semibold text-warm-900 transition-colors group-hover:text-gold">
            {title}
          </h3>

          {/* Location + Available */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-sm text-warm-500 min-w-0">
              <MapPin className="size-3.5 shrink-0 text-gold/60" />
              <span className="line-clamp-1">
                {city}, {state}
              </span>
            </div>
            {availableText && (
              <span className="shrink-0 flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <CalendarDays className="size-3" />
                {availableText}
              </span>
            )}
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
            {squareFeet > 0 && (
              <div className="flex items-center gap-1.5">
                <Maximize className="size-4 text-gold/70" />
                <span>{squareFeet.toLocaleString()} sqft</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
