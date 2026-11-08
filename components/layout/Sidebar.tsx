"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Kanban,
  FileText,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const pathname = usePathname();

  const navigation = [
    {
      name: "Task Board",
      href: "/tasks",
      icon: Kanban,
      badge: "4 active",
      accent: "lavender",
    },
    {
      name: "Content CMS",
      href: "/cms",
      icon: FileText,
      badge: "Drafts",
      accent: "mint",
    },
  ];

  return (
    <aside
      className={`relative z-20 flex flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-sm transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pastel-lavender-100 border border-pastel-lavender-200 text-pastel-lavender-500 shadow-soft-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-800 tracking-tight">NexusForge</h1>
              <p className="text-[11px] font-medium text-slate-400">Team Workspace</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-pastel-lavender-100 border border-pastel-lavender-200 text-pastel-lavender-500 shadow-soft-sm">
            <Sparkles className="h-5 w-5" />
          </div>
        )}

        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500 transition-all duration-300 hover:scale-[1.02] hover:bg-white hover:text-slate-800 hover:shadow-sm"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 space-y-1.5 px-3 py-4">
        <div className="px-2 pb-2">
          {!collapsed && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Agency Modules
            </p>
          )}
        </div>

        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
                isActive
                  ? item.accent === "lavender"
                    ? "bg-pastel-lavender-50 text-slate-900 border border-pastel-lavender-200 shadow-soft-sm"
                    : "bg-pastel-mint-50 text-slate-900 border border-pastel-mint-200 shadow-soft-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:scale-[1.02]"
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                  isActive
                    ? item.accent === "lavender"
                      ? "text-pastel-lavender-500"
                      : "text-pastel-mint-500"
                    : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              {!collapsed && (
                <div className="flex flex-1 items-center justify-between">
                  <span>{item.name}</span>
                  {item.badge && (
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                        item.accent === "lavender"
                          ? "bg-pastel-lavender-100/60 text-slate-700 border-pastel-lavender-200"
                          : "bg-pastel-mint-100/60 text-slate-700 border-pastel-mint-200"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Agency Subdomain & Environment footer card */}
      {!collapsed && (
        <div className="p-3">
          <div className="rounded-lg border border-pastel-peach-200 bg-pastel-peach-50/70 p-3.5 transition-all duration-300 hover:scale-[1.02] hover:shadow-soft-md">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-pastel-mint-400" />
                Live Agency Portal
              </span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </div>
            <p className="mt-1 text-[11px] text-slate-500 font-mono">teams.nexusforgeagency.in</p>
          </div>
        </div>
      )}
    </aside>
  );
};

