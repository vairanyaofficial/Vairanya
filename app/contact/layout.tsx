import type { Metadata } from "next";

const baseUrl = "https://vairanya.in";

export const metadata: Metadata = {
  title: "Contact Us - Get in Touch | Vairanya Jewellery",
  description: "Get in touch with Vairanya. Contact us via email (hello@vairanya.in), phone (+91-9691998370), or send us a message. We're here to help with your jewellery needs, questions, and custom orders.",
  keywords: [
    "contact vairanya",
    "jewellery contact",
    "customer service",
    "jewellery support",
    "Vairanya contact",
    "jewellery inquiries",
    "custom jewellery orders",
  ],
  openGraph: {
    title: "Contact Us - Get in Touch | Vairanya",
    description: "Get in touch with Vairanya. Contact us via email, phone, or send us a message. We're here to help with your jewellery needs.",
    type: "website",
    url: `${baseUrl}/contact`,
    siteName: "Vairanya",
    images: [
      {
        url: `${baseUrl}/images/hero-jewelry.jpg`,
        width: 1200,
        height: 630,
        alt: "Contact Vairanya Jewellery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us - Get in Touch | Vairanya",
    description: "Get in touch with Vairanya. We're here to help with your jewellery needs.",
    images: [`${baseUrl}/images/hero-jewelry.jpg`],
  },
  alternates: {
    canonical: `${baseUrl}/contact`,
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

