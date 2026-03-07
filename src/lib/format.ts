/**
 * Shared formatting utilities — single source of truth for price/date formatting.
 * Previously duplicated in property-card.tsx, listings/[slug]/page.tsx, and elsewhere.
 */

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatAvailableDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  if (date <= now) return "Available Now";
  return `Available ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}
