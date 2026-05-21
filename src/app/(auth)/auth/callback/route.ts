import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

function safeRelativeNext(value: string | null) {
  if (!value) return null;

  const lowerValue = value.toLowerCase();
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value) ||
    lowerValue.includes("%2f") ||
    lowerValue.includes("%5c")
  ) {
    return null;
  }

  try {
    const parsed = new URL(value, "https://yellowriver.local");
    if (parsed.origin !== "https://yellowriver.local") {
      return null;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const authError = searchParams.get("error");
  const next = safeRelativeNext(searchParams.get("next"));

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
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Redirect based on role
      const user = await getCurrentUser();
      const dest = user?.role === "ADMIN" ? "/admin/dashboard" : "/dashboard";
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
