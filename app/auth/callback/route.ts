import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // If "next" is in param, use it as the redirect URL; default to "/"
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Get the original host from headers (if any)
      const forwardedHost = request.headers.get("x-forwarded-host");
      // Check if we're in a local development environment or if the origin includes "localhost"
      const isLocalEnv =
        process.env.NODE_ENV === "development" || origin.includes("localhost");

      if (isLocalEnv) {
        // When developing locally, avoid forcing HTTPS redirect
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        // In production, if forwardedHost is provided, enforce HTTPS
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        // Fallback to using the original origin
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // If the code is missing or an error occurred, redirect to the auth-code error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
