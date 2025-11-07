"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import Cart from "./Cart";
import { useCart } from "@/lib/cart-context";
import { ShoppingBag, LogIn, LogOut, Heart, Search, Menu, User, ChevronDown, Shield, Briefcase } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useWishlist } from "@/lib/wishlist-context";
import { getAdminSession, isAdminAuthenticated } from "@/lib/admin-auth";

const Header: React.FC = () => {
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isWorker, setIsWorker] = useState(false);
  const [adminDashboardPath, setAdminDashboardPath] = useState("/admin");
  const { getTotalItems } = useCart();
  const { user, signinWithGoogle, signout, adminInfo } = useAuth();
  const { items: wishlistItems } = useWishlist();

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
      router.push(`/collection?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 shadow-sm">
        {/* Top Bar */}
        <div className="bg-black text-white py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-3 sm:gap-6">
                <span className="hidden sm:inline text-gray-300">Free shipping on orders over ₹999</span>
                {/* Worker Dashboard Button */}
                {mounted && isWorker && user && (
                  <Link
                    href="/worker/dashboard"
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-md border border-white/20 transition-all text-[10px] font-medium"
                  >
                    <Briefcase className="h-3 w-3" />
                    <span className="hidden sm:inline">Worker Dashboard</span>
                    <span className="sm:hidden">Worker</span>
                  </Link>
                )}
                {/* Admin Panel Button */}
                {mounted && isAdmin && !isWorker && (
                  <Link
                    href={adminDashboardPath}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-md border border-white/20 transition-all text-[10px] font-medium"
                  >
                    <Shield className="h-3 w-3" />
                    <span className="hidden sm:inline">Admin Panel</span>
                    <span className="sm:hidden">Admin</span>
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-4 text-gray-300">
                {user ? (
                  <>
                    <Link href="/account" className="hover:text-white transition-colors text-xs">
                      Hello, {user.displayName?.split(" ")[0] || "User"}
                    </Link>
                    <button
                      onClick={signout}
                      className="hover:text-white transition-colors text-xs"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={signinWithGoogle}
                    className="hover:text-white transition-colors text-xs"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group" aria-label="Go to home">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                <Image src="/images/logo-ivory.png" alt="Vairanya logo" width={40} height={40} priority />
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <h1 className="text-lg md:text-xl font-serif tracking-wider font-semibold">VAIRANYA</h1>
                <div className="text-[9px] md:text-[10px] text-gray-500 leading-none">Where Elegance Meets Soul</div>
              </div>
            </Link>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-xl mx-8">
              <div className="flex w-full relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search jewellery..."
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] bg-gray-50/80 backdrop-blur-sm transition-all text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-[#D4AF37] hover:bg-[#C19B2E] text-white rounded-full transition-all duration-300 shadow-sm hover:shadow-md"
                  aria-label="Search"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </form>

            {/* Right Side Actions */}
            <div className="flex items-center gap-1 sm:gap-3">
              {/* Mobile Search Button */}
              <button
                onClick={() => router.push("/collection")}
                className="lg:hidden p-2 text-gray-700 hover:text-[#D4AF37] transition-colors rounded-lg hover:bg-gray-100"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist - Desktop Only */}
              {user && (
                <Link
                  href="/wishlist"
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-2 text-sm text-gray-700 hover:text-[#D4AF37] transition-colors relative rounded-lg hover:bg-gray-50"
                  aria-label="Wishlist"
                >
                  <Heart className="h-5 w-5" />
                  <span className="hidden lg:inline text-sm font-medium">Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4AF37] text-[10px] text-white font-semibold">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-2 text-sm text-gray-700 hover:text-[#D4AF37] transition-colors relative rounded-lg hover:bg-gray-50"
                aria-label={`Cart with ${totalItems} items`}
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="hidden sm:inline text-sm font-medium">Cart</span>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4AF37] text-[10px] text-white font-semibold">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Account Menu - Rightmost (Desktop Only) */}
              <div className="relative hidden md:block">
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowAccountMenu(!showAccountMenu)}
                      className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:opacity-80 transition-all rounded-full hover:ring-2 hover:ring-[#D4AF37]/30"
                      aria-label="Account menu"
                    >
                      {user.photoURL ? (
                        <div className="relative">
                          <Image
                            src={user.photoURL}
                            alt={user.displayName || "User"}
                            width={32}
                            height={32}
                            className="rounded-full border-2 border-gray-200 hover:border-[#D4AF37] transition-colors"
                          />
                          <ChevronDown className="h-3 w-3 absolute -bottom-1 -right-1 bg-white rounded-full border border-gray-300 p-0.5" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C19B2E] flex items-center justify-center text-white font-semibold text-sm">
                            {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <ChevronDown className="h-3.5 w-3.5 hidden sm:inline text-gray-500" />
                        </div>
                      )}
                      <span className="hidden lg:inline text-sm font-medium ml-1">Account</span>
                    </button>
                    {showAccountMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowAccountMenu(false)}
                        />
                        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 backdrop-blur-xl">
                          <Link
                            href="/account"
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37] transition-colors"
                            onClick={() => setShowAccountMenu(false)}
                          >
                            My Account
                          </Link>
                          <Link
                            href="/account?tab=orders"
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37] transition-colors"
                            onClick={() => setShowAccountMenu(false)}
                          >
                            Orders
                          </Link>
                          <Link
                            href="/wishlist"
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37] transition-colors"
                            onClick={() => setShowAccountMenu(false)}
                          >
                            Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                          </Link>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            onClick={() => {
                              setShowAccountMenu(false);
                              signout();
                            }}
                            className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                          >
                            Sign Out
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={signinWithGoogle}
                    className="flex items-center gap-1.5 px-2.5 py-2 text-sm text-gray-700 hover:text-[#D4AF37] transition-colors rounded-lg hover:bg-gray-50"
                    aria-label="Sign in"
                  >
                    <LogIn className="h-5 w-5" />
                    <span className="hidden sm:inline text-sm font-medium">Sign In</span>
                  </button>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-gray-700 hover:text-[#D4AF37] transition-colors rounded-lg hover:bg-gray-50"
                aria-label="Menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden pb-4 border-t border-gray-100 pt-4">
              {/* Mobile Search Bar */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] bg-gray-50 text-sm"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#C19B2E] text-white rounded-full transition-all shadow-sm"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </div>
              </form>

              {/* Mobile Account Section - Top */}
              {user ? (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="px-4 py-2 flex items-center gap-3 mb-3">
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt={user.displayName || "User"}
                        width={40}
                        height={40}
                        className="rounded-full border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C19B2E] flex items-center justify-center text-white font-semibold">
                        {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {user.displayName || "User"}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Link
                      href="/account"
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37] rounded-lg transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      My Account
                    </Link>
                    <Link
                      href="/account?tab=orders"
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37] rounded-lg transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Orders
                    </Link>
                    <Link
                      href="/wishlist"
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37] rounded-lg transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                    </Link>
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        signout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 rounded-lg transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      signinWithGoogle();
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37] rounded-lg transition-colors"
                  >
                    <LogIn className="h-5 w-5" />
                    Sign In
                  </button>
                </div>
              )}

              {/* Mobile Navigation Links - Bottom */}
              <nav className="flex flex-col gap-1">
                <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Shop</p>
                <Link
                  href="/collection"
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37] rounded-lg transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  All Products
                </Link>
                <Link
                  href="/collection?category=rings"
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37] rounded-lg transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Rings
                </Link>
                <Link
                  href="/collection?category=earrings"
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37] rounded-lg transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Earrings
                </Link>
                <Link
                  href="/collection?category=pendants"
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37] rounded-lg transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Pendants
                </Link>
                <Link
                  href="/collection?category=bracelets"
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37] rounded-lg transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Bracelets
                </Link>
                <Link
                  href="/collection?category=necklaces"
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#D4AF37] rounded-lg transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Necklaces
                </Link>
              </nav>
            </div>
          )}
        </div>

        {/* Navigation Bar */}
        <div className="hidden md:block border-t border-gray-100/50 bg-white/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center justify-center gap-0.5 h-12">
              <Link
                href="/collection"
                className="text-sm font-medium text-gray-700 hover:text-[#D4AF37] transition-all duration-200 py-2 px-4 rounded-lg hover:bg-[#D4AF37]/5 relative group"
              >
                All Products
                <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-[#D4AF37] group-hover:w-2/3 transition-all duration-200"></span>
              </Link>
              <Link
                href="/collection?category=rings"
                className="text-sm font-medium text-gray-700 hover:text-[#D4AF37] transition-all duration-200 py-2 px-4 rounded-lg hover:bg-[#D4AF37]/5 relative group"
              >
                Rings
                <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-[#D4AF37] group-hover:w-2/3 transition-all duration-200"></span>
              </Link>
              <Link
                href="/collection?category=earrings"
                className="text-sm font-medium text-gray-700 hover:text-[#D4AF37] transition-all duration-200 py-2 px-4 rounded-lg hover:bg-[#D4AF37]/5 relative group"
              >
                Earrings
                <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-[#D4AF37] group-hover:w-2/3 transition-all duration-200"></span>
              </Link>
              <Link
                href="/collection?category=pendants"
                className="text-sm font-medium text-gray-700 hover:text-[#D4AF37] transition-all duration-200 py-2 px-4 rounded-lg hover:bg-[#D4AF37]/5 relative group"
              >
                Pendants
                <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-[#D4AF37] group-hover:w-2/3 transition-all duration-200"></span>
              </Link>
              <Link
                href="/collection?category=bracelets"
                className="text-sm font-medium text-gray-700 hover:text-[#D4AF37] transition-all duration-200 py-2 px-4 rounded-lg hover:bg-[#D4AF37]/5 relative group"
              >
                Bracelets
                <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-[#D4AF37] group-hover:w-2/3 transition-all duration-200"></span>
              </Link>
              <Link
                href="/collection?category=necklaces"
                className="text-sm font-medium text-gray-700 hover:text-[#D4AF37] transition-all duration-200 py-2 px-4 rounded-lg hover:bg-[#D4AF37]/5 relative group"
              >
                Necklaces
                <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-[#D4AF37] group-hover:w-2/3 transition-all duration-200"></span>
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
