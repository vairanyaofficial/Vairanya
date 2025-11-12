// app/api/auth/providers/route.ts
// API route to check which authentication providers are available
import { NextResponse } from "next/server";

export async function GET() {
  // Check if Google OAuth is configured
  const hasGoogleOAuth = 
    process.env.GOOGLE_CLIENT_ID && 
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_ID.trim() !== "" &&
    process.env.GOOGLE_CLIENT_SECRET.trim() !== "";

  return NextResponse.json({
    google: hasGoogleOAuth,
    credentials: true, // Always available
  });
}

