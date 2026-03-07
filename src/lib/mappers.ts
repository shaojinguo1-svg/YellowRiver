/**
 * Data mapping utilities — convert raw Prisma models to component-ready shapes.
 * Eliminates the duplicate `.map((p) => ({ id, slug, price: Number(p.price), ... }))` 
 * pattern that was repeated in page.tsx and listings/page.tsx.
 */

import type { Property, PropertyImage } from "@/generated/prisma/client";

/** Minimal property shape needed by PropertyCard */
export interface PropertyCardData {
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
  availableFrom: string;
  primaryImage?: { url: string; alt: string };
}

type PropertyWithPrimaryImage = Property & {
  images: Pick<PropertyImage, "url" | "alt">[];
};

/** Map a Prisma property record (with images) to a PropertyCardData object. */
export function toPropertyCardData(p: PropertyWithPrimaryImage): PropertyCardData {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    price: Number(p.price),
    bedrooms: p.bedrooms,
    bathrooms: Number(p.bathrooms),
    squareFeet: p.squareFeet ?? 0,
    city: p.city,
    state: p.state,
    propertyType: p.propertyType,
    availableFrom: p.availableFrom.toISOString(),
    primaryImage: p.images[0]
      ? { url: p.images[0].url, alt: p.images[0].alt || p.title }
      : undefined,
  };
}
