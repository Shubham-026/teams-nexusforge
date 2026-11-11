"use client";

import React, { useState } from "react";
import { CustomRole, UserRole } from "@/lib/types";
import { saveCustomRole, deleteCustomRole } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  Shield,
  ShieldCheck,
  Plus,
  Trash2,
  Lock,
  Crown,
  TrendingUp,
  Briefcase,
  Kanban,
  FileText,
  Users,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  Info,
} from "lucide-react";

interface RoleManagementProps {
  onRoleUpdated?: () => void;
}

export const RoleManagement: React.FC<RoleManagementProps> = ({ onRoleUpdated }) => {
  const { customRoles, refreshRoles, isAdmin, isCEO } = useAuth();
  const { success, error: toastError, info: toastInfo } = useToast();

  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Local state for role edits before saving
  const [editedRoles, setEditedRoles] = useState<Record<string, CustomRole>>({});

  // Add Role Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleId, setNewRoleId] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRoleColor, setNewRoleColor] = useState<string>("lavender");
  const [newRoleTasks, setNewRoleTasks] = useState(true);
  const [newRoleCRM, setNewRoleCRM] = useState(false);
  const [newRoleCMS, setNewRoleCMS] = useState(false);
  const [newRoleTeam, setNewRoleTeam] = useState(false);
  const [creating, setCreating] = useState(false);

  // Auto-generate slug from role name
  const handleNameChange = (name: string) => {
    setNewRoleName(name);
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    setNewRoleId(slug);
  };

  const getActiveRoleState = (role: CustomRole): CustomRole => {
    return editedRoles[role.id] || role;
  };

  const handleTogglePermission = (
    roleId: string,
    field: keyof Pick<
      CustomRole,
      "can_access_tasks" | "can_access_crm" | "can_access_cms" | "can_manage_team"
    >
  ) => {
    const original = customRoles.find((r) => r.id === roleId);
    if (!original) return;

    // Enforce immutable system role restrictions:
    // 1. CTO (admin) has ALL permissions locked to true
    if (roleId === "admin") {
      toastInfo("Protected Role", "Admin / CTO maintains unrestricted access across all modules.");
      return;
    }

    // 2. CEO can NEVER have Website CMS (core technical functionality strictly reserved for CTO)
    if (roleId === "ceo" && field === "can_access_cms") {
      toastError(
        "Technical Boundary",
        "Website CMS is core technical functionality strictly reserved for the CTO."
      );
      return;
    }

    // 3. Only CTO can grant CMS permission to any other custom role
    if (field === "can_access_cms" && !isAdmin) {
      toastError(
        "CTO Authorization Required",
        "Only the CTO can grant Website CMS access permissions."
      );
      return;
    }

    const current = getActiveRoleState(original);
    const updated: CustomRole = {
      ...current,
      [field]: !current[field],
    };

    setEditedRoles((prev) => ({
      ...prev,
      [roleId]: updated,
    }));
  };

  const handleSaveRole = async (roleId: string) => {
    const roleToSave = editedRoles[roleId];
    if (!roleToSave) return;

    setSavingRoleId(roleId);
    try {
      await saveCustomRole(roleToSave);
      await refreshRoles();
      setEditedRoles((prev) => {
        const copy = { ...prev };
        delete copy[roleId];
        return copy;
      });
      success("Role Updated", `Permissions for "${roleToSave.name}" have been saved.`);
      onRoleUpdated?.();
    } catch (err: any) {
      toastError("Save Failed", err?.message || "Could not save role changes");
    } finally {
      setSavingRoleId(null);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim() || !newRoleId.trim()) {
      toastError("Validation Error", "Role name and identifier are required.");
      return;
    }

    // Validate ID format and uniqueness
    const cleanId = newRoleId.trim().toLowerCase();
    if (customRoles.some((r) => r.id === cleanId)) {
      toastError("Conflict", `A role with identifier "${cleanId}" already exists.`);
      return;
    }

    setCreating(true);
    try {
      const payload: CustomRole = {
        id: cleanId,
        name: newRoleName.trim(),
        description: newRoleDesc.trim() || undefined,
        color: newRoleColor,
        is_system: false,
        can_access_tasks: newRoleTasks,
        can_access_crm: newRoleCRM,
        can_access_cms: isAdmin ? newRoleCMS : false, // Locked if not CTO
        can_manage_team: newRoleTeam,
        can_manage_roles: false,
      };

      await saveCustomRole(payload);
      await refreshRoles();
      success("Role Created", `Custom role "${newRoleName}" is now active.`);
      setIsAddModalOpen(false);
      // Reset form
      setNewRoleName("");
      setNewRoleId("");
      setNewRoleDesc("");
      setNewRoleColor("lavender");
      setNewRoleTasks(true);
      setNewRoleCRM(false);
      setNewRoleCMS(false);
      setNewRoleTeam(false);
      onRoleUpdated?.();
    } catch (err: any) {
      toastError("Creation Failed", err?.message || "Could not create new role");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteRoleId) return;
    setDeleting(true);
    try {
      await deleteCustomRole(deleteRoleId);
      await refreshRoles();
      success(
        "Role Deleted",
        "Role deleted. Any assigned members were automatically reassigned to Team Member."
      );
      setDeleteRoleId(null);
      onRoleUpdated?.();
    } catch (err: any) {
      toastError("Delete Failed", err?.message || "Could not delete role");
    } finally {
      setDeleting(false);
    }
  };

  const colorStyles: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    lavender: {
      bg: "bg-pastel-lavender-50/60",
      border: "border-pastel-lavender-200",
      text: "text-pastel-lavender-500",
      badge: "bg-pastel-lavender-100 text-pastel-lavender-500 border-pastel-lavender-200",
    },
    peach: {
      bg: "bg-pastel-peach-50/60",
      border: "border-pastel-peach-200",
      text: "text-pastel-peach-500",
      badge: "bg-pastel-peach-100 text-pastel-peach-500 border-pastel-peach-200",
    },
    sky: {
      bg: "bg-pastel-sky-50/60",
      border: "border-pastel-sky-200",
      text: "text-pastel-sky-500",
      badge: "bg-pastel-sky-100 text-pastel-sky-500 border-pastel-sky-200",
    },
    mint: {
      bg: "bg-pastel-mint-50/60",
      border: "border-pastel-mint-200",
      text: "text-pastel-mint-500",
      badge: "bg-pastel-mint-100 text-pastel-mint-500 border-pastel-mint-200",
    },
    slate: {
      bg: "bg-slate-50/70",
      border: "border-slate-200",
      text: "text-slate-600",
      badge: "bg-slate-100 text-slate-600 border-slate-200",
    },
  };

  return (
    <div className="space-y-6">
      {/* Informational Guidance Banner */}
      <div className="rounded-lg border border-pastel-lavender-200 bg-pastel-lavender-50/60 p-4 shadow-soft-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-pastel-lavender-300 bg-white text-pastel-lavender-500 shadow-soft-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="space-y-1 text-xs">
            <h4 className="font-semibold text-slate-900">
              Executive Role & Clearance Governance
            </h4>
            <p className="text-slate-600">
              Only the <span className="font-semibold text-slate-800">CTO (Admin)</span> and{" "}
              <span className="font-semibold text-slate-800">CEO (Executive)</span> are authorized
              to customize roles. The CTO holds complete administrative control including core technical
              functionalities (<span className="font-mono text-pastel-lavender-600">Website CMS</span>
              ). The CEO manages team roles, tasks, and CRM, with core technical CMS access strictly reserved for the CTO.
            </p>
          </div>
        </div>
      </div>

      {/* Role Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Configured Roles & Clearances</h2>
          <p className="text-xs text-slate-500">
            Define permissions across Task Board, CRM Pipeline, Website CMS, and Team Provisioning.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-md border border-pastel-lavender-300 bg-pastel-lavender-500 px-3.5 py-2 text-xs font-semibold text-white shadow-soft-sm transition-all duration-300 hover:scale-[1.02] hover:bg-pastel-lavender-400 hover:shadow-md active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Custom Role</span>
        </button>
      </div>

      {/* Roles Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {customRoles.map((role) => {
          const activeRole = getActiveRoleState(role);
          const hasEdits = Boolean(editedRoles[role.id]);
          const isSystem = role.is_system;
          const isRoleAdmin = role.id === "admin";
          const isRoleCEO = role.id === "ceo";
          const theme = colorStyles[role.color] || colorStyles.slate;

          return (
            <div
              key={role.id}
              className={`flex flex-col justify-between rounded-lg border bg-white p-5 shadow-soft-sm transition-all duration-200 hover:shadow-md ${
                hasEdits ? "border-pastel-lavender-400 ring-2 ring-pastel-lavender-100" : "border-slate-200/80"
              }`}
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-md border ${theme.badge} shadow-soft-sm`}
                    >
                      {isRoleAdmin ? (
                        <Crown className="h-4 w-4" />
                      ) : isRoleCEO ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : role.can_access_crm ? (
                        <Briefcase className="h-4 w-4" />
                      ) : (
                        <Shield className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{role.name}</h3>
                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${theme.badge}`}>
                          {role.id}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {role.description || "Agency role configuration"}
                      </p>
                    </div>
                  </div>

                  {/* System vs Custom Pill */}
                  {isSystem ? (
                    <span className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                      <Lock className="h-3 w-3 text-slate-400" />
                      <span>System Role</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => setDeleteRoleId(role.id)}
                      title="Delete this custom role"
                      className="rounded-md border border-slate-200 p-1.5 text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Permissions Toggles List */}
                <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Module Access Permissions
                  </span>

                  {/* 1. Tasks Board */}
                  <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Kanban className="h-3.5 w-3.5 text-slate-500" />
                      <span className="text-xs font-medium text-slate-700">Task Board & Kanban</span>
                    </div>
                    <button
                      type="button"
                      disabled={isRoleAdmin}
                      onClick={() => handleTogglePermission(role.id, "can_access_tasks")}
                      className={`flex h-5 w-9 items-center rounded-md transition-colors ${
                        activeRole.can_access_tasks
                          ? "bg-pastel-mint-400 justify-end pr-1"
                          : "bg-slate-300 justify-start pl-1"
                      } ${isRoleAdmin ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span className="h-3.5 w-3.5 rounded-sm bg-white shadow-soft-sm" />
                    </button>
                  </div>

                  {/* 2. Sales CRM */}
                  <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 text-pastel-sky-500" />
                      <span className="text-xs font-medium text-slate-700">Sales CRM & Client Outreach</span>
                    </div>
                    <button
                      type="button"
                      disabled={isRoleAdmin}
                      onClick={() => handleTogglePermission(role.id, "can_access_crm")}
                      className={`flex h-5 w-9 items-center rounded-md transition-colors ${
                        activeRole.can_access_crm
                          ? "bg-pastel-sky-400 justify-end pr-1"
                          : "bg-slate-300 justify-start pl-1"
                      } ${isRoleAdmin ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span className="h-3.5 w-3.5 rounded-sm bg-white shadow-soft-sm" />
                    </button>
                  </div>

                  {/* 3. Website CMS (CTO core technical functionality) */}
                  <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-pastel-lavender-500" />
                      <div>
                        <span className="text-xs font-medium text-slate-700 block">
                          Website CMS (Core Technical)
                        </span>
                        {isRoleCEO && (
                          <span className="text-[10px] text-slate-400">
                            Locked (CTO Core Technical Only)
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isRoleAdmin || isRoleCEO || !isAdmin}
                      title={
                        isRoleAdmin
                          ? "CTO always has CMS access"
                          : isRoleCEO
                          ? "CEO access to Website CMS is restricted"
                          : !isAdmin
                          ? "Only CTO can grant Website CMS access"
                          : "Toggle CMS access"
                      }
                      onClick={() => handleTogglePermission(role.id, "can_access_cms")}
                      className={`flex h-5 w-9 items-center rounded-md transition-colors ${
                        activeRole.can_access_cms
                          ? "bg-pastel-lavender-400 justify-end pr-1"
                          : "bg-slate-300 justify-start pl-1"
                      } ${isRoleAdmin || isRoleCEO || !isAdmin ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span className="h-3.5 w-3.5 rounded-sm bg-white shadow-soft-sm" />
                    </button>
                  </div>

                  {/* 4. Team User Provisioning */}
                  <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-pastel-peach-500" />
                      <span className="text-xs font-medium text-slate-700">Team User Management</span>
                    </div>
                    <button
                      type="button"
                      disabled={isRoleAdmin || isRoleCEO}
                      onClick={() => handleTogglePermission(role.id, "can_manage_team")}
                      className={`flex h-5 w-9 items-center rounded-md transition-colors ${
                        activeRole.can_manage_team
                          ? "bg-pastel-peach-400 justify-end pr-1"
                          : "bg-slate-300 justify-start pl-1"
                      } ${isRoleAdmin || isRoleCEO ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span className="h-3.5 w-3.5 rounded-sm bg-white shadow-soft-sm" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-[11px] text-slate-400 font-mono">
                  {isRoleAdmin
                    ? "Full Access Root"
                    : isRoleCEO
                    ? "Executive (Excl. CMS)"
                    : isSystem
                    ? "Predefined System Role"
                    : "Custom Configured Role"}
                </span>

                {hasEdits && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditedRoles((prev) => {
                          const copy = { ...prev };
                          delete copy[role.id];
                          return copy;
                        });
                      }}
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-50"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      disabled={savingRoleId === role.id}
                      onClick={() => handleSaveRole(role.id)}
                      className="flex items-center gap-1.5 rounded-md border border-pastel-lavender-300 bg-pastel-lavender-500 px-3 py-1 text-xs font-semibold text-white shadow-soft-sm hover:bg-pastel-lavender-400 disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{savingRoleId === role.id ? "Saving..." : "Save Changes"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Role Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-pastel-lavender-200 bg-pastel-lavender-100 text-pastel-lavender-500 shadow-soft-sm">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Create Custom Role</h3>
                  <p className="text-[11px] text-slate-400">
                    Define name, identifier, and module access permissions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-md border border-slate-200 p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role Display Name
                </label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Senior Product Designer"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-soft-sm focus:border-pastel-lavender-400 focus:outline-none focus:ring-2 focus:ring-pastel-lavender-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role Identifier (Slug)
                </label>
                <input
                  type="text"
                  required
                  value={newRoleId}
                  onChange={(e) => setNewRoleId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="e.g. senior_product_designer"
                  className="w-full rounded-md border border-slate-200 bg-slate-50 font-mono px-3 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-soft-sm focus:border-pastel-lavender-400 focus:outline-none focus:ring-2 focus:ring-pastel-lavender-100"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Used internally for RBAC evaluation and database checks.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="e.g. Design deliverables, UI reviews, and asset management"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-soft-sm focus:border-pastel-lavender-400 focus:outline-none focus:ring-2 focus:ring-pastel-lavender-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Accent Color Theme
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: "lavender", label: "Lavender", bg: "bg-pastel-lavender-100 text-pastel-lavender-500 border-pastel-lavender-300" },
                    { id: "peach", label: "Peach", bg: "bg-pastel-peach-100 text-pastel-peach-500 border-pastel-peach-300" },
                    { id: "sky", label: "Sky", bg: "bg-pastel-sky-100 text-pastel-sky-500 border-pastel-sky-300" },
                    { id: "mint", label: "Mint", bg: "bg-pastel-mint-100 text-pastel-mint-500 border-pastel-mint-300" },
                    { id: "slate", label: "Slate", bg: "bg-slate-100 text-slate-600 border-slate-300" },
                  ].map((color) => (
                    <button
                      type="button"
                      key={color.id}
                      onClick={() => setNewRoleColor(color.id)}
                      className={`rounded-md border p-2 text-center text-[11px] font-semibold transition-all ${
                        color.bg
                      } ${newRoleColor === color.id ? "ring-2 ring-slate-800 scale-105" : "opacity-80"}`}
                    >
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Module Permissions Checkboxes */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  Initial Module Permissions
                </span>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={newRoleTasks}
                    onChange={(e) => setNewRoleTasks(e.target.checked)}
                    className="rounded border-slate-300 text-pastel-lavender-500 focus:ring-pastel-lavender-200"
                  />
                  <span>Task Board & Kanban</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={newRoleCRM}
                    onChange={(e) => setNewRoleCRM(e.target.checked)}
                    className="rounded border-slate-300 text-pastel-sky-500 focus:ring-pastel-sky-200"
                  />
                  <span>Sales CRM & Lead Outreach</span>
                </label>

                <label
                  className={`flex items-center gap-2 text-xs ${
                    isAdmin ? "cursor-pointer text-slate-700" : "opacity-60 cursor-not-allowed text-slate-400"
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={isAdmin ? newRoleCMS : false}
                    onChange={(e) => setNewRoleCMS(e.target.checked)}
                    className="rounded border-slate-300 text-pastel-lavender-500 focus:ring-pastel-lavender-200"
                  />
                  <span>Website CMS (Core Technical - CTO Exclusive)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={newRoleTeam}
                    onChange={(e) => setNewRoleTeam(e.target.checked)}
                    className="rounded border-slate-300 text-pastel-peach-500 focus:ring-pastel-peach-200"
                  />
                  <span>Team User Provisioning</span>
                </label>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-md border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-md border border-pastel-lavender-300 bg-pastel-lavender-500 px-4 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-pastel-lavender-400 disabled:opacity-50"
                >
                  {creating ? "Creating Role..." : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteRoleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 shadow-soft-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Custom Role?</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Are you sure you want to delete role <span className="font-mono font-semibold text-slate-700">{deleteRoleId}</span>?
                  Any active members with this role will be automatically reassigned to the default Team Member role.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteRoleId(null)}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteRole}
                className="rounded-md border border-rose-300 bg-rose-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-soft-sm hover:bg-rose-600 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

