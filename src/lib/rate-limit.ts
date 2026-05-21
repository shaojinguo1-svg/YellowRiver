import { NextRequest, NextResponse } from "next/server";

type RateLimitOptions = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
  secondaryKey?: string | null;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

function cleanup(now: number) {
  for (const [key, entry] of buckets.entries()) {
    if (entry.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function checkRateLimit(request: NextRequest, options: RateLimitOptions) {
  const now = Date.now();
  cleanup(now);

  const ip = getClientIp(request);
  const key = [
    options.keyPrefix,
    ip,
    options.secondaryKey?.trim() || "anonymous",
  ].join(":");

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return { limited: false, remaining: options.limit - 1, retryAfter: 0 };
  }

  if (current.count >= options.limit) {
    return {
      limited: true,
      remaining: 0,
      retryAfter: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;
  return {
    limited: false,
    remaining: options.limit - current.count,
    retryAfter: 0,
  };
}

export function rateLimitResponse(retryAfter: number) {
  return NextResponse.json(
    { message: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
      },
    }
  );
}
