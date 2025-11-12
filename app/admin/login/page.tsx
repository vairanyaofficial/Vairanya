"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * This page has been removed - redirect to main login page
 * Admin/organizer login is now handled on the main /login page
 */
export default function OrganizersLoginPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Immediately redirect to main login page
    router.replace("/login");
  }, [router]);
  
  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}
