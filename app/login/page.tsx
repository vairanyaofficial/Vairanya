"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { getAdminSession, setAdminSession } from "@/lib/admin-auth";

import { Shield, Lock, Sparkles, ArrowRight, Mail, Key } from "lucide-react";

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

type LoginMethod = "google" | "email";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
  const registered = searchParams.get("registered");
  const mode = searchParams.get("mode") || "customer";
  
  const { signinWithGoogle, signinWithEmailPassword, signinAsAdmin, user, adminInfo } = useAuth();
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  
  // Login method state
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("google");
  
  // Email/Password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  

  // Show success message if just registered
  useEffect(() => {
    if (registered === "1") {
      setSuccessMessage("Registration successful! Please sign in.");
      setError("");
    }
  }, [registered]);

  // Redirect logic for admin mode
  useEffect(() => {
    if (mode !== "admin" || hasRedirected) return;
    if (adminLoading) return;
    
    const session = getAdminSession();
    if (adminInfo && session) {
      const role = session.role || adminInfo.role;
      let redirectPath = "/admin";
      if (role === "worker") {
        redirectPath = "/worker/dashboard";
      }
      setHasRedirected(true);
      window.location.href = redirectPath;
      return;
    }
    
    if (user && !adminInfo && !session) {
      setHasRedirected(true);
      window.location.href = "/";
      return;
    }
  }, [user, adminInfo, mode, adminLoading, hasRedirected]);

  // Check if user is a worker/admin after customer login
  useEffect(() => {
    if (mode !== "customer" || !user || checkingAdmin) return;
    
    const session = getAdminSession();
    if (session) {
      const role = session.role;
      if (role === "worker") {
        router.replace("/worker/dashboard");
      } else {
        router.replace("/admin");
      }
      return;
    }

    const verifyWorker = async () => {
      setCheckingAdmin(true);
      let isAdminOrWorker = false;
      try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            isAdminOrWorker = true;
            const adminUser = {
              username: data.user.username,
              role: data.user.role as "superuser" | "worker",
              name: data.user.name || data.user.username,
              password: "",
            };
            
            setAdminSession(adminUser);
            
            if (typeof window !== "undefined") {
              localStorage.setItem("va_admin_session_local", JSON.stringify({
                username: data.user.username,
                role: data.user.role,
                name: data.user.name,
              }));
            }
            
            if (data.user.role === "worker") {
              window.location.href = "/worker/dashboard";
            } else {
              window.location.href = "/admin";
            }
            return;
          }
        }
      } catch (err) {
        // If check fails, treat as regular customer
      } finally {
        setCheckingAdmin(false);
        if (!isAdminOrWorker) {
          router.replace(callbackUrl);
        }
      }
    };

    verifyWorker();
  }, [user, router, callbackUrl, mode, checkingAdmin]);

  const handleCustomerLogin = async () => {
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      await signinWithGoogle();
    } catch (err: any) {
      const errorMessage = err?.message || "Sign in failed. Please try again.";
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setEmailLoading(true);
    try {
      await signinWithEmailPassword(email, password);
      // Don't set loading to false - let useEffect handle redirect
    } catch (err: any) {
      const errorMessage = err?.message || "Sign in failed. Please try again.";
      setError(errorMessage);
      setEmailLoading(false);
    }
  };


  const handleAdminLogin = async () => {
    setError("");
    setSuccessMessage("");
    setAdminLoading(true);
    try {
      await signinAsAdmin();
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      let session = getAdminSession();
      let attempts = 0;
      while (!session && attempts < 5) {
        await new Promise(resolve => setTimeout(resolve, 100));
        session = getAdminSession();
        attempts++;
      }
      
      if (!session) {
        throw new Error("Failed to establish admin session. Please try again.");
      }
      
      const role = session.role;
      let redirectPath = "/admin";
      if (role === "worker") {
        redirectPath = "/worker/dashboard";
      } else if (role === "admin" || role === "superuser") {
        redirectPath = "/admin";
      }
      
      if (typeof window !== "undefined") {
        window.location.href = redirectPath;
      } else {
        router.replace(redirectPath);
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Sign in failed. Make sure your Google account is registered as admin.";
      setError(errorMessage);
      setAdminLoading(false);
    }
  };

  const isAdminMode = mode === "admin";

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
            {isAdminMode ? (
              <Lock className="h-6 w-6 text-white" />
            ) : (
              <Sparkles className="h-6 w-6 text-white" />
            )}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
            {isAdminMode ? "Admin Portal" : "Welcome Back"}
          </h1>
          <p className="text-slate-600 text-base">
            {isAdminMode ? "Secure access to Vairanya Admin Panel" : "Sign in to continue your journey"}
          </p>
        </div>

        {/* Main Card */}
        <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-2xl shadow-slate-200/50 p-6 sm:p-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Success Message */}
          {successMessage && (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50 p-3 animate-in slide-in-from-top-2">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center mt-0.5">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-emerald-800">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 p-3 animate-in slide-in-from-top-2">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center mt-0.5">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="flex-1">
                  {isAdminMode && (
                    <div className="font-semibold text-red-900 mb-1 text-sm">Access Denied</div>
                  )}
                  <p className="text-sm text-red-800">{error}</p>
                  {isAdminMode && (
                    <p className="text-xs text-red-700 mt-1">
                      If you believe you should have access, please contact a superadmin.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {isAdminMode ? (
            <div className="space-y-4">
              {/* Security Notice */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50/50 border border-amber-200/60 p-4">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Lock className="h-4 w-4 text-amber-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-900 mb-1">Secure Access Only</p>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Only pre-approved admins and workers can access this panel.
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Login Button */}
              <Button 
                onClick={handleAdminLogin} 
                disabled={adminLoading}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-[#D4AF37] to-[#C19B2E] hover:from-[#C19B2E] hover:to-[#B8922A] text-white h-12 text-base font-semibold rounded-xl shadow-lg shadow-[#D4AF37]/30 hover:shadow-xl hover:shadow-[#D4AF37]/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {adminLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying access...
                    </>
                  ) : (
                    <>
                      <GoogleIcon className="h-5 w-5" />
                      Sign in with Google
                    </>
                  )}
                </span>
              </Button>

              <div className="text-center">
                <Link href="/login">
                  <Button 
                    variant="outline"
                    className="w-full border-2 border-slate-200 hover:border-[#D4AF37] hover:bg-gradient-to-r hover:from-[#D4AF37]/5 hover:to-amber-50/50 h-11 text-base font-medium rounded-xl transition-all duration-300"
                  >
                    <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                    Customer Login
                  </Button>
                </Link>
              </div>

              <div className="text-center pt-1">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-[#D4AF37] transition-colors font-medium group"
                >
                  <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                  Back to Website
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Login Method Tabs */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => {
                    setLoginMethod("google");
                    setError("");
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    loginMethod === "google"
                      ? "bg-white text-[#D4AF37] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Google
                </button>
                <button
                  onClick={() => {
                    setLoginMethod("email");
                    setError("");
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    loginMethod === "email"
                      ? "bg-white text-[#D4AF37] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Email
                </button>
              </div>

              {/* Google Login */}
              {loginMethod === "google" && (
                <>
                  <Button 
                    onClick={handleCustomerLogin} 
                    disabled={loading}
                    className="w-full group relative overflow-hidden bg-gradient-to-r from-[#D4AF37] to-[#C19B2E] hover:from-[#C19B2E] hover:to-[#B8922A] text-white h-12 text-base font-semibold rounded-xl shadow-lg shadow-[#D4AF37]/30 hover:shadow-xl hover:shadow-[#D4AF37]/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Signing in...
                        </>
                      ) : (
                        <>
                          <GoogleIcon className="h-5 w-5" />
                          Sign in with Google
                        </>
                      )}
                    </span>
                  </Button>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white/80 text-slate-500 font-medium">or</span>
                    </div>
                  </div>

                  <Link href="/login?mode=admin">
                    <Button 
                      variant="outline"
                      className="w-full group border-2 border-slate-200 hover:border-[#D4AF37] hover:bg-gradient-to-r hover:from-[#D4AF37]/5 hover:to-amber-50/50 h-11 text-base font-medium rounded-xl transition-all duration-300"
                    >
                      <Shield className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                      Admin Login
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </>
              )}

              {/* Email/Password Login */}
              {loginMethod === "email" && (
                <form onSubmit={handleEmailLogin} className="space-y-3.5">
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
                    <label className="block text-sm font-semibold text-slate-700">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white/50 focus:bg-white focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 outline-none transition-all duration-200 text-slate-900 placeholder:text-slate-400 text-sm"
                        placeholder="Enter your password"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    disabled={emailLoading}
                    className="w-full group relative overflow-hidden bg-gradient-to-r from-[#D4AF37] to-[#C19B2E] hover:from-[#C19B2E] hover:to-[#B8922A] text-white h-12 text-base font-semibold rounded-xl shadow-lg shadow-[#D4AF37]/30 hover:shadow-xl hover:shadow-[#D4AF37]/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] mt-3"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {emailLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                  </Button>
                </form>
              )}

            </div>
          )}

          {/* Terms */}
          <p className="text-xs text-center text-slate-500 pt-3 border-t border-slate-100 leading-relaxed">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-[#D4AF37] hover:underline font-medium">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-[#D4AF37] hover:underline font-medium">Privacy Policy</Link>
          </p>
        </div>

        {/* Register Link */}
        {!isAdminMode && (
          <p className="text-center text-slate-600 mt-5 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
            Don't have an account?{" "}
            <Link 
              href="/register" 
              className="inline-flex items-center gap-1 text-[#D4AF37] hover:text-[#C19B2E] font-semibold transition-colors group"
            >
              Sign up
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8">
        <div className="w-full max-w-[440px] text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#C19B2E] shadow-lg mb-3 animate-pulse">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="text-slate-500">Loading...</div>
        </div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
