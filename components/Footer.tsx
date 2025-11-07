import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/10">
                <Image
                  src="/images/logo-ivory.png"
                  alt="Vairanya"
                  width={28}
                  height={28}
                />
              </div>
              <h3 className="font-serif text-lg tracking-wider font-semibold">VAIRANYA</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed max-w-xs">
              Where Elegance Meets Soul. Handcrafted, anti-tarnish jewellery for everyday grace.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/vairanya.official/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-[#D4AF37] transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://facebook.com/vairanya"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-[#D4AF37] transition-all duration-300"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://in.pinterest.com/vairanyao/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-[#D4AF37] transition-all duration-300"
                aria-label="Pinterest"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 19c-.721 0-1.418-.109-2.076-.312.286-.465.713-1.227.876-1.878.066-.254.427-1.812.427-1.812s.109-.219.109-.541c0-.506-.293-.883-.658-.883-.52 0-.754.391-.754.812 0 .488.326 1.215.494 1.76.141.533.283 1.102.283 1.484 0 .566-.336 1.041-.816 1.041-.643 0-1.127-.83-1.127-1.898 0-1.517 1.103-2.773 2.873-2.773 1.502 0 2.332.916 2.332 2.133 0 1.512-.955 2.789-2.28 2.789-.446 0-.866-.233-1.009-.512 0 0-.22.84-.273 1.046-.099.376-.371.847-.551 1.133A11.96 11.96 0 0 0 12 19z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-5 text-gray-300">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/collection" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                  Collection
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-5 text-gray-300">Customer Care</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/shipping-returns"
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-5 text-gray-300">Contact</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#D4AF37]" />
                <a href="mailto:hello@vairanya.in" className="hover:text-white transition-colors duration-200">
                  hello@vairanya.in
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#D4AF37]" />
                <a href="tel:+919691998370" className="hover:text-white transition-colors duration-200">
                  +91 9691998370
                </a>
              </li>
              <li className="flex items-start gap-2.5 pt-1">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#D4AF37]" />
                <div>
                  <p className="text-xs">Betul, Madhya Pradesh</p>
                  <p className="text-xs">India</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} Vairanya. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

