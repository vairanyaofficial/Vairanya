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
      // Reload user to get latest profile data including photoURL
      if (u) {
        try {
          // Reload user to ensure we have the latest photoURL and displayName
          await u.reload();
          // Get fresh user data after reload
          setUser(u);
        } catch (reloadErr) {
          // If reload fails, still set the user (might be a network issue)
          setUser(u);
        }
      } else {
        setUser(null);
      }
      
      // Sync customer to MongoDB when user signs in (only for regular customers, not admins)
      if (u && u.email && !adminInfo) {
        try {
          console.log(`[AuthProvider] Syncing customer to MongoDB: ${u.email}`);
          const response = await fetch("/api/customer/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: u.email,
              name: u.displayName || u.email.split("@")[0],
              phone: u.phoneNumber || undefined,
              userId: u.uid,
              photoURL: u.photoURL || undefined,
            }),
          });
          
          const data = await response.json().catch(() => ({}));
          if (response.ok && data.success) {
            console.log(`[AuthProvider] Customer synced successfully: ${u.email}`);
          } else {
            console.warn(`[AuthProvider] Customer sync warning:`, data.error || data.message || "Unknown error");
          }
        } catch (err: any) {
          // Silently fail - don't block auth flow, but log for debugging
          console.warn(`[AuthProvider] Failed to sync customer (non-blocking):`, err?.message || err);
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
      // Request profile and email scopes to get photoURL
      provider.addScope('profile');
      provider.addScope('email');
      // Set additional OAuth parameters to prevent popup blocking
      provider.setCustomParameters({
        prompt: "select_account",
      });
      const result = await signInWithPopup(auth, provider);
      
      // Reload user to ensure we get the latest photoURL
      if (result.user) {
        try {
          await result.user.reload();
        } catch (reloadErr) {
          // Reload failed, but continue - photoURL might still be available
          console.warn("Failed to reload user after Google sign-in:", reloadErr);
        }
      }
      
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
      
      // Sync customer to MongoDB on email/password sign-in
      // Note: onAuthStateChanged will also trigger sync, but this ensures it happens immediately
      if (userCredential.user.email) {
        try {
          console.log(`[AuthProvider] Syncing customer on email sign-in: ${userCredential.user.email}`);
          const response = await fetch("/api/customer/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: userCredential.user.email,
              name: userCredential.user.displayName || userCredential.user.email.split("@")[0],
              phone: userCredential.user.phoneNumber || undefined,
              userId: userCredential.user.uid,
              photoURL: userCredential.user.photoURL || undefined,
            }),
          });
          
          const data = await response.json().catch(() => ({}));
          if (response.ok && data.success) {
            console.log(`[AuthProvider] Customer synced on email sign-in: ${userCredential.user.email}`);
          }
        } catch (err: any) {
          // Silently fail - don't block sign-in
          console.warn(`[AuthProvider] Failed to sync customer on email sign-in (non-blocking):`, err?.message || err);
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
      
      // Sync customer to MongoDB (including phone if provided)
      if (userCredential.user.email) {
        try {
          console.log(`[AuthProvider] Syncing new customer to MongoDB: ${userCredential.user.email}`);
          const response = await fetch("/api/customer/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: userCredential.user.email,
              name: name || userCredential.user.email?.split("@")[0] || "",
              phone: phone || userCredential.user.phoneNumber || undefined,
              userId: userCredential.user.uid,
              photoURL: userCredential.user.photoURL || undefined,
            }),
          });
          
          const data = await response.json().catch(() => ({}));
          if (response.ok && data.success) {
            console.log(`[AuthProvider] New customer synced successfully: ${userCredential.user.email}`);
          } else {
            console.warn(`[AuthProvider] Customer sync warning during registration:`, data.error || data.message);
          }
        } catch (err: any) {
          // Silently fail - don't block registration
          console.warn(`[AuthProvider] Failed to sync customer during registration (non-blocking):`, err?.message || err);
        }
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
    
    // Clear any existing admin session first to ensure fresh login
    setAdminInfo(null);
    setAdminSessionLocal(null);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("admin_session");
        localStorage.removeItem("va_admin_session_local");
      } catch (err) {
        // Ignore errors
      }
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

    // get idToken - force refresh to get latest token
    let idToken: string | null = null;
    try {
      idToken = await result.user.getIdToken(true); // Force refresh token
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
      // Preserve the detailed error message from the server
      const errorMsg = body?.error || body?.message || `Admin verification failed (status ${res.status})`;
      throw new Error(errorMsg);
    }

    // Extract user info from response
    if (!body?.user) {
      await firebaseSignOut(auth).catch(() => {});
      throw new Error("Admin verification failed: no user data received");
    }

    // Log the role for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.log("Admin login successful:", {
        username: body.user.username,
        role: body.user.role,
        name: body.user.name,
      });
    }

    const userInfo: AdminInfo = {
      username: body.user.username,
      role: body.user.role, // This should be "superuser", "admin", or "worker"
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
        console.error("Failed to set sessionStorage:", err);
      }
    }
  };

  const signout = async () => {
    // Clear admin session FIRST before any redirects
    const isAdmin = adminInfo !== null;
    
    // Clear admin session if exists - do this aggressively
    setAdminInfo(null);
    setAdminSessionLocal(null);
    
    // Also clear ALL session storage for admin-auth.ts compatibility
    if (typeof window !== "undefined") {
      try {
        // Clear sessionStorage
        sessionStorage.removeItem("admin_session");
        // Clear localStorage
        localStorage.removeItem("va_admin_session_local");
        // Also clear any other potential admin session keys
        localStorage.removeItem("admin_session");
        sessionStorage.removeItem("va_admin_session_local");
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
    
    // Small delay to ensure all cleanup is done
    await new Promise(resolve => setTimeout(resolve, 100));
    
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
