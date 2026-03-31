import type {
  Property,
  PropertyImage,
  Amenity,
  Category,
  RentalApplication,
  ApplicationDocument,
  User,
} from "@/generated/prisma/client";

export type PropertyWithRelations = Property & {
  images: PropertyImage[];
  amenities: { amenity: Amenity }[];
  category: Category | null;
  createdBy?: User;
};

export type PropertyCardData = Pick<
  Property,
  "id" | "slug" | "title" | "price" | "bedrooms" | "bathrooms" | "squareFeet" | "city" | "state" | "propertyType"
> & {
  primaryImage: PropertyImage | null;
};

export type ApplicationWithRelations = RentalApplication & {
  documents: ApplicationDocument[];
  property: Property & { images: PropertyImage[] };
  applicant: User | null;
};

export type SearchFilters = {
  city?: string;
  state?: string;
  propertyType?: string;
  listingType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  petFriendly?: boolean;
  amenities?: string[];
  sortBy?: "price_asc" | "price_desc" | "newest" | "sqft";
  page?: number;
};
