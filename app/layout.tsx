import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { ToastProvider } from "@/components/ToastProvider";
import { AuthProvider } from "@/components/AuthProvider";
import RouteLoader from "@/components/RouteLoader";
import { Suspense } from "react";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Vairanya — Handcrafted Anti-Tarnish Jewellery | Where Elegance Meets Soul",
  description: "Vairanya offers handcrafted, anti-tarnish jewellery designed for everyday elegance. Shop rings, earrings, pendants — timeless pieces made to last.",
  keywords: ["jewellery", "anti-tarnish", "handcrafted", "gold plated", "hypoallergenic", "rings", "earrings", "pendants"],
  icons: {
    icon: "/images/logo-ivory.png",
    shortcut: "/images/logo-ivory.png",
    apple: "/images/logo-ivory.png",
  },
  openGraph: {
    title: "Vairanya — Handcrafted Anti-Tarnish Jewellery",
    description: "Where Elegance Meets Soul. Shop timeless jewellery pieces designed for everyday grace.",
    type: "website",
    locale: "en_IN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${inter.variable} antialiased font-sans`}
      >
        <AuthProvider>
          <ToastProvider>
            <WishlistProvider>
              <CartProvider>
                <Suspense fallback={null}>
                  <RouteLoader />
                </Suspense>
                {children}
              </CartProvider>
            </WishlistProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
