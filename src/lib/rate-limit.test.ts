import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { checkRateLimit, resetRateLimitBucketsForTest } from "@/lib/rate-limit";

function makeRequest(headers: Record<string, string> = {}) {
  return { headers: new Headers(headers) } as NextRequest;
}

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-30T00:00:00.000Z"));
    resetRateLimitBucketsForTest();
  });

  afterEach(() => {
    resetRateLimitBucketsForTest();
    vi.useRealTimers();
  });

  it("limits requests after the configured count", () => {
    const request = makeRequest({ "x-forwarded-for": "203.0.113.10" });
    const options = { keyPrefix: "contact", limit: 2, windowMs: 60_000 };

    expect(checkRateLimit(request, options)).toEqual({
      limited: false,
      remaining: 1,
      retryAfter: 0,
    });
    expect(checkRateLimit(request, options)).toEqual({
      limited: false,
      remaining: 0,
      retryAfter: 0,
    });
    expect(checkRateLimit(request, options)).toEqual({
      limited: true,
      remaining: 0,
      retryAfter: 60,
    });
  });

  it("resets buckets after the window expires", () => {
    const request = makeRequest({ "x-forwarded-for": "203.0.113.10" });
    const options = { keyPrefix: "application", limit: 1, windowMs: 60_000 };

    expect(checkRateLimit(request, options).limited).toBe(false);
    expect(checkRateLimit(request, options).limited).toBe(true);

    vi.advanceTimersByTime(60_001);

    expect(checkRateLimit(request, options)).toEqual({
      limited: false,
      remaining: 0,
      retryAfter: 0,
    });
  });

  it("separates buckets by secondary key", () => {
    const request = makeRequest({ "x-real-ip": "203.0.113.20" });
    const options = { keyPrefix: "upload", limit: 1, windowMs: 60_000 };

    expect(checkRateLimit(request, { ...options, secondaryKey: "session-a" }).limited).toBe(false);
    expect(checkRateLimit(request, { ...options, secondaryKey: "session-a" }).limited).toBe(true);
    expect(checkRateLimit(request, { ...options, secondaryKey: "session-b" }).limited).toBe(false);
  });
});
