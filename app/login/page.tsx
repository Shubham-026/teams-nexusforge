"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Mail, Lock, ArrowRight, Shield, AlertCircle, LockKeyhole } from "lucide-react";

export default function LoginPage() {
  const { user, signInWithGoogle, signInWithEmail, loading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      router.push("/tasks");
    }
  }, [user, loading, router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signInWithEmail(email, password);
      router.push("/tasks");
    } catch (err: any) {
      const msg = err?.message || "Authentication failed";
      if (msg.includes("auth/invalid-credential") || msg.includes("auth/user-not-found") || msg.includes("auth/wrong-password")) {
        setError("Invalid credentials. Please verify your agency email and password.");
      } else if (msg.includes("auth/too-many-requests")) {
        setError("Too many failed attempts. Please try again in a few minutes.");
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      router.push("/tasks");
    } catch (err: any) {
      if (!err?.message?.includes("auth/popup-closed-by-user")) {
        setError(err?.message || "Google sign in was unsuccessful");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-pastel-lavender-50 via-[#FAF9FD] to-pastel-mint-50/40 p-4">
      {/* Background soft ambient pastel shapes */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center opacity-60">
        <div className="h-[400px] w-[500px] rounded-lg bg-pastel-lavender-100/50 blur-3xl" />
        <div className="h-[300px] w-[400px] rounded-lg bg-pastel-mint-100/40 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Login Card: Strict soft square (rounded-lg) */}
        <div className="rounded-lg border border-pastel-lavender-200/80 bg-white/95 p-8 shadow-soft-lg backdrop-blur-md transition-all duration-300 hover:shadow-lg">
          {/* Agency Badge & Brand */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-pastel-lavender-200 bg-pastel-lavender-100 text-pastel-lavender-500 shadow-soft-sm transition-all duration-300 hover:scale-[1.02]">
              <Sparkles className="h-6 w-6" />
            </div>

            <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-800">
              NexusForge Agency
            </h1>
            <div className="mt-1 flex items-center gap-1.5 rounded-md border border-slate-200/70 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
              <Shield className="h-3 w-3 text-pastel-lavender-500" />
              <span>teams.nexusforgeagency.in</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Sign in with your verified team credentials
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google OAuth Button: Strict soft square (rounded-md) */}
          <div className="mt-6">
            <button
              onClick={handleGoogleAuth}
              disabled={submitting}
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-soft-sm transition-all duration-300 hover:scale-[1.02] hover:bg-slate-50 hover:shadow-md active:scale-95 disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google Workspace</span>
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/80" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-white px-3 font-medium text-slate-400">
                or sign in with agency email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Agency Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@nexusforgeagency.in"
                  className="w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition-all duration-300 focus:border-pastel-lavender-400 focus:outline-none focus:ring-2 focus:ring-pastel-lavender-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition-all duration-300 focus:border-pastel-lavender-400 focus:outline-none focus:ring-2 focus:ring-pastel-lavender-100"
                />
              </div>
            </div>

            {/* Submit Button: Strict soft square (rounded-md) */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-pastel-lavender-300 bg-pastel-lavender-500 py-2.5 text-xs font-semibold text-white shadow-soft-sm transition-all duration-300 hover:scale-[1.02] hover:bg-pastel-lavender-400 hover:shadow-lg active:scale-95 disabled:opacity-50"
            >
              <span>{submitting ? "Authenticating..." : "Sign In to Dashboard"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Strict Notice: No Public Registration */}
          <div className="mt-6 flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50/80 p-3 text-slate-500">
            <LockKeyhole className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-semibold text-slate-700">Internal Agency Environment:</span>
              <br />
              Public account registration is disabled. Member accounts are provisioned exclusively by the Agency Admin / CTO.
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-xs text-slate-400">
          NexusForge Agency Workspace • Protected by Role-Based Access Control (RBAC)
        </p>
      </div>
    </div>
  );
}
