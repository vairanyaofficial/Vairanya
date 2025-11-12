// app/admin/bootstrap/page.tsx
// Bootstrap page to add the first admin user
// Only accessible when no admins exist in the database

"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export default function BootstrapPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [adminCount, setAdminCount] = useState(0);

  // Check if bootstrap is available
  useEffect(() => {
    const checkBootstrap = async () => {
      try {
        const response = await fetch("/api/admin/bootstrap");
        const data = await response.json();
        setAvailable(data.available || false);
        setAdminCount(data.adminCount || 0);
      } catch (err: any) {
        setError("Failed to check bootstrap status");
      } finally {
        setChecking(false);
      }
    };
    checkBootstrap();
  }, []);

  const handleBootstrap = async () => {
    if (!session?.user?.email) {
      setError("Please sign in first");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/admin/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session.user.email,
          name: session.user.name || session.user.email?.split("@")[0] || "Admin",
          role: "superadmin",
          uid: session.user.id || session.user.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create admin");
      }

      setSuccess(true);
      // Redirect to admin login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to create admin");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || checking) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37] mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
          <p className="text-gray-600 mb-6">
            Please sign in with Google first to create your admin account.
          </p>
          <Button
            onClick={() => router.push("/login")}
            className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (!available) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Bootstrap Not Available</h1>
          <p className="text-gray-600 mb-4">
            Admins already exist in the database ({adminCount} admin{adminCount !== 1 ? "s" : ""}).
          </p>
          <p className="text-sm text-gray-500 mb-6">
            To add new admins, please use the admin panel or contact a superadmin.
          </p>
          <Button
            onClick={() => router.push("/login")}
            className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white"
          >
            Go to Admin Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D4AF37]/10 mb-4">
            <Shield className="h-8 w-8 text-[#D4AF37]" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Create First Admin</h1>
          <p className="text-gray-600 text-sm">
            No admins exist in the database. Create your first admin account.
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <p className="font-semibold">Admin created successfully!</p>
            </div>
            <p className="text-sm text-green-700 mt-2">
              Redirecting to admin login...
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p className="font-semibold">Error</p>
            </div>
            <p className="text-sm text-red-700 mt-2">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-2">Admin Details:</p>
            <div className="space-y-1 text-sm text-blue-800">
              <p><strong>Email:</strong> {session?.user?.email}</p>
              <p><strong>Name:</strong> {session?.user?.name || session?.user?.email?.split("@")[0] || "Admin"}</p>
              <p><strong>Role:</strong> superadmin</p>
            </div>
          </div>

          <Button
            onClick={handleBootstrap}
            disabled={loading || success}
            className="w-full bg-[#D4AF37] hover:bg-[#C19B2E] text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating Admin...
              </>
            ) : success ? (
              "Admin Created!"
            ) : (
              "Create Admin Account"
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            This will create a superadmin account with full access to the admin panel.
          </p>
        </div>

        <div className="mt-6 pt-6 border-t">
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full"
          >
            Back to Website
          </Button>
        </div>
      </div>
    </div>
  );
}

