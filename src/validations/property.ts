import { z } from "zod";

export const propertyCreateSchema = z.object({
  // Basic Info
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description must be at most 5000 characters"),
  propertyType: z.enum(["APARTMENT", "HOUSE", "CONDO", "TOWNHOUSE", "STUDIO"], {
    message: "Please select a property type",
  }),
  listingType: z.enum(["RENT", "SALE"]).default("RENT"),
  status: z.enum(["DRAFT", "ACTIVE"]).default("DRAFT"),

  // Pricing
  price: z
    .number({ message: "Price is required" })
    .positive("Price must be positive")
    .max(100000, "Price must be at most $100,000"),
  securityDeposit: z
    .number()
    .positive("Security deposit must be positive")
    .optional()
    .or(z.literal(0)),
  applicationFee: z
    .number()
    .positive("Application fee must be positive")
    .optional()
    .or(z.literal(0)),

  // Location
  addressLine1: z
    .string()
    .min(5, "Address must be at least 5 characters"),
  addressLine2: z.string().optional().or(z.literal("")),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().length(2, "State must be a 2-letter abbreviation"),
  zipCode: z
    .string()
    .regex(/^\d{5}$/, "Zip code must be 5 digits"),

  // Details
  bedrooms: z
    .number({ message: "Bedrooms is required" })
    .int("Bedrooms must be a whole number")
    .min(0, "Bedrooms must be at least 0")
    .max(20, "Bedrooms must be at most 20"),
  bathrooms: z
    .number({ message: "Bathrooms is required" })
    .min(0.5, "Bathrooms must be at least 0.5")
    .max(20, "Bathrooms must be at most 20"),
  squareFeet: z
    .number()
    .int("Square feet must be a whole number")
    .positive("Square feet must be positive")
    .optional(),
  yearBuilt: z
    .number()
    .int("Year must be a whole number")
    .min(1800, "Year built must be after 1800")
    .max(new Date().getFullYear(), `Year built must be at most ${new Date().getFullYear()}`)
    .optional(),
  floor: z.number().int("Floor must be a whole number").optional(),
  totalFloors: z.number().int("Total floors must be a whole number").optional(),
  parkingSpaces: z
    .number()
    .int("Parking spaces must be a whole number")
    .min(0, "Parking spaces must be at least 0")
    .default(0),
  petPolicy: z.string().optional().or(z.literal("")),

  // Lease
  leaseTermType: z
    .enum(["MONTH_TO_MONTH", "SIX_MONTHS", "ONE_YEAR", "TWO_YEARS"])
    .optional(),
  availableFrom: z.coerce.date({ message: "Available from date is required" }),

  // SEO & Display
  metaTitle: z
    .string()
    .max(60, "Meta title must be at most 60 characters")
    .optional()
    .or(z.literal("")),
  metaDescription: z
    .string()
    .max(160, "Meta description must be at most 160 characters")
    .optional()
    .or(z.literal("")),
  featured: z.boolean().default(false),

  // Relations
  categoryId: z.string().uuid("Invalid category ID").optional().or(z.literal("")),
  amenityIds: z.array(z.string().uuid("Invalid amenity ID")).default([]),
});

export const propertyUpdateSchema = propertyCreateSchema.partial();

export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
export type PropertyCreateFormInput = z.input<typeof propertyCreateSchema>;
export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>;
