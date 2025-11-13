import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth-server";
import { getSiteSettings, updateSiteSettings } from "@/lib/settings-mongodb";

// GET - Get site settings
export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getSiteSettings();
    if (!settings) {
      return NextResponse.json(
        { success: false, error: "Failed to load settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("Error getting site settings:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load settings" },
      { status: 500 }
    );
  }
}

// PUT - Update site settings
export async function PUT(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { site_icon, site_logo } = body;

    const updates: any = {};
    if (site_icon !== undefined) updates.site_icon = site_icon;
    if (site_logo !== undefined) updates.site_logo = site_logo;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No updates provided" },
        { status: 400 }
      );
    }

    // Get username from header or auth.uid (for header-based auth, uid is username)
    const username = request.headers.get("x-admin-username") || auth.uid;
    const success = await updateSiteSettings(updates, username || undefined);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to update settings" },
        { status: 500 }
      );
    }

    const updatedSettings = await getSiteSettings();
    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error: any) {
    console.error("Error updating site settings:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}

