import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="font-serif text-4xl mb-4">Product Not Found</h1>
        <p className="text-gray-600 mb-8">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild className="bg-[#D4AF37] hover:bg-[#C19B2E]">
          <Link href="/collection">Browse Collection</Link>
        </Button>
      </main>
      <Footer />
    </div>
  );
}

