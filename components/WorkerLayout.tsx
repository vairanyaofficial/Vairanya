"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  isAdminAuthenticated,
  clearAdminSession,
  getAdminSession,
} from "@/lib/admin-auth";
import { Home, LogOut, User, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<ReturnType<typeof getAdminSession>>(null);

  useEffect(() => {
    setMounted(true);
    const currentSession = getAdminSession();
    
    // Check if user is authenticated and is a worker
    if (!isAdminAuthenticated() && !(pathname === "/login" && searchParams?.get("mode") === "admin")) {
      router.push("/login?mode=admin");
    } else if (currentSession && currentSession.role !== "worker" && pathname?.startsWith("/worker")) {
      // If not a worker, redirect to admin dashboard
      router.push("/admin");
    } else {
      setSession(currentSession);
    }
  }, [router, pathname]);

  const handleLogout = () => {
    clearAdminSession();
    router.push("/login?mode=admin");
  };

  if (!mounted) {
    return null;
  }

  if (pathname === "/login" && searchParams?.get("mode") === "admin") {
    return <>{children}</>;
  }

  if (!isAdminAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Worker Header */}
      <header className="bg-[#2E2E2E] text-white border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/worker/dashboard" className="font-serif text-xl">
                Vairanya Worker
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/worker/dashboard"
                  className={`text-sm hover:text-[#D4AF37] transition-colors flex items-center gap-2 ${
                    pathname === "/worker/dashboard" ? "text-[#D4AF37]" : ""
                  }`}
                >
                  <ClipboardList className="h-4 w-4" />
                  My Tasks
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              {session && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="hidden sm:inline text-gray-300">
                    {session.name || session.username}
                  </span>
                </div>
              )}
              <Link
                href="/"
                className="text-sm hover:text-[#D4AF37] transition-colors flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">View Site</span>
              </Link>
              <Button
                onClick={handleLogout}
                variant="secondary"
                size="sm"
                className="border-gray-600 text-white hover:bg-[#f7f1e0] hover:text-black text-[#D4AF37]"
              >
                <LogOut className="h-4 w-4 mr-2 text-[#D4AF37] hover:text-black"/>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Worker Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}

