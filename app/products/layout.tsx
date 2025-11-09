import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Products - Handcrafted Jewellery Collection",
  description: "Browse our complete collection of handcrafted, anti-tarnish jewellery. Shop rings, earrings, pendants, bracelets, and necklaces. Timeless pieces made to last.",
  keywords: [
    "jewellery collection",
    "rings",
    "earrings",
    "pendants",
    "bracelets",
    "necklaces",
    "handcrafted jewellery",
    "anti-tarnish jewellery",
    "gold plated jewellery",
  ],
  openGraph: {
    title: "Our Products - Vairanya Jewellery Collection",
    description: "Browse our complete collection of handcrafted, anti-tarnish jewellery.",
    type: "website",
    url: "https://vairanya.in/products",
  },
  alternates: {
    canonical: "https://vairanya.in/products",
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

