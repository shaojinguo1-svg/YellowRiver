# CLAUDE.md - YellowRiver Project Rules

## Development Workflow

### Plan Before Code

Before making ANY code changes, you MUST:

1. **Write a plan first** — Create or update `PLAN.md` in the project root
2. **The plan should include:**
   - What changes are being made and why
   - Files that will be modified
   - Expected behavior after changes
   - Testing strategy
3. **Get confirmation** — Wait for approval before implementing (unless explicitly told to proceed)
4. **Execute the plan** — Implement changes according to the plan
5. **Verify** — Run tests/builds to confirm everything works
6. **Commit** — Commit with a clear message referencing the plan

### Plan Format

```markdown
# Plan: [Brief Title]

## Goal
What we're trying to achieve.

## Changes
- [ ] File 1 — what changes
- [ ] File 2 — what changes

## Testing
How to verify the changes work.

## Notes
Any risks, dependencies, or decisions needed.
```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Auth:** Supabase Auth
- **Database:** PostgreSQL via Prisma (with PrismaPg adapter)
- **UI:** Shadcn UI + Tailwind CSS v4
- **Styling:** Luxury gold/charcoal theme
- **Forms:** React Hook Form + Zod validation
- **Email:** Resend
- **Storage:** Supabase Storage

## Code Conventions

- Use `font-display` for headings, `font-sans` for body text
- Gold (`text-gold`, `bg-gold`) for accent colors
- Warm palette (`warm-100` to `warm-900`) for neutral text/backgrounds
- `charcoal` for dark sections, `ivory` for light backgrounds
- API error responses always use `{ message: "..." }` format
- Use Next.js `<Image>` component, not `<img>`
- Server components by default; add `"use client"` only when needed
