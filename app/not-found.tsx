"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="text-center max-w-md">
          {/* Animated 404 Number */}
          <div className="mb-8">
            <h1 
              className={`font-serif text-8xl md:text-9xl font-light text-[#D4AF37] transition-opacity duration-1000 ${
                mounted ? "opacity-100 animate-pulse-gentle" : "opacity-70"
              }`}
            >
              404
            </h1>
          </div>

          {/* Animated Text */}
          <div className="space-y-4 mb-8">
            <h2 
              className={`font-serif text-3xl md:text-4xl text-gray-800 transition-all duration-700 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{
                transitionDelay: "200ms",
              }}
            >
              Nothing Here
            </h2>
            
          </div>

          {/* Animated Button */}
          <div
            className={`transition-all duration-700 ${
              mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
            style={{
              transitionDelay: "600ms",
            }}
          >
            <Button 
              asChild 
              className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white px-8 py-6 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Link href="/" className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Go to Home
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

