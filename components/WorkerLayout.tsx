"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  isAdminAuthenticated,
  clearAdminSession,
  getAdminSession,
} from "@/lib/admin-auth";
import { Home, LogOut, User, ClipboardList, Moon, Sun, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<ReturnType<typeof getAdminSession>>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMobileMenu]);

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
      <header className="bg-[#2E2E2E] dark:bg-[#0a0a0a] text-white border-b border-gray-700 dark:border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <Link href="/worker/dashboard" className="font-serif text-lg font-semibold text-[#D4AF37] hover:text-[#C19B2E] transition-colors">
                Vairanya Worker
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                <Link
                  href="/worker/dashboard"
                  className={`text-sm hover:text-[#D4AF37] transition-colors flex items-center gap-2 text-gray-300 dark:text-gray-400 ${
                    pathname === "/worker/dashboard" ? "text-[#D4AF37]" : ""
                  }`}
                >
                  <ClipboardList className="h-4 w-4" />
                  Dashboard
                </Link>
              </nav>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-1.5 text-gray-300 dark:text-gray-400 hover:text-[#D4AF37] hover:bg-gray-700 dark:hover:bg-white/10 rounded transition-colors"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {session && (
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-300 min-w-0">
                  <User className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <div className="truncate max-w-[120px]" title={session.name || session.username}>
                    {session.name || session.username}
                  </div>
                </div>
              )}
              <Button
                onClick={toggleTheme}
                variant="secondary"
                size="sm"
                className="h-7 w-7 p-0 border-gray-600 dark:border-white/20 bg-transparent text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-white/10 hover:text-white dark:hover:text-white"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? (
                  <Sun className="h-3.5 w-3.5" />
                ) : (
                  <Moon className="h-3.5 w-3.5" />
                )}
              </Button>
              <Link
                href="/"
                className="p-1.5 text-gray-300 hover:text-[#D4AF37] hover:bg-gray-700 dark:hover:bg-white/10 rounded transition-colors"
                title="View Site"
              >
                <Home className="h-4 w-4" />
              </Link>
              <Button
                onClick={handleLogout}
                variant="secondary"
                size="sm"
                className="h-7 px-2 text-xs border-gray-600 dark:border-white/20 bg-transparent text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-white/10 hover:text-white dark:hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5 sm:mr-1.5"/>
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
          {/* Mobile Navigation - Slide-in Menu */}
          {showMobileMenu && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[60] md:hidden"
                onClick={() => setShowMobileMenu(false)}
              />
              {/* Slide-in Menu */}
              <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-[#2E2E2E] dark:bg-[#0a0a0a] z-[70] md:hidden shadow-2xl border-l border-gray-700 dark:border-white/10">
                <div className="flex flex-col h-full">
                  {/* Mobile Menu Header */}
                  <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700 dark:border-white/10">
                    <h2 className="text-lg font-serif font-semibold text-[#D4AF37]">Menu</h2>
                    <button
                      onClick={() => setShowMobileMenu(false)}
                      className="p-2 text-gray-300 dark:text-gray-400 hover:text-white rounded-lg"
                      aria-label="Close menu"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  {/* Mobile Navigation Links */}
                  <nav className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <Link 
                        href="/worker/dashboard" 
                        onClick={() => setShowMobileMenu(false)} 
                        className={`text-sm px-3 py-2.5 rounded ${pathname === "/worker/dashboard" ? "text-[#D4AF37] bg-gray-700 dark:bg-white/10" : "text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-white/10"}`}
                      >
                        Dashboard
                      </Link>
                    </div>
                  </nav>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Worker Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 text-gray-900 dark:text-white">{children}</main>
    </div>
  );
}

