// lib/admins-mongodb.ts
// MongoDB implementation for admins - server-side only

import { getMongoDB } from "@/lib/mongodb.server";
import { ObjectId } from "mongodb";

const ADMINS_COLLECTION = "Admin"; // Match MongoDB collection name (capitalized)

export interface Admin {
  _id?: ObjectId;
  uid: string; // Firebase UID (used as unique identifier)
  name: string;
  email: string;
  role: "superadmin" | "admin" | "worker";
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Get admin by UID
 */
export async function getAdminByUid(uid: string): Promise<Admin | null> {
  const db = getMongoDB();
  if (!db) {
    console.error("[Admins MongoDB] Database not available");
    return null;
  }

  try {
    const admin = await db.collection(ADMINS_COLLECTION).findOne({ uid });
    
    if (!admin) {
      return null;
    }

    return {
      _id: admin._id,
      uid: admin.uid,
      name: admin.name || "",
      email: admin.email || "",
      role: admin.role || "worker",
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  } catch (error: any) {
    console.error("[Admins MongoDB] Error getting admin by UID:", error);
    return null;
  }
}

/**
 * Get admin by email
 */
export async function getAdminByEmail(email: string): Promise<Admin | null> {
  const db = getMongoDB();
  if (!db) {
    console.error("[Admins MongoDB] Database not available");
    return null;
  }

  try {
    const admin = await db.collection(ADMINS_COLLECTION).findOne({ email: email.toLowerCase().trim() });
    
    if (!admin) {
      return null;
    }

    return {
      _id: admin._id,
      uid: admin.uid,
      name: admin.name || "",
      email: admin.email || "",
      role: admin.role || "worker",
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  } catch (error: any) {
    console.error("[Admins MongoDB] Error getting admin by email:", error);
    return null;
  }
}

/**
 * Get all admins/workers
 */
export async function getAllAdmins(): Promise<Admin[]> {
  const db = getMongoDB();
  if (!db) {
    console.error("[Admins MongoDB] Database not available");
    return [];
  }

  try {
    const admins = await db.collection(ADMINS_COLLECTION)
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return admins.map((admin: any) => ({
      _id: admin._id,
      uid: admin.uid,
      name: admin.name || "",
      email: admin.email || "",
      role: admin.role || "worker",
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    }));
  } catch (error: any) {
    console.error("[Admins MongoDB] Error getting all admins:", error);
    return [];
  }
}

/**
 * Create or update admin
 */
export async function upsertAdmin(admin: Omit<Admin, "_id" | "createdAt" | "updatedAt">): Promise<Admin> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const now = new Date();
    
    const result = await db.collection(ADMINS_COLLECTION).findOneAndUpdate(
      { uid: admin.uid },
      {
        $set: {
          ...admin,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    if (!result) {
      throw new Error("Failed to create/update admin");
    }

    return {
      _id: result._id,
      uid: result.uid,
      name: result.name || "",
      email: result.email || "",
      role: result.role || "worker",
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  } catch (error: any) {
    console.error("[Admins MongoDB] Error upserting admin:", error);
    throw error;
  }
}

/**
 * Update admin by UID
 */
export async function updateAdmin(uid: string, updates: Partial<Omit<Admin, "_id" | "uid" | "createdAt">>): Promise<Admin | null> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const result = await db.collection(ADMINS_COLLECTION).findOneAndUpdate(
      { uid },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
      }
    );

    if (!result) {
      return null;
    }

    return {
      _id: result._id,
      uid: result.uid,
      name: result.name || "",
      email: result.email || "",
      role: result.role || "worker",
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  } catch (error: any) {
    console.error("[Admins MongoDB] Error updating admin:", error);
    throw error;
  }
}

/**
 * Update admin by email
 */
export async function updateAdminByEmail(email: string, updates: Partial<Omit<Admin, "_id" | "uid" | "createdAt">>): Promise<Admin | null> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const result = await db.collection(ADMINS_COLLECTION).findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
      }
    );

    if (!result) {
      return null;
    }

    return {
      _id: result._id,
      uid: result.uid,
      name: result.name || "",
      email: result.email || "",
      role: result.role || "worker",
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  } catch (error: any) {
    console.error("[Admins MongoDB] Error updating admin by email:", error);
    throw error;
  }
}

/**
 * Delete admin by UID
 */
export async function deleteAdmin(uid: string): Promise<boolean> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const result = await db.collection(ADMINS_COLLECTION).deleteOne({ uid });
    return result.deletedCount > 0;
  } catch (error: any) {
    console.error("[Admins MongoDB] Error deleting admin:", error);
    throw error;
  }
}

/**
 * Delete admin by email
 */
export async function deleteAdminByEmail(email: string): Promise<boolean> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const result = await db.collection(ADMINS_COLLECTION).deleteOne({ email: email.toLowerCase().trim() });
    return result.deletedCount > 0;
  } catch (error: any) {
    console.error("[Admins MongoDB] Error deleting admin by email:", error);
    throw error;
  }
}

/**
 * Check if admin exists
 */
export async function adminExists(uid: string): Promise<boolean> {
  const admin = await getAdminByUid(uid);
  return admin !== null;
}

