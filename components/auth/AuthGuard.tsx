"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#FAF9FD]">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-pastel-lavender-200 bg-white p-8 shadow-soft-lg">
          <Loader2 className="h-8 w-8 animate-spin text-pastel-lavender-500" />
          <p className="text-sm font-medium text-slate-600">Verifying agency credentials...</p>
          <span className="font-mono text-xs text-slate-400">teams.nexusforgeagency.in</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

