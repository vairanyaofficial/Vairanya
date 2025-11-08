"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  isAdminAuthenticated,
  clearAdminSession,
  getAdminSession,
} from "@/lib/admin-auth";
import { Home, LogOut, User, ClipboardList, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<ReturnType<typeof getAdminSession>>(null);
  const { theme, toggleTheme } = useTheme();

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
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-black">
      {/* Worker Header */}
      <header className="bg-[#2E2E2E] dark:bg-[#0a0a0a] text-white border-b border-gray-700 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/worker/dashboard" className="font-serif text-xl">
                Vairanya Worker
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/worker/dashboard"
                  className={`text-sm hover:text-[#D4AF37] transition-colors flex items-center gap-2 text-gray-300 dark:text-gray-400 ${
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
                  <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="hidden sm:inline text-gray-300 dark:text-gray-400">
                    {session.name || session.username}
                  </span>
                </div>
              )}
              <Button
                onClick={toggleTheme}
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0 border-gray-600 dark:border-white/20 bg-transparent text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-white/10 hover:text-white dark:hover:text-white"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <Link
                href="/"
                className="text-sm hover:text-[#D4AF37] transition-colors flex items-center gap-2 text-gray-300 dark:text-gray-400"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">View Site</span>
              </Link>
              <Button
                onClick={handleLogout}
                variant="secondary"
                size="sm"
                className="border-gray-600 dark:border-white/20 bg-transparent text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-white/10 hover:text-white dark:hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2"/>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Worker Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 text-gray-900 dark:text-white">{children}</main>
    </div>
  );
}

