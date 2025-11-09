"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  isAdminAuthenticated,
  clearAdminSession,
  getAdminSession,
  isSuperUser,
  isSuperAdmin,
  canManageWorkers,
  canCreateProduct,
} from "@/lib/admin-auth";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { Package, Home, LogOut, Shield, User, Users, Tag, Star, Menu, Moon, Sun, X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<ReturnType<typeof getAdminSession>>(null);
  const { user, adminInfo, signout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
    
    // Skip all redirect logic if we're on login page
    if (pathname === "/login" && searchParams.get("mode") === "admin") {
      return;
    }
    
    // Don't run redirect logic if already redirected
    if (hasRedirected) {
      return;
    }
    
    // Get current session
    const currentSession = getAdminSession();
    const isAdminAuth = isAdminAuthenticated();
    
    // STRICT: Block workers from accessing ANY admin routes
    if (isAdminAuth && currentSession) {
      // If user is a worker, immediately redirect to worker dashboard
      if (currentSession.role === "worker") {
        setHasRedirected(true);
        window.location.href = "/worker/dashboard";
        return;
      }
      
      // Allow both superuser and admin to access admin panel
      if (currentSession.role === "superuser" || currentSession.role === "admin") {
        setSession(currentSession);
        return;
      }
    }
    
    // If user is signed in with Google but admin session not set, try to verify and establish session
    if (user && !adminInfo && !currentSession && pathname?.startsWith("/admin")) {
      const verifyAndEstablishSession = async () => {
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
              // User is registered as admin - establish session
              const adminUser = {
                username: data.user.username,
                role: data.user.role as "superuser" | "admin" | "worker",
                name: data.user.name || data.user.username,
                password: "",
              };
              
              // Set session
              if (typeof window !== "undefined") {
                sessionStorage.setItem("admin_session", JSON.stringify({
                  username: adminUser.username,
                  role: adminUser.role,
                  name: adminUser.name,
                }));
                localStorage.setItem("va_admin_session_local", JSON.stringify({
                  username: data.user.username,
                  role: data.user.role,
                  name: data.user.name,
                }));
              }
              
              // If worker, redirect to worker dashboard
              if (data.user.role === "worker") {
                setHasRedirected(true);
                window.location.href = "/worker/dashboard";
                return;
              }
              
              // If superuser or admin, allow access - reload to pick up session
              if (data.user.role === "superuser" || data.user.role === "admin") {
                window.location.reload();
                return;
              }
            }
          }
        } catch (err) {
          // If verification fails, treat as customer
        }
        
        // If not an admin, redirect to home
        const checkTimer = setTimeout(() => {
          const retrySession = getAdminSession();
          if (!retrySession) {
            setHasRedirected(true);
            window.location.href = "/";
          }
        }, 300);
        return () => clearTimeout(checkTimer);
      };
      
      verifyAndEstablishSession();
      return;
    }
    
    // If no user signed in, redirect to login
    if (!user && !isAdminAuth) {
      setHasRedirected(true);
      window.location.href = "/login?mode=admin";
      return;
    }
    
    // Don't redirect here - let the page handle authentication redirects
    // This prevents conflicts with page-level redirect logic
  }, [router, pathname, user, adminInfo, hasRedirected]);

  const handleLogout = () => {
    // Use AuthProvider's signout to ensure proper cleanup
    signout();
  };

  if (!mounted) {
    return null;
  }

  // Always allow login page to render without layout
  if (pathname === "/login" && searchParams.get("mode") === "admin") {
    return <>{children}</>;
  }

  // STRICT: Block workers from rendering admin layout
  const currentSession = getAdminSession();
  if (currentSession && currentSession.role === "worker") {
    // Don't render anything, redirect will happen in useEffect
    return null;
  }

  // Allow both superuser and admin to see admin layout (but not workers)
  if (!isAdminAuthenticated() || !currentSession) {
    return null;
  }
  if (currentSession.role === "worker") {
    return null; // Workers should not see admin layout
  }
  if (currentSession.role !== "superuser" && currentSession.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-black">
      {/* Admin Header - Compact */}
      <header className="bg-[#2E2E2E] dark:bg-[#0a0a0a] text-white border-b border-gray-700 dark:border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 h-12">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <Link href="/admin" className="font-serif text-lg font-semibold text-[#D4AF37] hover:text-[#C19B2E] transition-colors">
                Vairanya Admin
              </Link>
              <nav className="hidden lg:flex items-center gap-1 overflow-x-auto">
                <Link
                  href="/admin"
                  className={`text-xs px-2 py-1 rounded hover:bg-gray-700 dark:hover:bg-white/10 transition-colors whitespace-nowrap ${
                    pathname === "/admin" ? "text-[#D4AF37] bg-gray-700 dark:bg-white/10" : "text-gray-300 dark:text-gray-400"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/orders"
                  className={`text-xs px-2 py-1 rounded hover:bg-gray-700 transition-colors whitespace-nowrap ${
                    pathname?.startsWith("/admin/orders") ? "text-[#D4AF37] bg-gray-700 dark:bg-white/10" : "text-gray-300 dark:text-gray-400"
                  }`}
                >
                  Orders
                </Link>
                <Link
                  href="/admin/products"
                  className={`text-xs px-2 py-1 rounded hover:bg-gray-700 transition-colors whitespace-nowrap ${
                    pathname?.startsWith("/admin/products") ? "text-[#D4AF37] bg-gray-700 dark:bg-white/10" : "text-gray-300 dark:text-gray-400"
                  }`}
                >
                  Products
                </Link>
                <Link
                  href="/admin/reviews"
                  className={`text-xs px-2 py-1 rounded hover:bg-gray-700 transition-colors whitespace-nowrap ${
                    pathname?.startsWith("/admin/reviews") ? "text-[#D4AF37] bg-gray-700 dark:bg-white/10" : "text-gray-300 dark:text-gray-400"
                  }`}
                >
                  Reviews
                </Link>
                <Link
                  href="/admin/messages"
                  className={`text-xs px-2 py-1 rounded hover:bg-gray-700 transition-colors whitespace-nowrap relative ${
                    pathname?.startsWith("/admin/messages") ? "text-[#D4AF37] bg-gray-700 dark:bg-white/10" : "text-gray-300 dark:text-gray-400"
                  }`}
                >
                  Messages
                </Link>
                {/* Show these links to both superuser and admin */}
                {(isSuperUser() || currentSession?.role === "admin") && (
                  <>
                    <Link
                      href="/admin/customers"
                      className={`text-xs px-2 py-1 rounded hover:bg-gray-700 transition-colors whitespace-nowrap ${
                        pathname?.startsWith("/admin/customers") ? "text-[#D4AF37] bg-gray-700 dark:bg-white/10" : "text-gray-300 dark:text-gray-400"
                      }`}
                    >
                      Customers
                    </Link>
                    <Link
                      href="/admin/offers"
                      className={`text-xs px-2 py-1 rounded hover:bg-gray-700 transition-colors whitespace-nowrap ${
                        pathname?.startsWith("/admin/offers") ? "text-[#D4AF37] bg-gray-700 dark:bg-white/10" : "text-gray-300 dark:text-gray-400"
                      }`}
                    >
                      Offers
                    </Link>
                    <Link
                      href="/admin/categories"
                      className={`text-xs px-2 py-1 rounded hover:bg-gray-700 transition-colors whitespace-nowrap ${
                        pathname?.startsWith("/admin/categories") ? "text-[#D4AF37] bg-gray-700 dark:bg-white/10" : "text-gray-300 dark:text-gray-400"
                      }`}
                    >
                      Categories
                    </Link>
                    <Link
                      href="/admin/collections"
                      className={`text-xs px-2 py-1 rounded hover:bg-gray-700 transition-colors whitespace-nowrap ${
                        pathname?.startsWith("/admin/collections") ? "text-[#D4AF37] bg-gray-700 dark:bg-white/10" : "text-gray-300 dark:text-gray-400"
                      }`}
                    >
                      Collections
                    </Link>
                  </>
                )}
                {/* Workers management - ONLY for superadmin */}
                {canManageWorkers() && (
                  <Link
                    href="/admin/workers"
                    className={`text-xs px-2 py-1 rounded hover:bg-gray-700 transition-colors whitespace-nowrap ${
                      pathname?.startsWith("/admin/workers") ? "text-[#D4AF37] bg-gray-700 dark:bg-white/10" : "text-gray-300 dark:text-gray-400"
                    }`}
                  >
                    Workers
                  </Link>
                )}
              </nav>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-1.5 text-gray-300 dark:text-gray-400 hover:text-[#D4AF37] hover:bg-gray-700 dark:hover:bg-white/10 rounded transition-colors"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {session && (
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-300 min-w-0">
                  {isSuperAdmin() ? (
                    <Shield className="h-3.5 w-3.5 text-[#D4AF37] flex-shrink-0" />
                  ) : currentSession?.role === "admin" ? (
                    <Shield className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                  ) : null}
                  <div className="truncate max-w-[120px]" title={session.name}>
                    {session.name}
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
                className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[60] lg:hidden"
                onClick={() => setShowMobileMenu(false)}
              />
              {/* Slide-in Menu */}
              <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-[#2E2E2E] dark:bg-[#0a0a0a] z-[70] lg:hidden shadow-2xl border-l border-gray-700 dark:border-white/10">
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
                      <Link href="/admin" onClick={() => setShowMobileMenu(false)} className={`text-sm px-3 py-2.5 rounded ${pathname === "/admin" ? "text-[#D4AF37] bg-gray-700 dark:bg-white/10" : "text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-white/10"}`}>Dashboard</Link>
                      <Link href="/admin/orders" onClick={() => setShowMobileMenu(false)} className={`text-sm px-3 py-2.5 rounded ${pathname?.startsWith("/admin/orders") ? "text-[#D4AF37] bg-gray-700 dark:bg-white/10" : "text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-white/10"}`}>Orders</Link>
                      <Link href="/admin/products" onClick={() => setShowMobileMenu(false)} className={`text-sm px-3 py-2.5 rounded ${pathname?.startsWith("/admin/products") ? "text-[#D4AF37] bg-gray-700 dark:bg-white/10" : "text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-white/10"}`}>Products</Link>
                      <Link href="/admin/reviews" onClick={() => setShowMobileMenu(false)} className={`text-sm px-3 py-2.5 rounded ${pathname?.startsWith("/admin/reviews") ? "text-[#D4AF37] bg-gray-700 dark:bg-white/10" : "text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-white/10"}`}>Reviews</Link>
                      <Link href="/admin/messages" onClick={() => setShowMobileMenu(false)} className={`text-sm px-3 py-2.5 rounded ${pathname?.startsWith("/admin/messages") ? "text-[#D4AF37] bg-gray-700 dark:bg-white/10" : "text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-white/10"}`}>Messages</Link>
                      {(isSuperUser() || currentSession?.role === "admin") && (
                        <>
                          <Link href="/admin/customers" onClick={() => setShowMobileMenu(false)} className={`text-sm px-3 py-2.5 rounded ${pathname?.startsWith("/admin/customers") ? "text-[#D4AF37] bg-gray-700 dark:bg-white/10" : "text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-white/10"}`}>Customers</Link>
                          <Link href="/admin/offers" onClick={() => setShowMobileMenu(false)} className={`text-sm px-3 py-2.5 rounded ${pathname?.startsWith("/admin/offers") ? "text-[#D4AF37] bg-gray-700 dark:bg-white/10" : "text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-white/10"}`}>Offers</Link>
                          <Link href="/admin/categories" onClick={() => setShowMobileMenu(false)} className={`text-sm px-3 py-2.5 rounded ${pathname?.startsWith("/admin/categories") ? "text-[#D4AF37] bg-gray-700 dark:bg-white/10" : "text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-white/10"}`}>Categories</Link>
                          <Link href="/admin/collections" onClick={() => setShowMobileMenu(false)} className={`text-sm px-3 py-2.5 rounded ${pathname?.startsWith("/admin/collections") ? "text-[#D4AF37] bg-gray-700 dark:bg-white/10" : "text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-white/10"}`}>Collections</Link>
                        </>
                      )}
                      {canManageWorkers() && (
                        <Link href="/admin/workers" onClick={() => setShowMobileMenu(false)} className={`text-sm px-3 py-2.5 rounded ${pathname?.startsWith("/admin/workers") ? "text-[#D4AF37] bg-gray-700 dark:bg-white/10" : "text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-white/10"}`}>Workers</Link>
                      )}
                    </div>
                  </nav>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Admin Content - Mobile Optimized */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 lg:py-8 text-gray-900 dark:text-white">{children}</main>
    </div>
  );
}

