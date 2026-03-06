import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { config } from "dotenv";

// Load .env.local
config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL!;
const ADMIN_EMAIL = "shaojin.guo1@gmail.com";

// ─── Lease term mapping ────────────────────────────────────
function mapLeaseTermType(term: string) {
  switch (term) {
    case "6 Months":
      return "SIX_MONTHS" as const;
    case "12 Months":
      return "ONE_YEAR" as const;
    case "24 Months":
      return "TWO_YEARS" as const;
    case "Month to Month":
      return "MONTH_TO_MONTH" as const;
    default:
      return "ONE_YEAR" as const;
  }
}

// ─── Demo property data ────────────────────────────────────
const PROPERTIES = [
  {
    slug: "modern-2br-downtown-loft",
    title: "Modern 2BR Downtown Loft",
    description:
      "A stunning modern loft in the heart of downtown Austin. This beautifully renovated two-bedroom unit features soaring 14-foot ceilings, exposed brick walls, and floor-to-ceiling windows that flood the space with natural light. The open-concept living area seamlessly connects the gourmet kitchen with quartz countertops and stainless steel appliances to a spacious living room perfect for entertaining. Both bedrooms offer generous closet space, and the primary suite includes an en-suite bathroom with a walk-in rain shower. Building amenities include a fitness center, rooftop pool, and 24-hour concierge service.",
    propertyType: "APARTMENT" as const,
    price: 2500,
    securityDeposit: 2500,
    addressLine1: "123 Congress Ave",
    city: "Austin",
    state: "TX",
    zipCode: "78701",
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1100,
    yearBuilt: 2020,
    floor: 5,
    totalFloors: 12,
    leaseTermType: "12 Months",
    availableFrom: "2026-04-01",
    petPolicy: "Cats and small dogs allowed with $500 pet deposit",
    parkingSpaces: 1,
    featured: true,
    amenities: [
      "In-Unit Washer/Dryer",
      "Central AC",
      "Dishwasher",
      "Hardwood Floors",
      "Gym Access",
      "Pool",
      "Rooftop Deck",
      "Concierge",
    ],
    images: [
      { url: "https://placehold.co/1200x800/f59e0b/ffffff?text=Living+Room", alt: "Living Room", isPrimary: true },
      { url: "https://placehold.co/1200x800/d97706/ffffff?text=Kitchen", alt: "Kitchen", isPrimary: false },
      { url: "https://placehold.co/1200x800/b45309/ffffff?text=Bedroom", alt: "Bedroom", isPrimary: false },
      { url: "https://placehold.co/1200x800/92400e/ffffff?text=Bathroom", alt: "Bathroom", isPrimary: false },
    ],
  },
  {
    slug: "cozy-1br-capitol-hill",
    title: "Cozy 1BR on Capitol Hill",
    description:
      "Discover this charming one-bedroom retreat nestled in Denver's vibrant Capitol Hill neighborhood. This cozy yet thoughtfully designed unit offers an efficient layout with a separate bedroom, updated kitchen with granite counters, and a sun-drenched living area. Enjoy the walkable neighborhood filled with eclectic shops, cafes, and restaurants just steps from your door. The unit includes in-unit laundry and a private balcony overlooking a tree-lined street. Perfect for young professionals seeking an urban lifestyle in one of Denver's most sought-after locations.",
    propertyType: "STUDIO" as const,
    price: 1200,
    securityDeposit: 1200,
    addressLine1: "456 E Colfax Ave",
    city: "Denver",
    state: "CO",
    zipCode: "80218",
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 650,
    yearBuilt: 1965,
    floor: 3,
    totalFloors: 4,
    leaseTermType: "12 Months",
    availableFrom: "2026-03-15",
    petPolicy: "Cats only, no dogs permitted",
    parkingSpaces: 0,
    featured: false,
    amenities: [
      "In-Unit Washer/Dryer",
      "Central AC",
      "Dishwasher",
      "Hardwood Floors",
      "Balcony",
      "Bike Storage",
    ],
    images: [
      { url: "https://placehold.co/1200x800/d97706/ffffff?text=Living+Area", alt: "Living Area", isPrimary: true },
      { url: "https://placehold.co/1200x800/b45309/ffffff?text=Kitchen", alt: "Kitchen", isPrimary: false },
      { url: "https://placehold.co/1200x800/92400e/ffffff?text=Bedroom", alt: "Bedroom", isPrimary: false },
      { url: "https://placehold.co/1200x800/78350f/ffffff?text=Balcony+View", alt: "Balcony View", isPrimary: false },
    ],
  },
  {
    slug: "spacious-3br-pearl-district",
    title: "Spacious 3BR in Pearl District",
    description:
      "Experience luxury urban living in this expansive three-bedroom condo located in Portland's prestigious Pearl District. This corner unit boasts panoramic city views, a chef's kitchen with premium Viking appliances and a large island, and an open living space ideal for both relaxing and hosting. The primary bedroom features a walk-in closet and spa-like ensuite bathroom with soaking tub. Two additional bedrooms provide ample space for family, guests, or a home office. The building offers secure underground parking, a private courtyard, and direct access to the Pearl District's galleries, restaurants, and waterfront parks.",
    propertyType: "CONDO" as const,
    price: 3200,
    securityDeposit: 3200,
    addressLine1: "789 NW Glisan St",
    city: "Portland",
    state: "OR",
    zipCode: "97209",
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1450,
    yearBuilt: 2018,
    floor: 8,
    totalFloors: 10,
    leaseTermType: "12 Months",
    availableFrom: "2026-05-01",
    petPolicy: "Pets welcome with $750 pet deposit, 2 pet maximum",
    parkingSpaces: 2,
    featured: false,
    amenities: [
      "In-Unit Washer/Dryer",
      "Central AC",
      "Dishwasher",
      "Hardwood Floors",
      "Gym Access",
      "Concierge",
      "Courtyard",
      "Storage Unit",
      "EV Charging",
      "Package Lockers",
    ],
    images: [
      { url: "https://placehold.co/1200x800/b45309/ffffff?text=Open+Living+Room", alt: "Open Living Room", isPrimary: true },
      { url: "https://placehold.co/1200x800/92400e/ffffff?text=Gourmet+Kitchen", alt: "Gourmet Kitchen", isPrimary: false },
      { url: "https://placehold.co/1200x800/78350f/ffffff?text=Primary+Bedroom", alt: "Primary Bedroom", isPrimary: false },
      { url: "https://placehold.co/1200x800/f59e0b/ffffff?text=City+View", alt: "City View", isPrimary: false },
      { url: "https://placehold.co/1200x800/d97706/ffffff?text=Ensuite+Bath", alt: "Ensuite Bathroom", isPrimary: false },
    ],
  },
  {
    slug: "charming-2br-fremont-cottage",
    title: "Charming 2BR Fremont Cottage",
    description:
      "Fall in love with this beautifully restored two-bedroom cottage in Seattle's quirky Fremont neighborhood. Original craftsman details blend with modern updates, including a renovated kitchen with butcher block countertops and farmhouse sink. The cozy living room features a decorative fireplace and built-in bookshelves. A private backyard with a mature garden and patio is perfect for outdoor dining. Walking distance to the Fremont Sunday Market, craft breweries, and the Burke-Gilman Trail. This home offers the rare combination of character, location, and outdoor space in the heart of the city.",
    propertyType: "HOUSE" as const,
    price: 2800,
    securityDeposit: 2800,
    addressLine1: "321 N 36th St",
    city: "Seattle",
    state: "WA",
    zipCode: "98103",
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 950,
    yearBuilt: 1928,
    floor: 1,
    totalFloors: 2,
    leaseTermType: "12 Months",
    availableFrom: "2026-04-15",
    petPolicy: "Dogs and cats welcome, fenced yard, no breed restrictions",
    parkingSpaces: 1,
    featured: false,
    amenities: [
      "Washer/Dryer Hookups",
      "Dishwasher",
      "Hardwood Floors",
      "Fireplace",
      "Private Yard",
      "Patio",
      "Garden",
      "Garage",
    ],
    images: [
      { url: "https://placehold.co/1200x800/92400e/ffffff?text=Cottage+Exterior", alt: "Cottage Exterior", isPrimary: true },
      { url: "https://placehold.co/1200x800/78350f/ffffff?text=Living+Room", alt: "Living Room", isPrimary: false },
      { url: "https://placehold.co/1200x800/f59e0b/ffffff?text=Kitchen", alt: "Kitchen", isPrimary: false },
      { url: "https://placehold.co/1200x800/d97706/ffffff?text=Backyard", alt: "Backyard", isPrimary: false },
    ],
  },
  {
    slug: "luxury-2br-midtown-highrise",
    title: "Luxury 2BR Midtown Highrise",
    description:
      "Elevate your lifestyle in this luxurious two-bedroom highrise apartment in Sacramento's dynamic Midtown district. Floor-to-ceiling windows frame stunning views of the city skyline and the Sierra Nevada foothills. The designer kitchen features waterfall quartz countertops, custom cabinetry, and top-of-the-line Bosch appliances. Both bedrooms are generously sized with large closets, and the primary suite includes dual vanities and a glass-enclosed shower. Residents enjoy resort-style amenities including an infinity pool, sky lounge, state-of-the-art fitness center, and a dog park. Located steps from Midtown's best dining and nightlife.",
    propertyType: "APARTMENT" as const,
    price: 3500,
    securityDeposit: 3500,
    addressLine1: "1000 K St",
    city: "Sacramento",
    state: "CA",
    zipCode: "95814",
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1300,
    yearBuilt: 2023,
    floor: 15,
    totalFloors: 22,
    leaseTermType: "12 Months",
    availableFrom: "2026-06-01",
    petPolicy: "Small dogs and cats allowed with $600 pet deposit, 35 lb weight limit",
    parkingSpaces: 2,
    featured: false,
    amenities: [
      "In-Unit Washer/Dryer",
      "Central AC",
      "Dishwasher",
      "Hardwood Floors",
      "Gym Access",
      "Pool",
      "Sky Lounge",
      "Dog Park",
      "EV Charging",
      "Package Lockers",
      "Concierge",
      "Valet Parking",
    ],
    images: [
      { url: "https://placehold.co/1200x800/78350f/ffffff?text=Skyline+View", alt: "Skyline View", isPrimary: true },
      { url: "https://placehold.co/1200x800/f59e0b/ffffff?text=Designer+Kitchen", alt: "Designer Kitchen", isPrimary: false },
      { url: "https://placehold.co/1200x800/d97706/ffffff?text=Primary+Suite", alt: "Primary Suite", isPrimary: false },
      { url: "https://placehold.co/1200x800/b45309/ffffff?text=Pool+Deck", alt: "Pool Deck", isPrimary: false },
      { url: "https://placehold.co/1200x800/92400e/ffffff?text=Sky+Lounge", alt: "Sky Lounge", isPrimary: false },
    ],
  },
  {
    slug: "sunny-1br-south-congress",
    title: "Sunny 1BR near South Congress",
    description:
      "Soak up the sunshine in this bright and airy one-bedroom apartment just minutes from Austin's iconic South Congress Avenue. Large east-facing windows bring in gorgeous morning light, and the open floor plan makes this unit feel spacious beyond its square footage. The updated kitchen features white shaker cabinets, subway tile backsplash, and stainless steel appliances. Enjoy the vibrant SoCo scene with its eclectic boutiques, live music venues, and renowned food trucks right around the corner. The community offers a sparkling pool, outdoor grilling area, and bike parking for easy access to the trail network.",
    propertyType: "APARTMENT" as const,
    price: 1450,
    securityDeposit: 1450,
    addressLine1: "550 S Congress Ave",
    city: "Austin",
    state: "TX",
    zipCode: "78704",
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 720,
    yearBuilt: 2015,
    floor: 2,
    totalFloors: 3,
    leaseTermType: "6 Months",
    availableFrom: "2026-03-20",
    petPolicy: "Cats and dogs allowed with $400 pet deposit, 2 pet maximum",
    parkingSpaces: 1,
    featured: false,
    amenities: [
      "In-Unit Washer/Dryer",
      "Central AC",
      "Dishwasher",
      "Pool",
      "Grilling Area",
      "Bike Storage",
      "Package Lockers",
    ],
    images: [
      { url: "https://placehold.co/1200x800/fbbf24/ffffff?text=Sunny+Living+Room", alt: "Sunny Living Room", isPrimary: true },
      { url: "https://placehold.co/1200x800/f59e0b/ffffff?text=Updated+Kitchen", alt: "Updated Kitchen", isPrimary: false },
      { url: "https://placehold.co/1200x800/d97706/ffffff?text=Bedroom", alt: "Bedroom", isPrimary: false },
      { url: "https://placehold.co/1200x800/b45309/ffffff?text=Pool+Area", alt: "Pool Area", isPrimary: false },
    ],
  },
];

