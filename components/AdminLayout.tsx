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
import { Package, Home, LogOut, Shield, User, Users, Tag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<ReturnType<typeof getAdminSession>>(null);
  const { user, adminInfo, signout } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

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
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Admin Header */}
      <header className="bg-[#2E2E2E] text-white border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-8 min-w-0 flex-1">
              <Link href="/admin" className="font-serif text-xl">
                Vairanya Admin
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/admin"
                  className={`text-sm hover:text-[#D4AF37] transition-colors ${
                    pathname === "/admin" ? "text-[#D4AF37]" : ""
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/orders"
                  className={`text-sm hover:text-[#D4AF37] transition-colors ${
                    pathname?.startsWith("/admin/orders") ? "text-[#D4AF37]" : ""
                  }`}
                >
                  Orders
                </Link>
                <Link
                  href="/admin/tasks"
                  className={`text-sm hover:text-[#D4AF37] transition-colors ${
                    pathname?.startsWith("/admin/tasks") ? "text-[#D4AF37]" : ""
                  }`}
                >
                  Tasks
                </Link>
                <Link
                  href="/admin/products"
                  className={`text-sm hover:text-[#D4AF37] transition-colors ${
                    pathname?.startsWith("/admin/products") ? "text-[#D4AF37]" : ""
                  }`}
                >
                  Products
                </Link>
                <Link
                  href="/admin/reviews"
                  className={`text-sm hover:text-[#D4AF37] transition-colors ${
                    pathname?.startsWith("/admin/reviews") ? "text-[#D4AF37]" : ""
                  }`}
                >
                  Reviews
                </Link>
                {/* Show these links to both superuser and admin */}
                {(isSuperUser() || currentSession?.role === "admin") && (
                  <>
                    <Link
                      href="/admin/customers"
                      className={`text-sm hover:text-[#D4AF37] transition-colors ${
                        pathname?.startsWith("/admin/customers") ? "text-[#D4AF37]" : ""
                      }`}
                    >
                      Customers
                    </Link>
                    <Link
                      href="/admin/offers"
                      className={`text-sm hover:text-[#D4AF37] transition-colors ${
                        pathname?.startsWith("/admin/offers") ? "text-[#D4AF37]" : ""
                      }`}
                    >
                      Offers
                    </Link>
                    <Link
                      href="/admin/categories"
                      className={`text-sm hover:text-[#D4AF37] transition-colors ${
                        pathname?.startsWith("/admin/categories") ? "text-[#D4AF37]" : ""
                      }`}
                    >
                      Categories
                    </Link>
                  </>
                )}
                {/* Workers management - ONLY for superadmin */}
                {canManageWorkers() && (
                  <Link
                    href="/admin/workers"
                    className={`text-sm hover:text-[#D4AF37] transition-colors ${
                      pathname?.startsWith("/admin/workers") ? "text-[#D4AF37]" : ""
                    }`}
                  >
                    Workers
                  </Link>
                )}
              </nav>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              {session && (
                <div className="flex items-start gap-2 text-sm min-w-0">
                  {isSuperAdmin() ? (
                    <Shield className="h-4 w-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                  ) : currentSession?.role === "admin" ? (
                    <Shield className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <User className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="hidden sm:block text-gray-300 min-w-0">
                    <div className="truncate max-w-[200px]" title={session.name}>
                      {session.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {session.role === "superuser" ? "Super Admin" : session.role === "admin" ? "Admin" : "Worker"}
                    </div>
                  </div>
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

      {/* Admin Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}

