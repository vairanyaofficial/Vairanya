"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Lock, User } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { getAdminSession } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const { signinAsAdmin, adminInfo, user } = useAuth();

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Redirect logic - only redirect if admin is actually logged in
  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected) return;
    
    // Don't redirect if we're in the middle of logging in
    if (isLoading) return;
    
    // Only redirect if admin is actually authenticated (check both adminInfo and session)
    const session = getAdminSession();
    if (adminInfo && session) {
      // Admin is logged in, redirect to appropriate dashboard
      const role = session.role || adminInfo.role;
      let redirectPath = "/admin";
      if (role === "worker") {
        redirectPath = "/worker/dashboard";
      }
      setHasRedirected(true);
      // Use window.location for hard redirect
      window.location.href = redirectPath;
      return;
    }
    
    // If user is logged in as regular user (not admin), redirect to home
    // Only do this if we're certain they're not an admin (no session and no adminInfo)
    if (user && !adminInfo && !session) {
      setHasRedirected(true);
      window.location.href = "/";
      return;
    }
  }, [user, adminInfo, router, isLoading, hasRedirected]);

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signinAsAdmin();
      
      // Wait a bit for session to be set in both localStorage and sessionStorage
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check user role and redirect accordingly
      // Try multiple times to ensure session is set
      let session = getAdminSession();
      let attempts = 0;
      while (!session && attempts < 5) {
        await new Promise(resolve => setTimeout(resolve, 100));
        session = getAdminSession();
        attempts++;
      }
      
      if (!session) {
        throw new Error("Failed to establish admin session. Please try again.");
      }
      
      const role = session.role;
      
      let redirectPath = "/admin";
      if (role === "worker") {
        redirectPath = "/worker/dashboard";
      } else if (role === "admin" || role === "superuser") {
        redirectPath = "/admin"; // Both admin and superuser go to admin panel
      }
      
      // Force redirect using window.location to ensure clean navigation
      if (typeof window !== "undefined") {
        window.location.href = redirectPath;
      } else {
        router.replace(redirectPath);
      }
    } catch (err: any) {
      setError(err?.message || "Sign in failed. Make sure your Google account is registered as admin.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D4AF37]/10 mb-4">
            <Lock className="h-8 w-8 text-[#D4AF37]" />
          </div>
          <h1 className="font-serif text-3xl mb-2">Admin Login</h1>
          <p className="text-gray-600 text-sm">Vairanya Admin Panel</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-6" aria-live="polite">
          <div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-800 font-medium">
                🔒 Secure Access Only
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Only pre-approved admins and workers can access this panel. Your account must be manually added by a superadmin.
              </p>
            </div>
            <label className="block text-sm font-medium mb-2">Sign in with Google</label>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => handleSignIn()}
                className="flex-1 bg-[#D4AF37] hover:bg-[#C19B2E]"
                disabled={isLoading}
              >
                {isLoading ? "Verifying access..." : "Sign in with Google"}
              </Button>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              <strong>Note:</strong> Only accounts that have been manually approved and added to the system by a superadmin will be granted access.
            </div>
          </div>

          {/*
            Keeping the username/password fields visually for fallback/legacy only.
            They are non-functional now — removed verify behavior.
          */}
          <div className="pt-4 border-t">
            <div className="text-sm text-gray-500">Legacy login (disabled)</div>

            <div className="mt-3">
              <label className="block text-sm font-medium mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  disabled
                  className="w-full rounded border border-gray-300 px-4 pl-10 py-3 bg-gray-50 text-gray-400"
                  placeholder="Legacy username (disabled)"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  disabled
                  className="w-full rounded border border-gray-300 px-4 pl-10 py-3 bg-gray-50 text-gray-400"
                  placeholder="Legacy password (disabled)"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              <div className="font-semibold mb-1">Access Denied</div>
              <div>{error}</div>
              <div className="mt-2 text-xs text-red-600">
                If you believe you should have access, please contact a superadmin to add your account to the system.
              </div>
            </div>
          )}

          <div className="mt-4 text-center">
            <a
              href="/"
              className="text-sm text-gray-600 hover:text-[#D4AF37] transition-colors"
            >
              ← Back to Website
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
