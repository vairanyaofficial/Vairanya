// components/AuthProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebaseClient";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { useRouter } from "next/navigation";

type AdminInfo = { username: string; role: string; name?: string } | null;

type AuthContextType = {
  user: User | null;
  signinWithGoogle: () => Promise<void>;
  signinAsAdmin: () => Promise<void>;
  signout: () => Promise<void>;
  adminInfo: AdminInfo;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  signinWithGoogle: async () => {},
  signinAsAdmin: async () => {},
  signout: async () => {},
  adminInfo: null,
});

const ADMIN_SESSION_LOCAL = "va_admin_session_local";

function setAdminSessionLocal(sess: AdminInfo) {
  try {
    if (sess) localStorage.setItem(ADMIN_SESSION_LOCAL, JSON.stringify(sess));
    else localStorage.removeItem(ADMIN_SESSION_LOCAL);
  } catch {
    /* ignore */
  }
}
function getAdminSessionLocal(): AdminInfo {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_LOCAL);
    return raw ? (JSON.parse(raw) as AdminInfo) : null;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [adminInfo, setAdminInfo] = useState<AdminInfo>(() => (typeof window !== "undefined" ? getAdminSessionLocal() : null));
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      // Sync customer to Firestore when user signs in (only for regular customers, not admins)
      if (u && u.email && !adminInfo) {
        try {
          const response = await fetch("/api/customer/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: u.email,
              name: u.displayName || u.email.split("@")[0],
              phone: u.phoneNumber || undefined,
              userId: u.uid,
            }),
          });
          
          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            console.error("Failed to sync customer:", data.error || "Unknown error");
          }
        } catch (err) {
          // Silently fail - don't block auth flow
          console.error("Failed to sync customer:", err);
        }
      }
    });
    return () => unsub();
  }, [adminInfo]);

  const signinWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signinAsAdmin = async () => {
    const provider = new GoogleAuthProvider();
    let result;
    try {
      result = await signInWithPopup(auth, provider);
    } catch (err: any) {
      throw err;
    }

    // get idToken
    let idToken: string | null = null;
    try {
      idToken = await result.user.getIdToken();
    } catch (err) {
      // sign out to keep state clean
      await firebaseSignOut(auth).catch(() => {});
      throw new Error("Failed to obtain ID token");
    }

    // call server to verify admin and create session cookie
    let res: Response;
    try {
      res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
    } catch (err) {
      await firebaseSignOut(auth).catch(() => {});
      throw new Error("Network error during admin verification");
    }

    let body: any = null;
    try {
      body = await res.json();
    } catch (err) {
    }

    if (!res.ok || body?.error) {
      await firebaseSignOut(auth).catch(() => {});
      throw new Error(body?.error || `Admin verification failed (status ${res.status})`);
    }

    // Extract user info from response
    if (!body?.user) {
      await firebaseSignOut(auth).catch(() => {});
      throw new Error("Admin verification failed: no user data received");
    }

    const userInfo: AdminInfo = {
      username: body.user.username,
      role: body.user.role,
      name: body.user.name,
    };

    // Set in both localStorage (for AuthProvider) and sessionStorage (for admin-auth.ts)
    setAdminInfo(userInfo);
    setAdminSessionLocal(userInfo);
    
    // Also set in sessionStorage for admin-auth.ts compatibility
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("admin_session", JSON.stringify({
          username: userInfo.username,
          role: userInfo.role,
          name: userInfo.name,
        }));
      } catch (err) {
      }
    }
  };

  const signout = async () => {
    // Clear admin session FIRST before any redirects
    const isAdmin = adminInfo !== null;
    
    // Clear admin session if exists
    setAdminInfo(null);
    setAdminSessionLocal(null);
    
    // Also clear sessionStorage for admin-auth.ts compatibility
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("admin_session");
        localStorage.removeItem("va_admin_session_local");
      } catch {
        /* ignore */
      }
    }
    
    try {
      // call server logout to clear HttpOnly cookie if any
      await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    } catch {
      /* ignore */
    }
    
    try {
      await firebaseSignOut(auth);
    } catch {
      /* ignore */
    }
    
    // Use window.location.href for hard redirect to prevent loops
    if (typeof window !== "undefined") {
      if (isAdmin) {
        window.location.href = "/admin/login";
      } else {
        window.location.href = "/";
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, signinWithGoogle, signinAsAdmin, signout, adminInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
