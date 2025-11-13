// MongoDB functions for site settings
// Server-side only
import "server-only";
import { initializeMongoDB, getMongoDB } from "@/lib/mongodb.server";
import type { SiteSettings } from "./settings-types";

const SETTINGS_COLLECTION = "site_settings";
const SETTINGS_ID = "main"; // Single document for all settings

export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return null;
    }

    const db = getMongoDB();
    if (!db) {
      return null;
    }

    const doc = await db.collection(SETTINGS_COLLECTION).findOne({ id: SETTINGS_ID });

    if (!doc) {
      // Return default settings if none exist
      return {
        id: SETTINGS_ID,
        site_icon: "/images/logo-ivory.png",
        site_logo: "/images/logo-ivory.png",
        updated_at: new Date().toISOString(),
      };
    }

    return {
      id: doc.id || SETTINGS_ID,
      site_icon: doc.site_icon || "/images/logo-ivory.png",
      site_logo: doc.site_logo || "/images/logo-ivory.png",
      updated_at: doc.updated_at || doc.updatedAt || new Date().toISOString(),
      updated_by: doc.updated_by || doc.updatedBy,
    };
  } catch (error) {
    console.error("Error getting site settings:", error);
    return null;
  }
}

export async function updateSiteSettings(
  updates: Partial<Pick<SiteSettings, "site_icon" | "site_logo">>,
  updatedBy?: string
): Promise<boolean> {
  try {
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return false;
    }

    const db = getMongoDB();
    if (!db) {
      return false;
    }

    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (updatedBy) {
      updateData.updated_by = updatedBy;
    }

    await db.collection(SETTINGS_COLLECTION).updateOne(
      { id: SETTINGS_ID },
      {
        $set: updateData,
        $setOnInsert: {
          id: SETTINGS_ID,
          created_at: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    return true;
  } catch (error) {
    console.error("Error updating site settings:", error);
    return false;
  }
}

