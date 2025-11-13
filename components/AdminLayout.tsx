"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getAdminSession, isAdminAuthenticated, clearAdminSession } from "@/lib/admin-auth";
import { setRedirectLock, shouldAllowRedirect, clearRedirectLock } from "@/lib/redirect-lock";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  MessageSquare,
  Tag,
  FolderTree,
  UserCog,
  LogOut,
  Menu,
  X,
  ImageIcon,
  Home,
  Settings,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, adminInfo, signout } = useAuth();
  const [session, setSession] = useState<ReturnType<typeof getAdminSession>>(null);
  const [mounted, setMounted] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);
  const verificationInProgress = useRef(false);
  const hasInitialized = useRef(false);
  const isNonAdminUser = useRef(false); // Track if we've determined user is not an admin

  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobileMenu]);

  useEffect(() => {
    setMounted(true);
    
    // Clear redirect locks if we have a valid session on mount
    const session = getAdminSession();
    if (session) {
      clearRedirectLock();
    }
  }, []);

  useEffect(() => {
    // Skip all redirect logic if we're on login page
    if (pathname === "/login" || pathname === "/admin/login") {
      return;
    }
    
    // Don't run redirect logic if already redirected (prevent loops)
    if (hasRedirected) {
      return;
    }
    
    // Prevent multiple simultaneous verifications
    if (verificationInProgress.current) {
      return;
    }
    
    // Get current session
    const currentSession = getAdminSession();
    const isAdminAuth = isAdminAuthenticated();
    
    // If we've already determined this user is not an admin, show 404
    if (isNonAdminUser.current && !currentSession) {
      setHasRedirected(true);
      setShowNotFound(true);
      return;
    }
    
    // STRICT: Block workers from accessing ANY admin routes
    if (isAdminAuth && currentSession) {
      // If user is a worker, immediately redirect to worker dashboard
      if (currentSession.role === "worker") {
        setHasRedirected(true);
        window.location.replace("/worker/dashboard");
        return;
      }
      
      // Allow both superuser and admin to access admin panel
      if (currentSession.role === "superuser" || currentSession.role === "admin") {
        setSession(currentSession);
        hasInitialized.current = true;
        isNonAdminUser.current = false; // Reset flag if admin session exists
        setShowNotFound(false); // Reset 404 flag
        clearRedirectLock(); // Clear any redirect locks since we have valid session
        return; // All good, allow access
      }
    }
    
    // If we already have a valid session, don't check again
    if (hasInitialized.current && currentSession) {
      return;
    }
    
    // Define verify function that can be reused
    const verifyAndEstablishSession = async () => {
      // Prevent multiple simultaneous calls
      if (verificationInProgress.current) {
        return;
      }
      
      verificationInProgress.current = true;
      setIsCheckingAdmin(true);
      
      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
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
              const currentPath = pathname || window.location.pathname;
              if (shouldAllowRedirect(currentPath, "/worker/dashboard")) {
                if (setRedirectLock(currentPath, "/worker/dashboard")) {
                  setHasRedirected(true);
                  verificationInProgress.current = false;
                  setIsCheckingAdmin(false);
                  window.location.replace("/worker/dashboard");
                  return;
                }
              }
              // If redirect blocked, just set state
              verificationInProgress.current = false;
              setIsCheckingAdmin(false);
              return;
            }
            
            // If superuser or admin, set session and update state (no redirect needed if already on /admin)
            if (data.user.role === "superuser" || data.user.role === "admin") {
              isNonAdminUser.current = false; // Reset flag - user is admin
              setShowNotFound(false); // Reset 404 flag
              verificationInProgress.current = false;
              setIsCheckingAdmin(false);
              
              // Set session state immediately
              const newSession = {
                username: data.user.username,
                role: data.user.role as "superuser" | "admin",
                name: data.user.name || data.user.username,
              };
              setSession(newSession);
              hasInitialized.current = true;
              clearRedirectLock(); // Clear locks since we have valid session
              
              // Only redirect if we're not already on an admin route
              if (!pathname?.startsWith("/admin")) {
                const currentPath = pathname || window.location.pathname;
                if (shouldAllowRedirect(currentPath, "/admin")) {
                  if (setRedirectLock(currentPath, "/admin")) {
                    setHasRedirected(true);
                    window.location.replace("/admin");
                  }
                }
              }
              return;
            }
          } else {
            // User is not an admin - mark as non-admin and show 404
            isNonAdminUser.current = true;
            setHasRedirected(true);
            verificationInProgress.current = false;
            setIsCheckingAdmin(false);
            setShowNotFound(true);
            return;
          }
        } else {
          // API returned error (403 or other) - user is not an admin
          isNonAdminUser.current = true;
          setHasRedirected(true);
          verificationInProgress.current = false;
          setIsCheckingAdmin(false);
          setShowNotFound(true);
          return;
        }
      } catch (err) {
        // Error - mark as non-admin and show 404
        isNonAdminUser.current = true;
        setHasRedirected(true);
        verificationInProgress.current = false;
        setIsCheckingAdmin(false);
        setShowNotFound(true);
        return;
      }
    };
    
    // CRITICAL FIX: If user is signed in but no admin session, check immediately
    // Don't redirect to /login if user is already signed in - that causes loop!
    // Also skip if we've already determined user is not an admin
    if (user && user.email && !currentSession && pathname?.startsWith("/admin") && !isCheckingAdmin && !isNonAdminUser.current) {
      // Check if session is currently being established (from login page)
      const isEstablishing = typeof window !== "undefined" && 
        localStorage.getItem("admin_session_establishing") === "true";
      
      if (isEstablishing) {
        // Session is being established, wait for it with multiple checks
        let checkCount = 0;
        const maxChecks = 10; // Check 10 times over 2 seconds
        const checkInterval = setInterval(() => {
          checkCount++;
          const retrySession = getAdminSession();
          if (retrySession) {
            // Session was established, allow access
            clearInterval(checkInterval);
            localStorage.removeItem("admin_session_establishing");
            setSession(retrySession);
            hasInitialized.current = true;
            isNonAdminUser.current = false; // Reset flag - session exists
            setShowNotFound(false); // Reset 404 flag
            verificationInProgress.current = false;
            setIsCheckingAdmin(false);
            return;
          }
          // If we've checked enough times and still no session, verify admin status
          if (checkCount >= maxChecks) {
            clearInterval(checkInterval);
            localStorage.removeItem("admin_session_establishing");
            verificationInProgress.current = false;
            verifyAndEstablishSession();
          }
        }, 200); // Check every 200ms for up to 2 seconds
        
        return () => clearInterval(checkInterval);
      } else {
        // User is signed in but no admin session - check if they're admin
        // Don't wait - check immediately to prevent redirect loop
        verifyAndEstablishSession();
        return;
      }
    }
    
    // ONLY redirect to login if NO user is signed in AND no admin session
    // If user IS signed in, we should check admin status first, not redirect to login
    if (!user && !isAdminAuth && !isCheckingAdmin && !verificationInProgress.current) {
      // Check if session is being established
      const isEstablishing = typeof window !== "undefined" && 
        localStorage.getItem("admin_session_establishing") === "true";
      
      // Only redirect if not establishing session and redirect is allowed
      if (!isEstablishing) {
        const currentPath = pathname || window.location.pathname;
        if (shouldAllowRedirect(currentPath, "/login")) {
          if (setRedirectLock(currentPath, "/login")) {
            setHasRedirected(true);
            window.location.replace("/login");
            return;
          }
        }
      }
    }
  }, [pathname, user?.email, hasRedirected, isCheckingAdmin]);

  const handleLogout = () => {
    // Use AuthProvider's signout to ensure proper cleanup
    signout();
  };

  if (!mounted) {
    return null;
  }

  // Always allow login page to render without layout
  if (pathname === "/login" || pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Show 404 page for non-admin users trying to access admin routes
  if (showNotFound) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center px-6 py-16">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <h1 className="font-serif text-8xl md:text-9xl font-light text-[#D4AF37]">
              404
            </h1>
          </div>
          <div className="space-y-4 mb-8">
            <h2 className="font-serif text-3xl md:text-4xl text-gray-800">
              Page Not Found
            </h2>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
          </div>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#C19B2E] text-white px-8 py-6 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <Home className="h-5 w-5" />
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  // Don't block rendering completely - let useEffect handle redirects
  // This prevents issues where session is being established
  const currentSessionForRender = getAdminSession();
  
  // Only block rendering if we're certain user is not authorized
  // And we're not in the process of checking/admin session establishment
  if (!isCheckingAdmin && !hasRedirected && currentSessionForRender) {
    // Block workers from rendering admin layout
    if (currentSessionForRender.role === "worker") {
      return null;
    }
    
    // Only allow superuser and admin roles
    if (currentSessionForRender.role !== "superuser" && currentSessionForRender.role !== "admin") {
      return null;
    }
  }
  
  // If no session and not checking, show nothing (useEffect will redirect)
  if (!currentSessionForRender && !isCheckingAdmin && !user) {
    return null;
  }

  const activeSession = session || currentSessionForRender || getAdminSession();
  const isSuperuser = activeSession?.role === "superuser";
  const isAdmin = activeSession?.role === "admin";

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0a0a0a]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:bg-white dark:lg:bg-[#0a0a0a] lg:border-r lg:border-gray-200 dark:lg:border-white/10">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-white/10 px-6">
            <Link href="/admin" className="font-serif text-base md:text-lg font-semibold text-[#D4AF37] hover:text-[#C19B2E] transition-colors flex-shrink-0">
              Vairanya Admin
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            <Link
              href="/admin"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === "/admin"
                  ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Link>

            <Link
              href="/admin/orders"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname?.startsWith("/admin/orders")
                  ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <ShoppingBag className="h-5 w-5" />
              Orders
            </Link>

            <Link
              href="/admin/products"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname?.startsWith("/admin/products")
                  ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Package className="h-5 w-5" />
              Products
            </Link>

            <Link
              href="/admin/reviews"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname?.startsWith("/admin/reviews")
                  ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <MessageSquare className="h-5 w-5" />
              Reviews
            </Link>

            <Link
              href="/admin/messages"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname?.startsWith("/admin/messages")
                  ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <MessageSquare className="h-5 w-5" />
              Messages
            </Link>

            {(isSuperuser || isAdmin) && (
              <>
                <Link
                  href="/admin/customers"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname?.startsWith("/admin/customers")
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Users className="h-5 w-5" />
                  Customers
                </Link>

                <Link
                  href="/admin/offers"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname?.startsWith("/admin/offers")
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Tag className="h-5 w-5" />
                  Offers
                </Link>

                <Link
                  href="/admin/categories"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname?.startsWith("/admin/categories")
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <FolderTree className="h-5 w-5" />
                  Categories
                </Link>

                <Link
                  href="/admin/collections"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname?.startsWith("/admin/collections")
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <FolderTree className="h-5 w-5 flex-shrink-0" />
                  Collections
                </Link>

                <Link
                  href="/admin/carousel"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname?.startsWith("/admin/carousel")
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <ImageIcon className="h-5 w-5" />
                  Carousel
                </Link>

                <Link
                  href="/admin/settings"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname?.startsWith("/admin/settings")
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Settings className="h-5 w-5" />
                  Settings
                </Link>
              </>
            )}

            {isSuperuser && (
              <Link
                href="/admin/workers"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname?.startsWith("/admin/workers")
                    ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <UserCog className="h-5 w-5 flex-shrink-0" />
                Workers
              </Link>
            )}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-gray-200 dark:border-white/10 p-4">
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {activeSession?.name || "Admin"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {activeSession?.role === "superuser" ? "Super Admin" : "Admin"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 flex h-16 items-center justify-between border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] px-4">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="p-2 text-gray-700 dark:text-gray-300"
        >
          {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <Link href="/admin" className="font-serif text-lg font-semibold text-[#D4AF37] hover:text-[#C19B2E] transition-colors flex-shrink-0">
          Vairanya Admin
        </Link>
      </header>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-[70] w-64 bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-white/10 lg:hidden overflow-y-auto">
            <div className="flex h-full flex-col">
              <div className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-white/10 px-6">
                <span className="font-serif text-lg font-semibold text-[#D4AF37]">Vairanya Admin</span>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 text-gray-700 dark:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <nav className="flex-1 space-y-1 px-3 py-4">
                <Link
                  href="/admin"
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname === "/admin"
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Dashboard
                </Link>

                <Link
                  href="/admin/orders"
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname?.startsWith("/admin/orders")
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <ShoppingBag className="h-5 w-5" />
                  Orders
                </Link>

                <Link
                  href="/admin/products"
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname?.startsWith("/admin/products")
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Package className="h-5 w-5" />
                  Products
                </Link>

                <Link
                  href="/admin/reviews"
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname?.startsWith("/admin/reviews")
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <MessageSquare className="h-5 w-5" />
                  Reviews
                </Link>

                <Link
                  href="/admin/messages"
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname?.startsWith("/admin/messages")
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <MessageSquare className="h-5 w-5" />
                  Messages
                </Link>

                {(isSuperuser || isAdmin) && (
                  <>
                    <Link
                      href="/admin/customers"
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        pathname?.startsWith("/admin/customers")
                          ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Users className="h-5 w-5" />
                      Customers
                    </Link>

                    <Link
                      href="/admin/offers"
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        pathname?.startsWith("/admin/offers")
                          ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Tag className="h-5 w-5" />
                      Offers
                    </Link>

                    <Link
                      href="/admin/categories"
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        pathname?.startsWith("/admin/categories")
                          ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <FolderTree className="h-5 w-5" />
                      Categories
                    </Link>

                    <Link
                      href="/admin/collections"
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        pathname?.startsWith("/admin/collections")
                          ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <FolderTree className="h-5 w-5" />
                      Collections
                    </Link>

                    <Link
                      href="/admin/carousel"
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        pathname?.startsWith("/admin/carousel")
                          ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <ImageIcon className="h-5 w-5" />
                      Carousel
                    </Link>

                    <Link
                      href="/admin/settings"
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        pathname?.startsWith("/admin/settings")
                          ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Settings className="h-5 w-5" />
                      Settings
                    </Link>
                  </>
                )}

                {isSuperuser && (
                  <Link
                    href="/admin/workers"
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      pathname?.startsWith("/admin/workers")
                        ? "bg-[#D4AF37]/10 text-[#D4AF37] dark:bg-[#D4AF37]/20"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <UserCog className="h-5 w-5" />
                    Workers
                  </Link>
                )}
              </nav>

              <div className="border-t border-gray-200 dark:border-white/10 p-4">
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activeSession?.name || "Admin"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activeSession?.role === "superuser" ? "Super Admin" : "Admin"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMobileMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="px-4 sm:px-6 lg:px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
