import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function isSameOrigin(request: NextRequest) {
  const expectedOrigin = request.nextUrl.origin;
  const origin = request.headers.get("origin");
  if (origin) {
    return origin === expectedOrigin;
  }

  const referer = request.headers.get("referer");
  if (!referer) {
    return false;
  }

  try {
    return new URL(referer).origin === expectedOrigin;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  // Use request origin for safe redirect
  const url = new URL("/login", request.url);
  return NextResponse.redirect(url);
}
