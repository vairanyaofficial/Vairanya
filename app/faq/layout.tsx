import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions",
  description: "Find answers to frequently asked questions about Vairanya jewellery. Learn about anti-tarnish properties, care instructions, shipping, returns, and more.",
  keywords: [
    "jewellery FAQ",
    "anti-tarnish FAQ",
    "jewellery care",
    "shipping policy",
    "returns policy",
    "jewellery questions",
  ],
  openGraph: {
    title: "FAQ - Vairanya",
    description: "Find answers to frequently asked questions about Vairanya jewellery.",
    type: "website",
    url: "https://vairanya.in/faq",
  },
  alternates: {
    canonical: "https://vairanya.in/faq",
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

