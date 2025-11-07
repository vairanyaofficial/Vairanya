// app/admin/add-worker-util/page.tsx
// Utility page to add a specific worker (one-time use)
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getAdminSession, isSuperUser } from "@/lib/admin-auth";
import { UserPlus, CheckCircle, XCircle } from "lucide-react";

export default function AddWorkerUtilPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [formData, setFormData] = useState({
    uid: "XA6zxFhsnHg6A3P9eZxGIwLOLn43",
    name: "",
    email: "",
    role: "worker",
  });

  // Check if user is superuser
  React.useEffect(() => {
    const session = getAdminSession();
    if (!session || !isSuperUser()) {
      router.replace("/admin/login");
    }
  }, [router]);

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const session = getAdminSession();
      if (!session) {
        setResult({ success: false, message: "Session expired. Please login again." });
        setIsLoading(false);
        return;
      }

      if (!formData.name.trim()) {
        setResult({ success: false, message: "Name is required" });
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/admin/workers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": session.username,
        },
        body: JSON.stringify({
          uid: formData.uid.trim(),
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResult({
          success: true,
          message: `Worker added successfully! They can now login at /admin/login`,
        });
        setFormData({ ...formData, name: "", email: "" });
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to add worker",
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err?.message || "Failed to add worker",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <UserPlus className="h-8 w-8 text-[#D4AF37]" />
            <h1 className="font-serif text-3xl">Add Worker</h1>
          </div>

          <form onSubmit={handleAddWorker} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Firebase UID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.uid}
                onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                placeholder="Enter Firebase UID"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get this from Firebase Authentication console
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                placeholder="Enter worker name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                placeholder="Enter worker email (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              >
                <option value="worker">Worker</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>

            {result && (
              <div
                className={`p-4 rounded-md flex items-center gap-2 ${
                  result.success
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {result.success ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span>{result.message}</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#D4AF37] hover:bg-[#C19B2E]"
              >
                {isLoading ? "Adding..." : "Add Worker"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/workers")}
              >
                Go to Workers Page
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

