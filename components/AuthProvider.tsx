// components/AuthProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebaseClient";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  type User,
} from "firebase/auth";
import { useRouter } from "next/navigation";

type AdminInfo = { username: string; role: string; name?: string } | null;

type AuthContextType = {
  user: User | null;
  signinWithGoogle: () => Promise<void>;
  signinWithEmailPassword: (email: string, password: string) => Promise<void>;
  signupWithEmailPassword: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  signinAsAdmin: () => Promise<void>;
  signout: () => Promise<void>;
  adminInfo: AdminInfo;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  signinWithGoogle: async () => {},
  signinWithEmailPassword: async () => {},
  signupWithEmailPassword: async () => {},
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
  const [isPopupOpen, setIsPopupOpen] = useState(false);
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
    // Prevent multiple simultaneous popup requests
    if (isPopupOpen) {
      throw new Error("A sign-in popup is already open. Please wait or close it and try again.");
    }
    
    setIsPopupOpen(true);
    try {
      const provider = new GoogleAuthProvider();
      // Set additional OAuth parameters to prevent popup blocking
      provider.setCustomParameters({
        prompt: "select_account",
      });
      await signInWithPopup(auth, provider);
      // Reset immediately on success
      setIsPopupOpen(false);
    } catch (err: any) {
      setIsPopupOpen(false);
      // Handle cancelled popup gracefully
      if (err?.code === "auth/cancelled-popup-request") {
        throw new Error("Sign-in was interrupted. Please try again.");
      }
      if (err?.code === "auth/popup-closed-by-user") {
        throw new Error("Sign-in cancelled. Please try again if you want to continue.");
      }
      if (err?.code === "auth/popup-blocked") {
        throw new Error("Popup was blocked. Please allow popups for this site and try again.");
      }
      throw err;
    }
  };

  const signinWithEmailPassword = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Sync customer to Firestore
      if (userCredential.user.email) {
        try {
          await fetch("/api/customer/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: userCredential.user.email,
              name: userCredential.user.displayName || userCredential.user.email.split("@")[0],
              phone: userCredential.user.phoneNumber || undefined,
              userId: userCredential.user.uid,
            }),
          }).catch(() => {});
        } catch (err) {
          // Silently fail
        }
      }
    } catch (err: any) {
      // Handle Firebase auth errors
      if (err?.code === "auth/user-not-found") {
        throw new Error("No account found with this email address.");
      }
      if (err?.code === "auth/wrong-password") {
        throw new Error("Incorrect password. Please try again.");
      }
      if (err?.code === "auth/invalid-email") {
        throw new Error("Invalid email address.");
      }
      if (err?.code === "auth/user-disabled") {
        throw new Error("This account has been disabled.");
      }
      if (err?.code === "auth/too-many-requests") {
        throw new Error("Too many failed attempts. Please try again later.");
      }
      throw new Error(err?.message || "Sign in failed. Please try again.");
    }
  };

  const signupWithEmailPassword = async (email: string, password: string, name: string, phone?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with name
      if (name) {
        await updateProfile(userCredential.user, { displayName: name });
      }
      
      // Send email verification
      await sendEmailVerification(userCredential.user).catch(() => {});
      
      // Sync customer to Firestore (including phone if provided)
      try {
        await fetch("/api/customer/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userCredential.user.email,
            name: name || userCredential.user.email?.split("@")[0] || "",
            phone: phone || userCredential.user.phoneNumber || undefined,
            userId: userCredential.user.uid,
          }),
        }).catch(() => {});
      } catch (err) {
        // Silently fail
      }
    } catch (err: any) {
      // Handle Firebase auth errors
      if (err?.code === "auth/email-already-in-use") {
        throw new Error("An account with this email already exists.");
      }
      if (err?.code === "auth/invalid-email") {
        throw new Error("Invalid email address.");
      }
      if (err?.code === "auth/weak-password") {
        throw new Error("Password is too weak. Please use at least 6 characters.");
      }
      throw new Error(err?.message || "Registration failed. Please try again.");
    }
  };

  const signinAsAdmin = async () => {
    // Prevent multiple simultaneous popup requests
    if (isPopupOpen) {
      throw new Error("A sign-in popup is already open. Please wait or close it and try again.");
    }
    
    setIsPopupOpen(true);
    const provider = new GoogleAuthProvider();
    // Set additional OAuth parameters to prevent popup blocking
    provider.setCustomParameters({
      prompt: "select_account",
    });
    let result;
    try {
      result = await signInWithPopup(auth, provider);
      // Reset immediately on success
      setIsPopupOpen(false);
    } catch (err: any) {
      setIsPopupOpen(false);
      // Handle cancelled popup gracefully
      if (err?.code === "auth/cancelled-popup-request") {
        throw new Error("Sign-in was interrupted. Please try again.");
      }
      if (err?.code === "auth/popup-closed-by-user") {
        throw new Error("Sign-in cancelled. Please try again if you want to continue.");
      }
      if (err?.code === "auth/popup-blocked") {
        throw new Error("Popup was blocked. Please allow popups for this site and try again.");
      }
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
        window.location.href = "/login?mode=admin";
      } else {
        window.location.href = "/";
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      signinWithGoogle, 
      signinWithEmailPassword,
      signupWithEmailPassword,
      signinAsAdmin, 
      signout, 
      adminInfo 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
