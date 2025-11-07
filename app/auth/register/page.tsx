"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.success) {
      setError(data.error || "Registration failed");
      return;
    }
    router.push("/auth/login?registered=1");
  };

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-md mx-auto px-6 py-16">
        <h1 className="font-serif text-3xl mb-6 text-center">Create Account</h1>
        <form onSubmit={onSubmit} className="bg-white rounded-lg border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <Button type="submit" disabled={loading} className="w-full bg-[#D4AF37] hover:bg-[#C19B2E]">
            {loading ? "Creating..." : "Create Account"}
          </Button>
        </form>
        <p className="text-sm text-center text-gray-600 mt-4">
          Already have an account? <Link href="/auth/login" className="text-[#D4AF37] hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}


