# Plan: Add Amenities Selection to Admin Listing Form

## Goal
Add amenity multi-select UI to the admin listing form so admins can assign amenities to properties.

## Root Cause
- DB has 24 amenities seeded ✅
- Prisma schema has Amenity + PropertyAmenity models ✅
- Listing form has `amenityIds` in defaultValues but NO UI to select them ❌
- API route doesn't handle `amenityIds` on create/update ❌

## Changes
- [ ] `src/components/admin/listing-form.tsx` — Add amenity checkbox grid in Details tab
  - Fetch available amenities via API or pass as prop
  - Render checkboxes, update `amenityIds` field
- [ ] `src/app/admin/listings/new/page.tsx` — Fetch amenities, pass to form
- [ ] `src/app/admin/listings/[id]/edit/page.tsx` — Fetch amenities + property's current amenities, pass to form
- [ ] `src/app/api/properties/route.ts` (POST) — Handle `amenityIds` to create PropertyAmenity records
- [ ] `src/app/api/properties/[id]/route.ts` (PATCH) — Handle `amenityIds` to sync PropertyAmenity records

## Testing
- Create listing with amenities → verify they appear on the public detail page
- Edit listing, change amenities → verify update works
