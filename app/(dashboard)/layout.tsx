"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#FAF9FD] text-slate-800 antialiased">
        {/* Collapsible Sidebar */}
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Header */}
          <Header />

          {/* Page Body */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

