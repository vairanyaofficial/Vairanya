import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  return NextResponse.json({
    keyIdConfigured: !!keyId,
    keyIdPrefix: keyId?.substring(0, 8),
    keySecretConfigured: !!keySecret,
    keySecretLength: keySecret?.length || 0,
    // Don't expose actual secrets
  });
}