// ─── Main ──────────────────────────────────────────────────
async function main() {
  if (!DATABASE_URL) {
    console.error("Missing DATABASE_URL in .env.local");
    process.exit(1);
  }

  console.log("Starting property seed script...\n");

  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Find admin user
    console.log(`Looking up admin user: ${ADMIN_EMAIL}`);
    const adminUser = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (!adminUser) {
      console.error(`Admin user not found with email: ${ADMIN_EMAIL}`);
      console.error("Run the create-admin script first.");
      process.exit(1);
    }
    console.log(`Found admin user: ${adminUser.id} (${adminUser.email})\n`);

    // 2. Collect all unique amenity names across all properties
    const allAmenityNames = [
      ...new Set(PROPERTIES.flatMap((p) => p.amenities)),
    ];
    console.log(`Upserting ${allAmenityNames.length} amenities...`);

    const amenityMap: Record<string, string> = {};
    for (const name of allAmenityNames) {
      const amenity = await prisma.amenity.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      amenityMap[name] = amenity.id;
    }
    console.log(`Amenities ready.\n`);

    // 3. Create properties with images and amenity connections
    for (let i = 0; i < PROPERTIES.length; i++) {
      const p = PROPERTIES[i];
      console.log(`[${i + 1}/${PROPERTIES.length}] Upserting property: ${p.title}`);

      const property = await prisma.property.upsert({
        where: { slug: p.slug },
        update: {
          title: p.title,
          description: p.description,
          propertyType: p.propertyType,
          listingType: "RENT",
          status: "ACTIVE",
          price: p.price,
          securityDeposit: p.securityDeposit,
          addressLine1: p.addressLine1,
          city: p.city,
          state: p.state,
          zipCode: p.zipCode,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          squareFeet: p.squareFeet,
          yearBuilt: p.yearBuilt,
          floor: p.floor,
          totalFloors: p.totalFloors,
          leaseTermType: mapLeaseTermType(p.leaseTermType),
          availableFrom: new Date(p.availableFrom),
          petPolicy: p.petPolicy,
          parkingSpaces: p.parkingSpaces,
          featured: p.featured,
          createdById: adminUser.id,
        },
        create: {
          slug: p.slug,
          title: p.title,
          description: p.description,
          propertyType: p.propertyType,
          listingType: "RENT",
          status: "ACTIVE",
          price: p.price,
          securityDeposit: p.securityDeposit,
          addressLine1: p.addressLine1,
          city: p.city,
          state: p.state,
          zipCode: p.zipCode,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          squareFeet: p.squareFeet,
          yearBuilt: p.yearBuilt,
          floor: p.floor,
          totalFloors: p.totalFloors,
          leaseTermType: mapLeaseTermType(p.leaseTermType),
          availableFrom: new Date(p.availableFrom),
          petPolicy: p.petPolicy,
          parkingSpaces: p.parkingSpaces,
          featured: p.featured,
          createdById: adminUser.id,
        },
      });

      // Delete existing images and amenity connections so we can recreate them cleanly
      await prisma.propertyImage.deleteMany({
        where: { propertyId: property.id },
      });
      await prisma.propertyAmenity.deleteMany({
        where: { propertyId: property.id },
      });

      // Create images
      for (let j = 0; j < p.images.length; j++) {
        const img = p.images[j];
        await prisma.propertyImage.create({
          data: {
            propertyId: property.id,
            url: img.url,
            alt: img.alt,
            sortOrder: j,
            isPrimary: img.isPrimary,
            storagePath: "",
          },
        });
      }
      console.log(`  -> ${p.images.length} images created`);

      // Connect amenities
      for (const amenityName of p.amenities) {
        await prisma.propertyAmenity.create({
          data: {
            propertyId: property.id,
            amenityId: amenityMap[amenityName],
          },
        });
      }
      console.log(`  -> ${p.amenities.length} amenities connected`);
    }

    console.log(`\nSeed complete! ${PROPERTIES.length} properties seeded successfully.`);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
