import { NextResponse } from "next/server";

/** Temporary debug: shows the exact callback URL NextAuth will use. */
export async function GET() {
  const url = process.env.NEXTAUTH_URL ?? "(not set)";
  const expected = `${url.replace(/\/$/, "")}/api/auth/callback/google`;
  return NextResponse.json({
    NEXTAUTH_URL: url,
    expectedCallbackUrl: expected,
    hint: "Copy expectedCallbackUrl EXACTLY into Google Cloud > OAuth client > Authorized redirect URIs",
  });
}
