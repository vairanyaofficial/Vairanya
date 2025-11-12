// app/api/admin/get-my-uid/route.ts
// Helper endpoint to get the current user's ID from NextAuth session
// This helps users find their ID to add themselves as admin
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Not authenticated",
          instructions: "Sign in first to get your user ID"
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      id: session.user.id,
      email: session.user.email || null,
      name: session.user.name || null,
      instructions: {
        step1: "Copy your email above",
        step2: "Use the admin panel to add yourself as admin",
        step3: "Or update MongoDB Admin collection directly with your email",
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Server error",
        message: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
