import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { ToastProvider } from "@/components/ToastProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ImageKitProviderWrapper } from "@/components/ImageKitProviderWrapper";
import { SpeedInsights } from "@vercel/speed-insights/next"

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

const baseUrl = "https://vairanya.in";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Vairanya — Handcrafted Anti-Tarnish Jewellery | Where Elegance Meets Soul",
    template: "%s | Vairanya",
  },
  description: "Vairanya offers handcrafted, anti-tarnish jewellery designed for everyday elegance. Shop rings, earrings, pendants, bracelets — timeless pieces made to last. Hypoallergenic, gold plated, and beautifully crafted.",
  keywords: [
    "jewellery",
    "anti-tarnish jewellery",
    "handcrafted jewellery",
    "gold plated jewellery",
    "hypoallergenic jewellery",
    "rings",
    "earrings",
    "pendants",
    "bracelets",
    "necklaces",
    "jewelry India",
    "online jewellery store",
    "affordable jewellery",
    "everyday jewellery",
    "minimalist jewellery",
  ],
  authors: [{ name: "Vairanya" }],
  creator: "Vairanya",
  publisher: "Vairanya",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/images/logo-ivory.png",
    shortcut: "/images/logo-ivory.png",
    apple: "/images/logo-ivory.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: baseUrl,
    siteName: "Vairanya",
    title: "Vairanya — Handcrafted Anti-Tarnish Jewellery",
    description: "Where Elegance Meets Soul. Shop timeless, handcrafted jewellery pieces designed for everyday grace. Anti-tarnish, hypoallergenic, and beautifully crafted.",
    images: [
      {
        url: `${baseUrl}/images/hero-jewelry.jpg`,
        width: 1200,
        height: 630,
        alt: "Vairanya Handcrafted Jewellery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vairanya — Handcrafted Anti-Tarnish Jewellery",
    description: "Where Elegance Meets Soul. Shop timeless, handcrafted jewellery pieces.",
    images: [`${baseUrl}/images/hero-jewelry.jpg`],
  },
  alternates: {
    canonical: baseUrl,
  },
  verification: {
    // Add Google Search Console verification when available
    // google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${inter.variable} antialiased font-sans`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var shouldBeDark = theme === 'dark' || (!theme && prefersDark);
                  if (shouldBeDark) {
                    document.documentElement.classList.add('dark');
                  }
                  // Don't add transition class on initial load to prevent flash
                } catch (e) {}
              })();
            `,
          }}
        />
        <ThemeProvider>
          <ErrorBoundary>
            <ImageKitProviderWrapper 
              urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/zjax0fbrm"}
            >
              <AuthProvider>
                <ToastProvider>
                  <WishlistProvider>
                    <CartProvider>
                      {children}
                    </CartProvider>
                  </WishlistProvider>
                </ToastProvider>
              </AuthProvider>
            </ImageKitProviderWrapper>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
