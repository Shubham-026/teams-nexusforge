"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Kanban,
  FileText,
  Users,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Shield,
  UserCheck,
} from "lucide-react";
import { UserRole } from "@/lib/types";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const pathname = usePathname();
  const { role, canAccessCMS, canManageUsers, canAccessCRM } = useAuth();

  // Role display label mapping
  const roleLabels: Record<UserRole, string> = {
    admin: "Admin / CTO",
    ceo: "CEO (Executive)",
    sales_manager: "Sales Manager",
    lead_manager: "Lead Manager",
    member: "Team Member",
  };

  const roleBadgeStyles: Record<UserRole, string> = {
    admin: "bg-pastel-lavender-100 text-pastel-lavender-500 border-pastel-lavender-200",
    ceo: "bg-pastel-peach-100 text-pastel-peach-500 border-pastel-peach-200",
    sales_manager: "bg-pastel-sky-100 text-pastel-sky-500 border-pastel-sky-200",
    lead_manager: "bg-pastel-mint-100 text-pastel-mint-500 border-pastel-mint-200",
    member: "bg-slate-100 text-slate-600 border-slate-200",
  };

  // Dynamic Navigation based on RBAC permissions
  const navigation = [
    // Standard Task Board (Accessible to all roles)
    {
      name: "Task Board",
      href: "/tasks",
      icon: Kanban,
      badge: "Active",
      accent: "lavender",
      visible: true,
    },
    // Sales CRM (Accessible to Sales Manager, CEO, Admin)
    {
      name: "CRM & Leads",
      href: "/crm",
      icon: Briefcase,
      badge: "Pipeline",
      accent: "sky",
      visible: canAccessCRM,
    },
    // Website CMS (Strictly exclusive to Admin / CTO)
    {
      name: "Website CMS",
      href: "/cms",
      icon: FileText,
      badge: "Admin",
      accent: "mint",
      visible: canAccessCMS,
    },
    // Team Management (Strictly exclusive to Admin / CTO)
    {
      name: "Team Access",
      href: "/team",
      icon: Users,
      badge: "RBAC",
      accent: "peach",
      visible: canManageUsers,
    },
    // Personal Profile & Security (Accessible to all users)
    {
      name: "My Profile",
      href: "/profile",
      icon: UserCheck,
      badge: "Account",
      accent: "lavender",
      visible: true,
    },
  ].filter((item) => item.visible);

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
          className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500 transition-all duration-300 hover:scale-[1.02] hover:bg-white hover:text-slate-800 hover:shadow-sm active:scale-95"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 space-y-1.5 px-3 py-4">
        <div className="px-2 pb-2">
          {!collapsed && (
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Agency Modules
              </p>
              <span
                className={`rounded border px-1.5 py-0.5 text-[9px] font-medium uppercase ${
                  roleBadgeStyles[role] || roleBadgeStyles.member
                }`}
              >
                {role}
              </span>
            </div>
          )}
        </div>

        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          const getActiveClass = () => {
            if (!isActive) return "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:scale-[1.02]";
            switch (item.accent) {
              case "lavender":
                return "bg-pastel-lavender-50 text-slate-900 border border-pastel-lavender-200 shadow-soft-sm";
              case "mint":
                return "bg-pastel-mint-50 text-slate-900 border border-pastel-mint-200 shadow-soft-sm";
              case "sky":
                return "bg-pastel-sky-50 text-slate-900 border border-pastel-sky-200 shadow-soft-sm";
              case "peach":
                return "bg-pastel-peach-50 text-slate-900 border border-pastel-peach-200 shadow-soft-sm";
              default:
                return "bg-slate-50 text-slate-900 border border-slate-200 shadow-soft-sm";
            }
          };

          const getIconColor = () => {
            if (!isActive) return "text-slate-400 group-hover:text-slate-600";
            switch (item.accent) {
              case "lavender":
                return "text-pastel-lavender-500";
              case "mint":
                return "text-pastel-mint-500";
              case "sky":
                return "text-pastel-sky-500";
              case "peach":
                return "text-pastel-peach-500";
              default:
                return "text-slate-700";
            }
          };

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-300 ${getActiveClass()}`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${getIconColor()}`}
              />
              {!collapsed && (
                <div className="flex flex-1 items-center justify-between">
                  <span>{item.name}</span>
                  {item.badge && (
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                        item.accent === "lavender"
                          ? "bg-pastel-lavender-100/60 text-slate-700 border-pastel-lavender-200"
                          : item.accent === "mint"
                          ? "bg-pastel-mint-100/60 text-slate-700 border-pastel-mint-200"
                          : item.accent === "sky"
                          ? "bg-pastel-sky-100/60 text-slate-700 border-pastel-sky-200"
                          : "bg-pastel-peach-100/60 text-slate-700 border-pastel-peach-200"
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

      {/* User Role Card & Agency Subdomain */}
      {!collapsed && (
        <div className="space-y-2 p-3">
          {/* Active Role Card */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/70 p-2.5 text-xs">
            <Shield className="h-4 w-4 text-pastel-lavender-500 shrink-0" />
            <div className="truncate">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Current Role
              </p>
              <p className="font-semibold text-slate-800 text-xs truncate">
                {roleLabels[role] || "Team Member"}
              </p>
            </div>
          </div>

          {/* Environment Portal Badge */}
          <div className="rounded-lg border border-pastel-peach-200 bg-pastel-peach-50/70 p-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-soft-md">
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
