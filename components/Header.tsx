"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import React, { useState, useEffect } from "react";
import Cart from "./Cart";
import { useCart } from "@/lib/cart-context";
import { ShoppingBag, LogIn, LogOut, Heart, Search, Menu, User, ChevronDown, Shield, Briefcase, X, Sun, Moon } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useWishlist } from "@/lib/wishlist-context";
import { getAdminSession, isAdminAuthenticated } from "@/lib/admin-auth";
import { useTheme } from "@/components/ThemeProvider";

const Header: React.FC = () => {
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isWorker, setIsWorker] = useState(false);
  const [adminDashboardPath, setAdminDashboardPath] = useState("/admin");
  const { getTotalItems } = useCart();
  const { user, signout, adminInfo } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const { theme, toggleTheme } = useTheme();

  const totalItems = getTotalItems?.() ?? 0;
  const wishlistCount = wishlistItems.length;
  
  // Check admin status only on client side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    const adminStatus = isAdminAuthenticated() || adminInfo !== null;
    setIsAdmin(adminStatus);
    if (adminStatus) {
      const adminSession = getAdminSession();
      const role = adminSession?.role || adminInfo?.role;
      setIsWorker(role === "worker");
      setAdminDashboardPath(role === "worker" ? "/worker/dashboard" : "/admin");
    } else {
      setIsWorker(false);
    }
  }, [adminInfo]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMobileMenuOpen(false);
    }
  };


  return (
    <>
      <header className="sticky top-0 z-40 glass-strong safe-top border-b border-gray-200/50 dark:border-white/10 shadow-lg dark:shadow-none">
        {/* Main Header - Mobile Optimized */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18 gap-2 sm:gap-3">
            {/* Left Side - Mobile Menu Button + Logo */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Mobile Menu Button - Left Side */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    className="md:hidden p-2.5 text-gray-700 dark:text-gray-400 active:text-[#D4AF37] dark:active:text-[#D4AF37] active:bg-gray-100 dark:active:bg-[#1a1a1a] transition-colors rounded-lg touch-manipulation"
                    aria-label="Menu"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[80vw] sm:w-[320px] p-0">
                  <div className="flex flex-col h-full">
                    {/* Mobile Menu Header */}
                    <SheetHeader className="px-2 py-2 border-b border-gray-200 dark:border-white/10">
                      <div className="flex items-center justify-between">
                        <SheetClose asChild>
                          <button
                            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
                            aria-label="Close menu"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </SheetClose>
                        <SheetTitle className="text-sm font-serif font-semibold text-gray-900 dark:text-white ml-auto">Menu</SheetTitle>
                      </div>
                    </SheetHeader>

                    {/* Mobile Menu Content */}
                    <div className="flex-1 overflow-y-auto px-2 pt-2 pb-2 flex flex-col">
                      <div className="flex-1">
                        {/* Mobile Search Bar */}
                        <form onSubmit={handleSearch} className="mb-3">
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search..."
                              className="flex-1 px-2.5 py-1.5 text-xs border border-[#D4AF37]/50 dark:border-[#D4AF37]/50 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                              autoComplete="off"
                            />
                            <button
                              type="submit"
                              className="px-2.5 py-1.5 bg-[#D4AF37] active:bg-[#C19B2E] text-white rounded-md transition-all shadow-sm touch-manipulation min-w-[36px] flex items-center justify-center"
                              aria-label="Search"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <Search className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </form>

                        {/* Mobile Account Section */}
                        {user ? (
                          <div className="mb-3 pb-3 border-b border-gray-200 dark:border-[#1a1a1a]">
                            <div className="flex items-center gap-2 mb-2 p-1.5 rounded-md bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10">
                              {user.photoURL ? (
                                <Image
                                  src={user.photoURL}
                                  alt={user.displayName || "User"}
                                  width={28}
                                  height={28}
                                  className="rounded-full border border-white dark:border-[#1a1a1a] shadow-sm"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C19B2E] flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                                  {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                  {user.displayName || "User"}
                                </p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-500 truncate">{user.email}</p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <SheetClose asChild>
                                <Link
                                  href="/account"
                                  className="px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-[#1a1a1a] active:text-[#D4AF37] rounded-md transition-colors touch-manipulation flex items-center gap-2"
                                >
                                  <User className="h-3.5 w-3.5" />
                                  My Account
                                </Link>
                              </SheetClose>
                              <SheetClose asChild>
                                <Link
                                  href="/account?tab=orders"
                                  className="px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-[#1a1a1a] active:text-[#D4AF37] rounded-md transition-colors touch-manipulation flex items-center gap-2"
                                >
                                  <ShoppingBag className="h-3.5 w-3.5" />
                                  Orders
                                </Link>
                              </SheetClose>
                              <SheetClose asChild>
                                <Link
                                  href="/wishlist"
                                  className="px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-[#1a1a1a] active:text-[#D4AF37] rounded-md transition-colors touch-manipulation flex items-center gap-2"
                                >
                                  <Heart className="h-3.5 w-3.5" />
                                  Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                                </Link>
                              </SheetClose>
                              {mounted && (isAdmin || isWorker) && (
                                <SheetClose asChild>
                                  <Link
                                    href={isWorker ? "/worker/dashboard" : adminDashboardPath}
                                    className="px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-[#1a1a1a] active:text-[#D4AF37] rounded-md transition-colors touch-manipulation flex items-center gap-2"
                                  >
                                    {isWorker ? <Briefcase className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                                    {isWorker ? "Worker Dashboard" : "Admin Panel"}
                                  </Link>
                                </SheetClose>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="mb-3 pb-3 border-b border-gray-200 dark:border-[#1a1a1a]">
                            <SheetClose asChild>
                              <Link
                                href="/login"
                                className="flex items-center justify-center gap-1.5 w-full px-2.5 py-2 text-xs font-medium text-white bg-[#D4AF37] active:bg-[#C19B2E] rounded-md transition-colors touch-manipulation shadow-sm"
                              >
                                <LogIn className="h-3.5 w-3.5" />
                                Sign In
                              </Link>
                            </SheetClose>
                          </div>
                        )}

                        {/* Mobile Navigation Links */}
                        <nav className="flex flex-col gap-0.5">
                          <p className="px-2 py-1 text-[10px] font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">Shop</p>
                          <SheetClose asChild>
                            <Link
                              href="/products"
                              className="px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-[#1a1a1a] active:text-[#D4AF37] rounded-md transition-colors touch-manipulation"
                            >
                              All Products
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link
                              href="/products?category=rings"
                              className="px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-[#1a1a1a] active:text-[#D4AF37] rounded-md transition-colors touch-manipulation"
                            >
                              Rings
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link
                              href="/products?category=earrings"
                              className="px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-[#1a1a1a] active:text-[#D4AF37] rounded-md transition-colors touch-manipulation"
                            >
                              Earrings
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link
                              href="/products?category=pendants"
                              className="px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-[#1a1a1a] active:text-[#D4AF37] rounded-md transition-colors touch-manipulation"
                            >
                              Pendants
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link
                              href="/products?category=bracelets"
                              className="px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-[#1a1a1a] active:text-[#D4AF37] rounded-md transition-colors touch-manipulation"
                            >
                              Bracelets
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link
                              href="/products?category=necklaces"
                              className="px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-[#1a1a1a] active:text-[#D4AF37] rounded-md transition-colors touch-manipulation"
                            >
                              Necklaces
                            </Link>
                          </SheetClose>
                        </nav>
                      </div>

                      {/* Sign Out Button - At the bottom */}
                      {user && (
                        <div className="pt-2 mt-2 border-t border-gray-200 dark:border-[#1a1a1a]">
                          <SheetClose asChild>
                            <button
                              onClick={() => {
                                signout();
                              }}
                              className="w-full text-left px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-[#1a1a1a] active:text-red-500 dark:active:text-red-400 rounded-md transition-colors touch-manipulation flex items-center gap-2"
                            >
                              <LogOut className="h-3.5 w-3.5" />
                              Sign Out
                            </button>
                          </SheetClose>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 flex-shrink-0 group min-w-0" aria-label="Go to home">
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 overflow-hidden group-active:scale-95 transition-transform duration-200">
                  <Image src="/images/logo-ivory.png" alt="Vairanya logo" width={40} height={40} priority className="w-8 h-8 md:w-9 md:h-9" />
                </div>
                <div className="hidden xs:flex flex-col leading-tight min-w-0">
                  <h1 className="text-base md:text-lg font-serif tracking-wider font-semibold truncate text-gray-900 dark:text-white">VAIRANYA</h1>
                  <div className="text-[9px] md:text-[10px] text-gray-500 dark:text-gray-500 leading-none truncate">Where Elegance Meets Soul</div>
                </div>
              </Link>
            </div>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-lg mx-6">
              <div className="flex w-full relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search jewellery..."
                  className="flex-1 px-3 py-2 border border-[#D4AF37]/50 dark:border-[#D4AF37]/50 rounded-full focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] glass-card backdrop-blur-md transition-all text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/70"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-[#D4AF37] hover:bg-[#C19B2E] text-white rounded-full transition-all duration-300"
                  aria-label="Search"
                >
                  <Search className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>

            {/* Right Side Actions - Mobile Optimized with Better Touch Targets */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2.5 text-gray-700 dark:text-gray-400 active:text-[#D4AF37] dark:active:text-[#D4AF37] active:bg-gray-100 dark:active:bg-[#1a1a1a] rounded-lg touch-manipulation"
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </button>

              {/* Mobile Search Button - Better touch target */}
              <button
                onClick={() => {
                  router.push("/products");
                }}
                className="lg:hidden p-2.5 -mr-1 text-gray-700 dark:text-gray-400 active:text-[#D4AF37] dark:active:text-[#D4AF37] active:bg-gray-100 dark:active:bg-[#1a1a1a] transition-colors rounded-lg touch-manipulation"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist - Show on mobile too */}
              {user && (
                <Link
                  href="/wishlist"
                  className="flex items-center justify-center p-2.5 text-gray-700 dark:text-gray-400 active:text-[#D4AF37] dark:active:text-[#D4AF37] active:bg-gray-100 dark:active:bg-[#1a1a1a] transition-colors relative rounded-lg touch-manipulation"
                  aria-label={`Wishlist with ${wishlistCount} items`}
                >
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#D4AF37] text-[10px] text-white font-bold min-w-[18px]">
                      {wishlistCount > 9 ? '9+' : wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Cart - Better touch target */}
              <button
                onClick={() => {
                  setCartOpen(true);
                }}
                className="flex items-center justify-center p-2.5 text-gray-700 dark:text-gray-300 active:text-[#D4AF37] active:bg-gray-100 dark:active:bg-gray-800 transition-colors relative rounded-lg touch-manipulation"
                aria-label={`Cart with ${totalItems} items`}
              >
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#D4AF37] text-[10px] text-white font-bold min-w-[18px]">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>

              {/* Account Menu */}
              <div className="relative hidden md:block">
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowAccountMenu(!showAccountMenu)}
                      className="flex items-center gap-1.5 px-1.5 py-1 text-gray-700 dark:text-gray-400 hover:opacity-80 transition-all rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                      aria-label="Account menu"
                    >
                      {user.photoURL ? (
                        <Image
                          src={user.photoURL}
                          alt={user.displayName || "User"}
                          width={28}
                          height={28}
                          className="rounded-full border border-gray-200 hover:border-[#D4AF37] transition-colors"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C19B2E] flex items-center justify-center text-white font-semibold text-xs">
                          {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                        </div>
                      )}
                    </button>
                    {showAccountMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowAccountMenu(false)}
                        />
                        <div className="absolute right-0 mt-2 w-48 glass-strong rounded-2xl shadow-2xl border border-gray-200/50 dark:border-white/10 py-1 z-20 backdrop-blur-xl">
                          <Link
                            href="/account"
                            className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] hover:text-[#D4AF37] transition-colors"
                            onClick={() => setShowAccountMenu(false)}
                          >
                            My Account
                          </Link>
                          <Link
                            href="/account?tab=orders"
                            className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] hover:text-[#D4AF37] transition-colors"
                            onClick={() => setShowAccountMenu(false)}
                          >
                            Orders
                          </Link>
                          <Link
                            href="/wishlist"
                            className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] hover:text-[#D4AF37] transition-colors"
                            onClick={() => setShowAccountMenu(false)}
                          >
                            Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                          </Link>
                          {mounted && (isAdmin || isWorker) && (
                            <>
                              <div className="border-t border-gray-100 dark:border-[#1a1a1a] my-1" />
                              <Link
                                href={isWorker ? "/worker/dashboard" : adminDashboardPath}
                                className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] hover:text-[#D4AF37] transition-colors flex items-center gap-2"
                                onClick={() => setShowAccountMenu(false)}
                              >
                                {isWorker ? <Briefcase className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                                {isWorker ? "Worker Dashboard" : "Admin Panel"}
                              </Link>
                            </>
                          )}
                          <div className="border-t border-gray-100 dark:border-[#1a1a1a] my-1" />
                          <button
                            onClick={() => {
                              setShowAccountMenu(false);
                              signout();
                            }}
                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          >
                            Sign Out
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-700 dark:text-gray-400 hover:text-[#D4AF37] transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                    aria-label="Sign in"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="hidden lg:inline text-sm">Sign In</span>
                  </Link>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Navigation Bar - Compact */}
        <div className="hidden md:block border-t border-gray-200/50 dark:border-white/10 glass backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center justify-center gap-1 h-10">
              <Link
                href="/products"
                className="text-xs font-medium text-gray-700 dark:text-gray-400 hover:text-[#D4AF37] dark:hover:text-[#D4AF37] transition-all duration-200 py-1.5 px-3 rounded-md hover:bg-[#D4AF37]/5 dark:hover:bg-[#D4AF37]/10"
              >
                All Products
              </Link>
              <Link
                href="/products?category=rings"
                className="text-xs font-medium text-gray-700 dark:text-gray-400 hover:text-[#D4AF37] dark:hover:text-[#D4AF37] transition-all duration-200 py-1.5 px-3 rounded-md hover:bg-[#D4AF37]/5 dark:hover:bg-[#D4AF37]/10"
              >
                Rings
              </Link>
              <Link
                href="/products?category=earrings"
                className="text-xs font-medium text-gray-700 dark:text-gray-400 hover:text-[#D4AF37] dark:hover:text-[#D4AF37] transition-all duration-200 py-1.5 px-3 rounded-md hover:bg-[#D4AF37]/5 dark:hover:bg-[#D4AF37]/10"
              >
                Earrings
              </Link>
              <Link
                href="/products?category=pendants"
                className="text-xs font-medium text-gray-700 dark:text-gray-400 hover:text-[#D4AF37] dark:hover:text-[#D4AF37] transition-all duration-200 py-1.5 px-3 rounded-md hover:bg-[#D4AF37]/5 dark:hover:bg-[#D4AF37]/10"
              >
                Pendants
              </Link>
              <Link
                href="/products?category=bracelets"
                className="text-xs font-medium text-gray-700 dark:text-gray-400 hover:text-[#D4AF37] dark:hover:text-[#D4AF37] transition-all duration-200 py-1.5 px-3 rounded-md hover:bg-[#D4AF37]/5 dark:hover:bg-[#D4AF37]/10"
              >
                Bracelets
              </Link>
              <Link
                href="/products?category=necklaces"
                className="text-xs font-medium text-gray-700 dark:text-gray-400 hover:text-[#D4AF37] dark:hover:text-[#D4AF37] transition-all duration-200 py-1.5 px-3 rounded-md hover:bg-[#D4AF37]/5 dark:hover:bg-[#D4AF37]/10"
              >
                Necklaces
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      <Cart open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
};

export default Header;
