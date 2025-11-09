import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us - Get in Touch",
  description: "Get in touch with Vairanya. We'd love to hear from you. Contact us via email, phone, or send us a message. We're here to help with your jewellery needs.",
  keywords: ["contact vairanya", "jewellery contact", "customer service", "support"],
  openGraph: {
    title: "Contact Us - Vairanya",
    description: "Get in touch with Vairanya. We'd love to hear from you.",
    type: "website",
    url: "https://vairanya.in/contact",
  },
  alternates: {
    canonical: "https://vairanya.in/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

