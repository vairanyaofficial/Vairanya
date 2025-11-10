"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Mail, Phone, MapPin, User, ShoppingBag, Heart } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useWishlist } from "@/lib/wishlist-context";

const Footer: React.FC = () => {
  const { user } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const wishlistCount = wishlistItems.length;

  return (
    <footer className="bg-black dark:bg-black text-white border-t border-[#1a1a1a] dark:border-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5">
        {/* Main Footer Content - Compact Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-5 mb-4 md:mb-5">
          {/* Brand - Compact */}
          <div className="col-span-2 sm:col-span-3 md:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                <Image
                  src="/images/logo-ivory.png"
                  alt="Vairanya"
                  width={20}
                  height={20}
                  className="md:w-5 md:h-5"
                />
              </div>
              <h3 className="font-serif text-xs md:text-sm tracking-wider font-semibold">VAIRANYA</h3>
            </div>
            <p className="text-gray-400 text-[10px] md:text-xs mb-3 leading-snug max-w-xs">
              Where Elegance Meets Soul. Handcrafted, anti-tarnish jewellery for everyday grace.
            </p>
            <div className="flex gap-1.5">
              <a
                href="https://www.instagram.com/vairanya.official/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-[#D4AF37]/20 text-gray-400 hover:text-[#D4AF37] transition-all duration-300 border border-white/5 hover:border-[#D4AF37]/30"
                aria-label="Instagram"
              >
                <Instagram className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </a>
              <a
                href="https://facebook.com/vairanya"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-[#D4AF37]/20 text-gray-400 hover:text-[#D4AF37] transition-all duration-300 border border-white/5 hover:border-[#D4AF37]/30"
                aria-label="Facebook"
              >
                <Facebook className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </a>
              <a
                href="https://in.pinterest.com/vairanyao/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-[#D4AF37]/20 text-gray-400 hover:text-[#D4AF37] transition-all duration-300 border border-white/5 hover:border-[#D4AF37]/30"
                aria-label="Pinterest"
              >
                <svg className="h-3.5 w-3.5 md:h-4 md:w-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 19c-.721 0-1.418-.109-2.076-.312.286-.465.713-1.227.876-1.878.066-.254.427-1.812.427-1.812s.109-.219.109-.541c0-.506-.293-.883-.658-.883-.52 0-.754.391-.754.812 0 .488.326 1.215.494 1.76.141.533.283 1.102.283 1.484 0 .566-.336 1.041-.816 1.041-.643 0-1.127-.83-1.127-1.898 0-1.517 1.103-2.773 2.873-2.773 1.502 0 2.332.916 2.332 2.133 0 1.512-.955 2.789-2.28 2.789-.446 0-.866-.233-1.009-.512 0 0-.22.84-.273 1.046-.099.376-.371.847-.551 1.133A11.96 11.96 0 0 0 12 19z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* My Account */}
          <div>
            <h4 className="font-semibold text-[10px] md:text-xs uppercase tracking-wider mb-2 text-gray-300 font-serif">My Account</h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/account" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-200 text-[11px] md:text-xs flex items-center gap-1.5">
                  <User className="h-3 w-3" />
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/account?tab=orders" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-200 text-[11px] md:text-xs flex items-center gap-1.5">
                  <ShoppingBag className="h-3 w-3" />
                  Orders
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-200 text-[11px] md:text-xs flex items-center gap-1.5">
                  <Heart className="h-3 w-3" />
                  Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-[10px] md:text-xs uppercase tracking-wider mb-2 text-gray-300 font-serif">Quick Links</h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-200 text-[11px] md:text-xs">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-200 text-[11px] md:text-xs">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-200 text-[11px] md:text-xs">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-semibold text-[10px] md:text-xs uppercase tracking-wider mb-2 text-gray-300 font-serif">Customer Care</h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/shipping-returns" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-200 text-[11px] md:text-xs">
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-200 text-[11px] md:text-xs">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-[#D4AF37] transition-colors duration-200 text-[11px] md:text-xs">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info - Compact */}
          <div className="col-span-2 sm:col-span-1">
            <h4 className="font-semibold text-[10px] md:text-xs uppercase tracking-wider mb-2 text-gray-300 font-serif">Contact</h4>
            <ul className="space-y-1.5 text-[11px] md:text-xs text-gray-400">
              <li className="flex items-start gap-1.5">
                <Mail className="h-3 w-3 mt-0.5 shrink-0 text-[#D4AF37]" />
                <a href="mailto:hello@vairanya.in" className="hover:text-[#D4AF37] transition-colors duration-200 break-all leading-tight">
                  hello@vairanya.in
                </a>
              </li>
              <li className="flex items-start gap-1.5">
                <Phone className="h-3 w-3 mt-0.5 shrink-0 text-[#D4AF37]" />
                <a href="tel:+919691998370" className="hover:text-[#D4AF37] transition-colors duration-200 leading-tight">
                  +91 9691998370
                </a>
              </li>
              <li className="flex items-start gap-1.5">
                <Phone className="h-3 w-3 mt-0.5 shrink-0 text-[#D4AF37]" />
                <a href="tel:+919131394450" className="hover:text-[#D4AF37] transition-colors duration-200 leading-tight">
                  +91 91313 94450
                </a>
              </li>
              <li className="flex items-start gap-1.5">
                <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-[#D4AF37]" />
                <div className="leading-tight">
                  <p>Betul, Madhya Pradesh</p>
                  <p>India</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom - Compact */}
        <div className="border-t border-gray-800 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] md:text-xs text-gray-500 text-center sm:text-left">&copy; {new Date().getFullYear()} Vairanya. All rights reserved.</p>
          <div className="flex gap-3 text-[10px] md:text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-[#D4AF37] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#D4AF37] transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

