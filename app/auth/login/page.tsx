"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { getAdminSession, setAdminSession } from "@/lib/admin-auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
  const { signinWithGoogle, user, adminInfo } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  // Check if user is a worker/admin after login
  useEffect(() => {
    if (!user || checkingAdmin) return;
    
    // Check if user is already an admin/worker
    const session = getAdminSession();
    if (session) {
      // User is an admin/worker, redirect to appropriate dashboard
      const role = session.role;
      if (role === "worker") {
        router.replace("/worker/dashboard");
      } else {
        router.replace("/admin");
      }
      return;
    }

    // Check if they might be a worker/admin by verifying with admin API
    const verifyWorker = async () => {
      setCheckingAdmin(true);
      let isAdminOrWorker = false;
      try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            // User is registered as admin/worker - establish session directly
            isAdminOrWorker = true;
            
            // Set admin session using proper function
            const adminUser = {
              username: data.user.username,
              role: data.user.role as "superuser" | "worker",
              name: data.user.name || data.user.username,
              password: "", // Not needed for session
            };
            
            // Set session in sessionStorage (for admin-auth.ts)
            setAdminSession(adminUser);
            
            // Also set in localStorage (for AuthProvider)
            if (typeof window !== "undefined") {
              localStorage.setItem("va_admin_session_local", JSON.stringify({
                username: data.user.username,
                role: data.user.role,
                name: data.user.name,
              }));
            }
            
            // Force page reload to ensure AuthProvider picks up the session
            // Redirect based on role
            if (data.user.role === "worker") {
              window.location.href = "/worker/dashboard";
            } else {
              window.location.href = "/admin";
            }
            return;
          }
        }
      } catch (err) {
        // If check fails, treat as regular customer
      } finally {
        setCheckingAdmin(false);
        // If not a worker/admin, proceed with normal customer redirect
        if (!isAdminOrWorker) {
          router.replace(callbackUrl);
        }
      }
    };

    verifyWorker();
  }, [user, router, callbackUrl]);

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signinWithGoogle();
      // Don't redirect here - let the useEffect handle it after checking admin status
    } catch (err: any) {
      setError(err?.message || "Sign in failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-md mx-auto px-6 py-16">
        <h1 className="font-serif text-3xl mb-6 text-center">Sign In</h1>
        <div className="bg-white rounded-lg border p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</div>
          )}
          <Button 
            onClick={handleGoogleSignIn} 
            disabled={loading} 
            className="w-full bg-[#D4AF37] hover:bg-[#C19B2E]"
          >
            {loading ? "Signing in..." : "Sign in with Google"}
          </Button>
          <p className="text-xs text-center text-gray-500 mt-4">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
        <p className="text-sm text-center text-gray-600 mt-4">
          Admin? <Link href="/admin/login" className="text-[#D4AF37] hover:underline">Admin Login</Link>
        </p>
      </div>
    </main>
  );
}


