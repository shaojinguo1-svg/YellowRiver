# Plan: Mobile Optimization + Full Test & Code Review

## Goal
Optimize all pages for mobile devices, then run a comprehensive test and code review.

## Phase 1: Mobile Audit
- [ ] Check all components for mobile responsiveness issues
- [ ] Test touch targets (buttons, links ≥ 44px)
- [ ] Check text readability (font sizes, line heights)
- [ ] Check image sizing and overflow
- [ ] Check navigation (mobile hamburger menu)
- [ ] Check form usability on mobile

## Phase 2: Fix Issues
Files to check/fix:
- [ ] `src/components/layout/header.tsx` — mobile nav, logo sizing
- [ ] `src/components/layout/footer.tsx` — column stacking
- [ ] `src/app/page.tsx` — hero text sizing, stats grid, search bar
- [ ] `src/app/(public)/listings/page.tsx` — filter bar on mobile
- [ ] `src/app/(public)/listings/[slug]/page.tsx` — detail layout, price card
- [ ] `src/app/(public)/listings/[slug]/apply/page.tsx` — form width
- [ ] `src/app/(public)/contact/page.tsx` — form + sidebar stacking
- [ ] `src/app/(public)/about/page.tsx` — mission/vision grid
- [ ] `src/app/(public)/faq/page.tsx` — accordion width
- [ ] `src/components/property/property-card.tsx` — card sizing
- [ ] `src/components/property/property-gallery.tsx` — bento grid on mobile
- [ ] `src/components/property/hero-search.tsx` — search bar stacking
- [ ] `src/components/application/application-form.tsx` — multi-step form
- [ ] `src/components/admin/*` — admin panels

## Phase 3: Full Testing
- [ ] All public pages return 200
- [ ] All API endpoints work correctly
- [ ] Form submissions succeed
- [ ] Image upload works
- [ ] Admin auth protects routes
- [ ] TypeScript compiles clean
- [ ] Build succeeds

## Phase 4: Code Review
- [ ] Check for remaining issues from initial review
- [ ] Check for new issues introduced by recent changes
- [ ] Performance checks (unnecessary re-renders, missing keys, etc.)
