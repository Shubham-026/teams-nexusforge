"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/types";
import { ShieldAlert, Loader2 } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
  moduleName?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallbackPath = "/tasks",
  moduleName = "this module",
}) => {
  const { role, loading, user } = useAuth();
  const router = useRouter();

  const isAuthorized = allowedRoles.includes(role);

  useEffect(() => {
    if (!loading && user && !isAuthorized) {
      const timer = setTimeout(() => {
        router.replace(fallbackPath);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [loading, user, isAuthorized, router, fallbackPath]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-pastel-lavender-500" />
          <p className="text-xs font-medium text-slate-500">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-[480px] w-full flex-col items-center justify-center p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-pastel-peach-200 bg-pastel-peach-50 text-pastel-peach-500 shadow-soft-sm">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-base font-bold text-slate-800">
          Access Restricted
        </h2>
        <p className="mt-1.5 max-w-sm text-xs text-slate-500">
          Your current role (<span className="font-mono font-semibold text-slate-700">{role}</span>) does not have authorization to view {moduleName}.
        </p>
        <p className="mt-4 font-mono text-[11px] text-slate-400">
          Redirecting to safe workspace in a moment...
        </p>
        <button
          onClick={() => router.replace(fallbackPath)}
          className="mt-4 rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-soft-sm hover:bg-slate-50 active:scale-95"
        >
          Return to Tasks Now
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

