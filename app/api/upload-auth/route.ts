import { getUploadAuthParams } from "@imagekit/next/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth-server";

/**
 * ImageKit Upload Authentication API Route
 * 
 * Generates authentication parameters for secure file uploads to ImageKit.
 * This endpoint should be called by the client before uploading files.
 * 
 * Required Environment Variables:
 * - IMAGEKIT_PRIVATE_KEY: Your ImageKit private key (server-side only)
 * - NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: Your ImageKit public key
 * 
 * Authentication: Admin only
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication for upload authentication
    const auth = requireAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
  } catch (authError: any) {
    console.error("Upload auth: Authentication error:", authError?.message);
    return NextResponse.json(
      { 
        error: `Authentication failed: ${authError?.message || 'Unknown error'}` 
      },
      { status: 401 }
    );
  }

  try {
    // Get ImageKit credentials from environment variables
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;

    // Validate credentials
    if (!privateKey) {
      console.error("IMAGEKIT_PRIVATE_KEY is missing");
      return NextResponse.json(
        {
          error: "IMAGEKIT_PRIVATE_KEY is not configured. Please add it to your environment variables.",
        },
        { status: 500 }
      );
    }

    if (!publicKey) {
      console.error("NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY is missing");
      return NextResponse.json(
        {
          error: "NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY is not configured. Please add it to your environment variables.",
        },
        { status: 500 }
      );
    }

    // Generate upload authentication parameters
    // These are one-time use credentials that expire after 1 hour (default)
    const { token, expire, signature } = getUploadAuthParams({
      privateKey: privateKey.trim(),
      publicKey: publicKey.trim(),
      // Optional: customize expiry time (in seconds, max 1 hour = 3600 seconds)
      // expire: 30 * 60, // 30 minutes
    });

    // Return authentication parameters to the client
    return NextResponse.json({ 
      token, 
      expire, 
      signature, 
      publicKey: publicKey.trim() 
    });
  } catch (error: any) {
    console.error("Failed to generate upload auth params:", {
      message: error?.message,
      stack: error?.stack?.substring(0, 500),
    });
    
    return NextResponse.json(
      {
        error: `Failed to generate upload credentials: ${error?.message || 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

