import type { Metadata } from "next";

const baseUrl = "https://vairanya.in";

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions | Vairanya Jewellery",
  description: "Find answers to frequently asked questions about Vairanya jewellery. Learn about anti-tarnish properties, care instructions, shipping, returns, sizing, payment methods, and more.",
  keywords: [
    "jewellery FAQ",
    "anti-tarnish FAQ",
    "jewellery care",
    "shipping policy",
    "returns policy",
    "jewellery questions",
    "Vairanya FAQ",
    "jewellery sizing",
    "jewellery payment",
  ],
  openGraph: {
    title: "FAQ - Frequently Asked Questions | Vairanya",
    description: "Find answers to frequently asked questions about Vairanya jewellery. Learn about anti-tarnish properties, care instructions, shipping, returns, and more.",
    type: "website",
    url: `${baseUrl}/faq`,
    siteName: "Vairanya",
    images: [
      {
        url: `${baseUrl}/images/hero-jewelry.jpg`,
        width: 1200,
        height: 630,
        alt: "Vairanya Jewellery FAQ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ - Frequently Asked Questions | Vairanya",
    description: "Find answers to frequently asked questions about Vairanya jewellery.",
    images: [`${baseUrl}/images/hero-jewelry.jpg`],
  },
  alternates: {
    canonical: `${baseUrl}/faq`,
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

