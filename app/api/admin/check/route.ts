// app/api/admin/check/route.ts
// Lightweight endpoint to check if a user is an admin/worker
// Returns 200 with status, never 403, to avoid console errors for regular customers
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { initializeMongoDB } from "@/lib/mongodb.server";
import { getMongoDB } from "@/lib/mongodb.server";

export async function POST(req: Request) {
  try {
    // Get NextAuth session
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        isAdmin: false
      }, { status: 200 }); // Return 200 to avoid blocking login
    }

    // Initialize MongoDB (fail silently if not available)
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json({ 
        isAdmin: false
      }, { status: 200 });
    }

    const db = getMongoDB();
    if (!db) {
      return NextResponse.json({ 
        isAdmin: false
      }, { status: 200 });
    }

    // Find admin by email (case-insensitive)
    const userEmail = session.user.email?.toLowerCase().trim();
    const adminData = await db.collection("Admin").findOne({
      email: { $regex: new RegExp(`^${userEmail}$`, "i") },
    });
    
    if (!adminData) {
      // User is not an admin - return success with isAdmin: false
      return NextResponse.json({ 
        isAdmin: false 
      }, { status: 200 });
    }

    // Map MongoDB role to system role (same mapping as /api/admin/login)
    // superadmin -> superuser (full access)
    // admin -> admin (limited access, no workers management)
    // worker -> worker (very limited access)
    let role: string = adminData.role || "worker";
    if (role === "superadmin") {
      role = "superuser";
    } else if (role === "admin") {
      role = "admin"; // Keep as admin (not superuser)
    }
    // worker stays as worker

    // User is an admin/worker
    return NextResponse.json({
      isAdmin: true,
      user: {
        username: adminData.uid || session.user.id || session.user.email,
        role: role,
        name: adminData.name || session.user.name || session.user.email?.split("@")[0] || "Admin",
      },
    }, { status: 200 });
  } catch (err: any) {
    // Any error - assume not admin
    return NextResponse.json({ 
      isAdmin: false 
    }, { status: 200 });
  }
}
