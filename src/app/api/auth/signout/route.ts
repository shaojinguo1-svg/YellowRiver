import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Use request origin for safe redirect
  const url = new URL("/login", request.url);
  return NextResponse.redirect(url);
}
