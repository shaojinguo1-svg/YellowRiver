# Plan: Final UI Acceptance Polish - Listing Images

## Goal
Fix the public listing/detail image rendering issue found during manual UI acceptance.

Current issue:
- Demo/seed property image URLs use `https://placehold.co/...`.
- Those URLs return `image/svg+xml`.
- Next Image rejects SVG responses because `dangerouslyAllowSVG` is disabled.
- The result is noisy dev/server logs and broken listing imagery on public listing surfaces.

Desired outcome:
- Public demo listing images render as normal bitmap images.
- `/`, `/listings`, and `/listings/[slug]` no longer trigger the Next Image SVG rejection warning.
- The fix stays narrowly scoped to demo/listing image data or safe local bitmap assets.

## Changes
- [ ] `scripts/seed-properties.ts` - replace `placehold.co` property image URLs with safe JPG/PNG/WebP URLs or local/approved bitmap asset paths.
- [ ] `next.config.ts` - inspect only; do not enable `dangerouslyAllowSVG` unless reviewer explicitly approves a separate justification.
- [ ] `src/components/property/property-card.tsx` - inspect render behavior for listing cards; change only if image fallback handling is needed.
- [ ] `src/components/property/property-gallery.tsx` - inspect render behavior for listing detail gallery; change only if image fallback handling is needed.
- [ ] `src/app/page.tsx` - inspect homepage featured property image usage.
- [ ] `src/app/(public)/listings/page.tsx` - inspect listing index image usage.
- [ ] `src/app/(public)/listings/[slug]/page.tsx` - inspect listing detail image usage.

Preferred implementation:
- Replace seed/demo `placehold.co` URLs with safe bitmap URLs or local bitmap assets.
- If using remote images, use stable JPG/PNG/WebP sources already compatible with `next.config.ts` remote patterns, or update remote patterns narrowly for the approved bitmap host.
- If using local assets, place them under `public/` with descriptive names and reference them by root-relative paths.
- Keep existing page layout and gallery/card structure intact.

Do not:
- Do not enable `images.dangerouslyAllowSVG` by default.
- Do not change lease, maintenance, auth, Supabase, documents, payments, billing, or business logic.
- Do not change database schema unless reviewer explicitly approves a separate need.
- Do not redesign the listing UI.

## Expected Behavior
- Seed/demo property images are served as JPG, PNG, or WebP.
- Next Image accepts and renders listing images on:
  - `/`
  - `/listings`
  - at least one `/listings/[slug]`
- The dev server no longer logs the SVG rejection warning for listing images.
- Existing property image upload/storage workflows remain unchanged.
- Existing public listing data queries and filters remain unchanged.

## Testing
Run static verification:

```bash
npm run lint
npm run build
```

Manual browser verification:
- Start the dev server.
- Visit `/`.
- Visit `/listings`.
- Visit at least one public listing detail route, for example `/listings/[slug]`.
- Confirm listing images render.
- Confirm the dev server no longer logs the Next Image SVG rejection warning for listing images.

If seed data must be refreshed to verify the fix:
- Use the existing seed path only after reviewer approval for implementation.
- Do not reset/drop/truncate data.
- Record whether verification used existing DB rows, reseeded demo rows, or a local fixture.

## Notes
- `dangerouslyAllowSVG` remains disabled unless reviewer approves a stronger reason. SVGs are unnecessary for this demo listing use case because bitmap placeholders/assets satisfy the acceptance need with less security surface.
- Existing production/admin-uploaded property images should continue to work through the current `property-images` bucket and Next Image configuration.
- The likely implementation surface is small: `scripts/seed-properties.ts` plus optional safe local assets under `public/`.
- Reviewer should approve this plan before implementation.
