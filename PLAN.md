# Plan: UI/UX Polish Pass

## Goal
Comprehensive UI/UX refinements across the entire app to elevate the premium feel, improve usability, and fix visual inconsistencies.

## Audit Findings

### 🔴 High Priority
1. **Listing Detail — Price card on desktop has no visual breathing room** — "Apply Now" and "Schedule Tour" buttons feel cramped
2. **Contact page — "Map coming soon" placeholder** — looks unfinished; replace with an embedded static map or a styled location card
3. **About page — Team section is empty** — just a paragraph, no team members; either add placeholder team cards or remove the section
4. **FAQ — no search** — 10 questions but no way to filter/search them
5. **Homepage — CTA section is similar to hero** — both dark charcoal with gold; differentiate them visually

### 🟡 Medium Priority
6. **Property Card — no "Available" date indicator** — users have to click through to see when it's available
7. **Listings page — no sort options** — can filter but not sort (price low→high, newest, etc.)
8. **Application Form — step indicator could show progress %** — mobile progress bar is good but desktop could use a percentage
9. **Footer — social links go to "#"** — placeholder hrefs look broken on hover
10. **Header — no active state for current page** — nav links don't highlight which page you're on

### 🟢 Polish
11. **Consistent section headers** — some use "p > h2 > divider > p" pattern, some don't; standardize
12. **Empty states** — listings page empty state could be more inviting
13. **Loading states** — no skeleton loaders for listing cards
14. **Scroll to top** — add a back-to-top button for long pages
15. **Favicon** — verify it's set correctly

## Changes

### Files to modify:
- [ ] `src/components/layout/header.tsx` — active nav state
- [ ] `src/components/layout/footer.tsx` — remove dead social links or mark as "Coming Soon"
- [ ] `src/app/page.tsx` — differentiate CTA from hero, polish
- [ ] `src/app/(public)/about/page.tsx` — team section → placeholder cards or remove
- [ ] `src/app/(public)/contact/page.tsx` — replace map placeholder with styled location card
- [ ] `src/app/(public)/listings/page.tsx` — add sort dropdown
- [ ] `src/app/(public)/listings/[slug]/page.tsx` — spacing in price card
- [ ] `src/components/property/property-card.tsx` — add available date
- [ ] `src/components/ui/scroll-to-top.tsx` — new component
- [ ] `src/app/(public)/layout.tsx` — add ScrollToTop

### New files:
- [ ] `src/components/ui/scroll-to-top.tsx`

## Testing
- Visual inspection of all pages
- All pages return 200
- Build succeeds
- TypeScript clean

## Notes
- Keep changes CSS/layout only where possible — minimize logic changes
- Maintain the gold/charcoal luxury theme throughout
