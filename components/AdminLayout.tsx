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
import { Package, Home, LogOut, Shield, User, Users, Tag, Star, Menu, Moon, Sun, X, Mail, LayoutDashboard, ShoppingBag, FolderTree, Layers } from "lucide-react";
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
            // Check if there's an error (like server configuration error)
            if (data.error) {
              console.error("Admin login error:", data.error, data.message);
              // Don't redirect on server errors - let user see the error or try again
              return;
            }
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
          } else {
            // Non-200 response - log but don't block (might be 503 service unavailable)
            console.warn("Admin login returned non-ok status:", res.status);
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
      {/* Admin Header - Compact & Modern */}
      <header className="bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-white/10 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between gap-2 h-10 md:h-11">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-1.5 text-gray-600 dark:text-gray-300 hover:text-[#D4AF37] hover:bg-gray-100 dark:hover:bg-white/5 rounded-md transition-colors flex-shrink-0"
                aria-label="Menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <Link href="/admin" className="font-serif text-base md:text-lg font-semibold text-[#D4AF37] hover:text-[#C19B2E] transition-colors flex-shrink-0">
                Vairanya
              </Link>
              {/* Desktop Navigation - Compact with Icons */}
              <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto">
                <Link
                  href="/admin"
                  className={`flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 transition-all whitespace-nowrap ${
                    pathname === "/admin" 
                      ? "text-[#D4AF37] bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 font-medium" 
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/admin/orders"
                  className={`flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 transition-all whitespace-nowrap ${
                    pathname?.startsWith("/admin/orders") 
                      ? "text-[#D4AF37] bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 font-medium" 
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Orders</span>
                </Link>
                <Link
                  href="/admin/products"
                  className={`flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 transition-all whitespace-nowrap ${
                    pathname?.startsWith("/admin/products") 
                      ? "text-[#D4AF37] bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 font-medium" 
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <Package className="h-3.5 w-3.5" />
                  <span>Products</span>
                </Link>
                <Link
                  href="/admin/reviews"
                  className={`flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 transition-all whitespace-nowrap ${
                    pathname?.startsWith("/admin/reviews") 
                      ? "text-[#D4AF37] bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 font-medium" 
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <Star className="h-3.5 w-3.5" />
                  <span>Reviews</span>
                </Link>
                <Link
                  href="/admin/messages"
                  className={`flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 transition-all whitespace-nowrap relative ${
                    pathname?.startsWith("/admin/messages") 
                      ? "text-[#D4AF37] bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 font-medium" 
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Messages</span>
                </Link>
                {/* Show these links to both superuser and admin */}
                {(isSuperUser() || currentSession?.role === "admin") && (
                  <>
                    <Link
                      href="/admin/customers"
                      className={`flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 transition-all whitespace-nowrap ${
                        pathname?.startsWith("/admin/customers") 
                          ? "text-[#D4AF37] bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 font-medium" 
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>Customers</span>
                    </Link>
                    <Link
                      href="/admin/offers"
                      className={`flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 transition-all whitespace-nowrap ${
                        pathname?.startsWith("/admin/offers") 
                          ? "text-[#D4AF37] bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 font-medium" 
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      <Tag className="h-3.5 w-3.5" />
                      <span>Offers</span>
                    </Link>
                    <Link
                      href="/admin/categories"
                      className={`flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 transition-all whitespace-nowrap ${
                        pathname?.startsWith("/admin/categories") 
                          ? "text-[#D4AF37] bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 font-medium" 
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      <FolderTree className="h-3.5 w-3.5" />
                      <span>Categories</span>
                    </Link>
                    <Link
                      href="/admin/collections"
                      className={`flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 transition-all whitespace-nowrap ${
                        pathname?.startsWith("/admin/collections") 
                          ? "text-[#D4AF37] bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 font-medium" 
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span>Collections</span>
                    </Link>
                  </>
                )}
                {/* Workers management - ONLY for superadmin */}
                {canManageWorkers() && (
                  <Link
                    href="/admin/workers"
                    className={`flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 transition-all whitespace-nowrap ${
                      pathname?.startsWith("/admin/workers") 
                        ? "text-[#D4AF37] bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 font-medium" 
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>Workers</span>
                  </Link>
                )}
              </nav>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {session && (
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-300 min-w-0 px-2 py-1 rounded-md bg-gray-50 dark:bg-white/5">
                  {isSuperAdmin() ? (
                    <Shield className="h-3 w-3 text-[#D4AF37] flex-shrink-0" />
                  ) : currentSession?.role === "admin" ? (
                    <Shield className="h-3 w-3 text-blue-500 flex-shrink-0" />
                  ) : null}
                  <div className="truncate max-w-[100px]" title={session.name}>
                    {session.name}
                  </div>
                </div>
              )}
              <Button
                onClick={toggleTheme}
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
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
                className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-[#D4AF37] hover:bg-gray-100 dark:hover:bg-white/5 rounded-md transition-colors"
                title="View Site"
              >
                <Home className="h-3.5 w-3.5" />
              </Link>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5 sm:mr-1"/>
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
          {/* Mobile Navigation - Compact Modern Menu */}
          {showMobileMenu && (
            <>
              {/* Backdrop - Lighter for light mode */}
              <div 
                className="fixed inset-0 bg-gray-900/20 dark:bg-black/40 z-[60] lg:hidden"
                onClick={() => setShowMobileMenu(false)}
              />
              {/* Slide-in Menu */}
              <div 
                className="fixed inset-y-0 left-0 w-[70vw] max-w-[260px] z-[70] lg:hidden shadow-md bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-white/10"
              >
                <div className="flex flex-col h-full">
                  {/* Mobile Menu Header */}
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-white/10">
                    <h2 className="text-sm font-serif font-semibold text-[#D4AF37]">Menu</h2>
                    <button
                      onClick={() => setShowMobileMenu(false)}
                      className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-md transition-colors"
                      aria-label="Close menu"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Mobile Navigation Links */}
                  <nav className="flex-1 overflow-y-auto px-2 py-2">
                    <div className="flex flex-col gap-1">
                      <Link 
                        href="/admin" 
                        onClick={() => setShowMobileMenu(false)} 
                        className={`flex items-center gap-2 text-xs px-2.5 py-2 rounded-md transition-all ${
                          pathname === "/admin" 
                            ? "text-[#D4AF37] bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 font-medium" 
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                        }`}
                      >
                        <LayoutDashboard className="h-3.5 w-3.5" />
                        <span>Dashboard</span>
                      </Link>
                      <Link 
                        href="/admin/orders" 
                        onClick={() => setShowMobileMenu(false)} 
                        className={`flex items-center gap-2 text-xs px-2.5 py-2 rounded-md transition-all ${
                          pathname?.startsWith("/admin/orders") 
                            ? "text-[#D4AF37] bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 font-medium" 
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                        }`}
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>Orders</span>
                      </Link>
                      <Link 
                        href="/admin/products" 
                        onClick={() => setShowMobileMenu(false)} 
                        className={`flex items-center gap-2 text-xs px-2.5 py-2 rounded-md transition-all ${
                          pathname?.startsWith("/admin/products") 
                            ? "text-[#D4AF37] bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 font-medium" 
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                        }`}
                      >
                        <Package className="h-3.5 w-3.5" />
                        <span>Products</span>
                      </Link>
                      <Link 
                        href="/admin/reviews" 
                        onClick={() => setShowMobileMenu(false)} 
                        className={`flex items-center gap-2 text-xs px-2.5 py-2 rounded-md transition-all ${
                          pathname?.startsWith("/admin/reviews") 
                            ? "text-[#D4AF37] bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 font-medium" 
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                        }`}
                      >
                        <Star className="h-3.5 w-3.5" />
                        <span>Reviews</span>
                      </Link>
                      <Link 
                        href="/admin/messages" 
                        onClick={() => setShowMobileMenu(false)} 
                        className={`flex items-center gap-2 text-xs px-2.5 py-2 rounded-md transition-all ${
                          pathname?.startsWith("/admin/messages") 
                            ? "text-[#D4AF37] bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 font-medium" 
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                        }`}
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>Messages</span>
                      </Link>
                      {(isSuperUser() || currentSession?.role === "admin") && (
                        <>
                          <div className="h-px bg-gray-200 dark:bg-white/10 my-1" />
                          <Link 
                            href="/admin/customers" 
                            onClick={() => setShowMobileMenu(false)} 
                            className={`flex items-center gap-2 text-xs px-2.5 py-2 rounded-md transition-all ${
                              pathname?.startsWith("/admin/customers") 
                                ? "text-[#D4AF37] bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 font-medium" 
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                            }`}
                          >
                            <Users className="h-3.5 w-3.5" />
                            <span>Customers</span>
                          </Link>
                          <Link 
                            href="/admin/offers" 
                            onClick={() => setShowMobileMenu(false)} 
                            className={`flex items-center gap-2 text-xs px-2.5 py-2 rounded-md transition-all ${
                              pathname?.startsWith("/admin/offers") 
                                ? "text-[#D4AF37] bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 font-medium" 
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                            }`}
                          >
                            <Tag className="h-3.5 w-3.5" />
                            <span>Offers</span>
                          </Link>
                          <Link 
                            href="/admin/categories" 
                            onClick={() => setShowMobileMenu(false)} 
                            className={`flex items-center gap-2 text-xs px-2.5 py-2 rounded-md transition-all ${
                              pathname?.startsWith("/admin/categories") 
                                ? "text-[#D4AF37] bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 font-medium" 
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                            }`}
                          >
                            <FolderTree className="h-3.5 w-3.5" />
                            <span>Categories</span>
                          </Link>
                          <Link 
                            href="/admin/collections" 
                            onClick={() => setShowMobileMenu(false)} 
                            className={`flex items-center gap-2 text-xs px-2.5 py-2 rounded-md transition-all ${
                              pathname?.startsWith("/admin/collections") 
                                ? "text-[#D4AF37] bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 font-medium" 
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                            }`}
                          >
                            <Layers className="h-3.5 w-3.5" />
                            <span>Collections</span>
                          </Link>
                        </>
                      )}
                      {canManageWorkers() && (
                        <>
                          <div className="h-px bg-gray-200 dark:bg-white/10 my-1" />
                          <Link 
                            href="/admin/workers" 
                            onClick={() => setShowMobileMenu(false)} 
                            className={`flex items-center gap-2 text-xs px-2.5 py-2 rounded-md transition-all ${
                              pathname?.startsWith("/admin/workers") 
                                ? "text-[#D4AF37] bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 font-medium" 
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                            }`}
                          >
                            <User className="h-3.5 w-3.5" />
                            <span>Workers</span>
                          </Link>
                        </>
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

