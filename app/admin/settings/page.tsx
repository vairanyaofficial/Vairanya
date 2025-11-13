"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getAdminSession, isAdminAuthenticated } from "@/lib/admin-auth";
import { Image as ImageIcon, Save, X, Upload } from "lucide-react";
import { uploadToImageKit } from "@/lib/imagekit";
import type { SiteSettings } from "@/lib/settings-types";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [formData, setFormData] = useState({
    site_icon: "",
    site_logo: "",
  });

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace("/login");
      return;
    }
    loadSettings();
  }, [router]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const session = getAdminSession();
      const response = await fetch("/api/admin/settings", {
        headers: {
          "x-admin-username": session?.username || "",
        },
      });
      const data = await response.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        setFormData({
          site_icon: data.settings.site_icon || "/images/logo-ivory.png",
          site_logo: data.settings.site_logo || "/images/logo-ivory.png",
        });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 10MB limit. Please choose a smaller file.`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    setUploadingIcon(true);
    try {
      const session = getAdminSession();
      if (!session) {
        throw new Error("Admin session required");
      }

      // Upload to "settings" folder
      const url = await uploadToImageKit(file, file.name, undefined, undefined, session, "settings");
      setFormData({ ...formData, site_icon: url });
    } catch (error) {
      alert("Failed to upload icon");
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 10MB limit. Please choose a smaller file.`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    setUploadingLogo(true);
    try {
      const session = getAdminSession();
      if (!session) {
        throw new Error("Admin session required");
      }

      // Upload to "settings" folder
      const url = await uploadToImageKit(file, file.name, undefined, undefined, session, "settings");
      setFormData({ ...formData, site_logo: url });
    } catch (error) {
      alert("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const session = getAdminSession();
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": session?.username || "",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        alert("Settings updated successfully!");
        loadSettings();
      } else {
        alert(data.error || "Failed to update settings");
      }
    } catch (error: any) {
      alert(error.message || "Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-3 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="font-serif text-xl sm:text-2xl md:text-3xl mb-1 sm:mb-2 text-gray-900 dark:text-white">
            Site Settings
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Manage site icon and logo
          </p>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border dark:border-white/10 p-3 sm:p-4 md:p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Site Icon */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Site Icon (Favicon) <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                This icon appears in browser tabs and bookmarks. Recommended size: 32x32px or 64x64px (PNG/ICO).
              </p>
              {formData.site_icon ? (
                <div className="relative">
                  <div className="flex items-center gap-4 mb-3">
                    <img
                      src={formData.site_icon}
                      alt="Site Icon"
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-2"
                    />
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-all">
                        {formData.site_icon}
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIconUpload}
                    disabled={uploadingIcon}
                    className="hidden"
                    id="icon-upload"
                  />
                  <label
                    htmlFor="icon-upload"
                    className="cursor-pointer inline-flex items-center gap-2 bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {uploadingIcon ? "Uploading..." : "Change Icon"}
                  </label>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-lg p-4 sm:p-6 md:p-8 text-center bg-gray-50 dark:bg-[#0a0a0a]">
                  <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIconUpload}
                    disabled={uploadingIcon}
                    className="hidden"
                    id="icon-upload"
                  />
                  <label
                    htmlFor="icon-upload"
                    className="cursor-pointer inline-block bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded transition-colors"
                  >
                    {uploadingIcon ? "Uploading..." : "Upload Icon"}
                  </label>
                </div>
              )}
            </div>

            {/* Site Logo */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Site Logo
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Main logo for the website. Recommended size: 200x60px or larger (PNG with transparent background).
              </p>
              {formData.site_logo ? (
                <div className="relative">
                  <div className="flex items-center gap-4 mb-3">
                    <img
                      src={formData.site_logo}
                      alt="Site Logo"
                      className="h-16 sm:h-20 object-contain rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-2"
                    />
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-all">
                        {formData.site_logo}
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer inline-flex items-center gap-2 bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {uploadingLogo ? "Uploading..." : "Change Logo"}
                  </label>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-lg p-4 sm:p-6 md:p-8 text-center bg-gray-50 dark:bg-[#0a0a0a]">
                  <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer inline-block bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded transition-colors"
                  >
                    {uploadingLogo ? "Uploading..." : "Upload Logo"}
                  </label>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
              >
                <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

