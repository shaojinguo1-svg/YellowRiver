import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const authError = searchParams.get("error");

  // Handle error returned by Supabase (e.g. unauthorized, expired link)
  if (authError) {
    const errorDescription = searchParams.get("error_description") || authError;
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", errorDescription);
    return NextResponse.redirect(loginUrl.toString());
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}/admin/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
