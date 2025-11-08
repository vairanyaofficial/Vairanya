"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { Sparkles, ArrowRight, User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";

// Google Icon Component
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export default function RegisterPage() {
  const router = useRouter();
  const { signupWithEmailPassword, signinWithGoogle } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signupWithEmailPassword(email, password, name, phone || undefined);
      router.push("/login?registered=1");
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signinWithGoogle();
      // Redirect will be handled by AuthProvider
    } catch (err: any) {
      const errorMessage = err?.message || "Sign up with Google failed. Please try again.";
      setError(errorMessage);
      setGoogleLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-amber-50/30 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#D4AF37]/20 to-amber-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-slate-200/30 to-amber-100/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-[#D4AF37]/10 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Logo/Brand Section */}
        <div className="text-center mb-5 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#C19B2E] shadow-lg shadow-[#D4AF37]/25 mb-3">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
            Join Vairanya
          </h1>
          <p className="text-slate-600 text-base">
            Create your account and start shopping
          </p>
        </div>

        {/* Main Card */}
        <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-2xl shadow-slate-200/50 p-6 sm:p-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {error && (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 p-3 animate-in slide-in-from-top-2">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center mt-0.5">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Google Sign Up Button */}
          <Button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            className="w-full group relative overflow-hidden bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 text-slate-700 h-12 text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {googleLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing up...
                </>
              ) : (
                <>
                  <GoogleIcon className="h-5 w-5" />
                  Continue with Google
                </>
              )}
            </span>
          </Button>

          {/* Divider */}
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 px-4 text-xs font-medium text-slate-500">OR</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={onSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white/50 focus:bg-white focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 outline-none transition-all duration-200 text-slate-900 placeholder:text-slate-400 text-sm"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white/50 focus:bg-white focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 outline-none transition-all duration-200 text-slate-900 placeholder:text-slate-400 text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Phone <span className="text-slate-400 font-normal">(Optional)</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white/50 focus:bg-white focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 outline-none transition-all duration-200 text-slate-900 placeholder:text-slate-400 text-sm"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-12 py-2.5 rounded-xl border-2 border-slate-200 bg-white/50 focus:bg-white focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 outline-none transition-all duration-200 text-slate-900 placeholder:text-slate-400 text-sm"
                  placeholder="Create a password (min. 6 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full group relative overflow-hidden bg-gradient-to-r from-[#D4AF37] to-[#C19B2E] hover:from-[#C19B2E] hover:to-[#B8922A] text-white h-12 text-base font-semibold rounded-xl shadow-lg shadow-[#D4AF37]/30 hover:shadow-xl hover:shadow-[#D4AF37]/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] mt-4"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            </Button>
          </form>

          {/* Terms */}
          <p className="text-xs text-center text-slate-500 pt-3 border-t border-slate-100 leading-relaxed">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-[#D4AF37] hover:underline font-medium">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-[#D4AF37] hover:underline font-medium">Privacy Policy</Link>
          </p>
        </div>

        {/* Login Link */}
        <p className="text-center text-slate-600 mt-5 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
          Already have an account?{" "}
          <Link 
            href="/login" 
            className="inline-flex items-center gap-1 text-[#D4AF37] hover:text-[#C19B2E] font-semibold transition-colors group"
          >
            Sign in
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </p>
      </div>
    </main>
  );
}
