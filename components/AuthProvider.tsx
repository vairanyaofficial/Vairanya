// components/AuthProvider.tsx
"use client";

import React, { createContext, useContext } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type AdminInfo = { username: string; role: string; name?: string } | null;

type AuthContextType = {
  user: {
    id: string;
    email: string | null | undefined;
    name: string | null | undefined;
    image: string | null | undefined;
    role?: string;
    adminName?: string;
    uid?: string;
  } | null;
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
  const { data: session, status } = useSession();
  const router = useRouter();

  // Get admin info from session or localStorage
  const adminInfo: AdminInfo = session?.user?.role
    ? {
        username: session.user.uid || session.user.id,
        role: session.user.role,
        name: session.user.adminName || session.user.name || undefined,
      }
    : getAdminSessionLocal();

  // Update localStorage when admin session changes
  React.useEffect(() => {
    if (session?.user?.role) {
      const adminData: AdminInfo = {
        username: session.user.uid || session.user.id,
        role: session.user.role,
        name: session.user.adminName || session.user.name || undefined,
      };
      setAdminSessionLocal(adminData);
    } else if (!session) {
      setAdminSessionLocal(null);
    }
  }, [session]);

  const signinWithGoogle = async () => {
    try {
      await signIn("google", {
        callbackUrl: "/account",
        redirect: true,
      });
    } catch (err: any) {
      throw new Error(err?.message || "Sign in failed. Please try again.");
    }
  };

  const signinWithEmailPassword = async (email: string, password: string) => {
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          throw new Error("Invalid email or password.");
        }
        throw new Error(result.error);
      }

      if (result?.ok) {
        router.push("/account");
        router.refresh();
      }
    } catch (err: any) {
      throw new Error(err?.message || "Sign in failed. Please try again.");
    }
  };

  const signupWithEmailPassword = async (email: string, password: string, name: string, phone?: string) => {
    try {
      // Hash password and create user in MongoDB
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Registration failed.");
      }

      // After registration, sign in
      await signinWithEmailPassword(email, password);
    } catch (err: any) {
      throw new Error(err?.message || "Registration failed. Please try again.");
    }
  };

  const signinAsAdmin = async () => {
    try {
      // Clear any existing admin session first
      setAdminSessionLocal(null);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem("admin_session");
          localStorage.removeItem("va_admin_session_local");
        } catch (err) {
          // Ignore errors
        }
      }

      // Sign in with Google - admin check will happen on login page
      // Just use regular Google sign-in, the login page will handle admin verification
      const result = await signIn("google", {
        callbackUrl: "/login",
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error || "Google sign-in failed");
      }

      // If we get a URL, redirect to it (OAuth flow)
      if (result?.url) {
        if (typeof window !== "undefined") {
          window.location.href = result.url;
          return;
        }
      }
      
      // If result.ok is true, the user might already be signed in
      // In this case, reload the page to refresh the session
      if (result?.ok) {
        if (typeof window !== "undefined") {
          window.location.reload();
          return;
        }
      }
      
      // If neither URL nor ok, something went wrong
      throw new Error("Google sign-in failed. Please try again.");
    } catch (err: any) {
      throw new Error(err?.message || "Admin sign in failed. Please try again.");
    }
  };

  const signout = async () => {
    const isAdmin = adminInfo !== null;

    // Clear admin session
    setAdminSessionLocal(null);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("admin_session");
        localStorage.removeItem("va_admin_session_local");
        localStorage.removeItem("admin_session");
        sessionStorage.removeItem("va_admin_session_local");
      } catch {
        /* ignore */
      }
    }

    // Call server logout
    try {
      await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    } catch {
      /* ignore */
    }

    // Sign out from NextAuth
    await signOut({
      redirect: false,
    });

    // Small delay to ensure cleanup
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Redirect
    if (typeof window !== "undefined") {
      if (isAdmin) {
        window.location.href = "/login";
      } else {
        window.location.href = "/";
      }
    }
  };

  const user = session?.user
    ? {
        id: session.user.id || session.user.email || "",
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        role: session.user.role,
        adminName: session.user.adminName,
        uid: session.user.uid,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        signinWithGoogle,
        signinWithEmailPassword,
        signupWithEmailPassword,
        signinAsAdmin,
        signout,
        adminInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
