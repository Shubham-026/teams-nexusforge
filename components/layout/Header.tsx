"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Bell, ShieldCheck, User as UserIcon } from "lucide-react";

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Agency Staff";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-6 backdrop-blur-md">
      {/* Agency Path / Context indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-md border border-pastel-lavender-200 bg-pastel-lavender-50 px-2.5 py-1 text-xs font-medium text-slate-700">
          <ShieldCheck className="h-3.5 w-3.5 text-pastel-lavender-500" />
          <span>Internal Agency Environment</span>
        </div>
        <span className="hidden text-xs text-slate-400 sm:inline-block">/</span>
        <span className="hidden font-mono text-xs text-slate-500 sm:inline-block">
          teams.nexusforgeagency.in
        </span>
      </div>

      {/* Right controls: User profile & Logout */}
      <div className="flex items-center gap-3">
        {/* Firebase Authenticated User Card */}
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-1.5 pr-3 transition-all duration-300 hover:scale-[1.02] hover:bg-white hover:shadow-soft-sm">
          {/* Strict soft square avatar (no rounded-full) */}
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-pastel-mint-100 border border-pastel-mint-200 text-xs font-semibold text-pastel-mint-500 shadow-soft-sm">
            {initials}
          </div>
          <div className="text-left hidden md:block">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {displayName}
            </p>
            <p className="text-[11px] font-mono text-slate-400 leading-tight truncate max-w-[150px]">
              {user?.email || "authenticated-member"}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          title="Sign out of Firebase Auth"
          className="flex h-9 items-center gap-1.5 rounded-md border border-pastel-peach-200 bg-pastel-peach-50 px-3 text-xs font-medium text-slate-700 transition-all duration-300 hover:scale-[1.02] hover:bg-pastel-peach-100 hover:text-slate-900 hover:shadow-soft-sm active:scale-95 disabled:opacity-50"
        >
          <LogOut className="h-3.5 w-3.5 text-pastel-peach-500" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

