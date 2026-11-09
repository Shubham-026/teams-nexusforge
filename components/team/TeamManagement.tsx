"use client";

import React, { useState, useEffect } from "react";
import { TeamMember, UserRole } from "@/lib/types";
import { getTeamMembers } from "@/lib/supabase";
import { createTeamUser, deleteTeamUser, updateTeamUserRole } from "@/app/actions/adminUserActions";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Mail,
  Lock,
  User as UserIcon,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Crown,
  TrendingUp,
} from "lucide-react";

export const TeamManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { success, error: toastError, info } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await getTeamMembers();
      setMembers(data);
    } catch (err: any) {
      toastError("Error", err?.message || "Failed to load team directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await createTeamUser({
        name,
        email,
        password,
        role,
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to create user");
      }

      success("User Provisioned", `Account created for ${name} (${role})`);
      setIsModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole("member");
      await fetchMembers();
    } catch (err: any) {
      toastError("Provision Failed", err?.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (uid: string, memberName: string) => {
    if (uid === currentUser?.uid) {
      toastError("Restricted Action", "You cannot delete your own Administrator account");
      return;
    }

    try {
      const res = await deleteTeamUser(uid);
      if (!res.success) {
        throw new Error(res.error || "Failed to delete user");
      }
      info("User Removed", `User ${memberName} was successfully deleted`);
      setDeleteConfirmId(null);
      await fetchMembers();
    } catch (err: any) {
      toastError("Delete Failed", err?.message || "Failed to delete user");
    }
  };

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    if (uid === currentUser?.uid) {
      toastError("Restricted Action", "You cannot change your own Administrator role");
      return;
    }

    try {
      const res = await updateTeamUserRole(uid, newRole);
      if (!res.success) throw new Error(res.error);
      success("Role Updated", `Role updated to ${newRole}`);
      await fetchMembers();
    } catch (err: any) {
      toastError("Update Failed", err?.message || "Failed to update role");
    }
  };

  // Filter members
  const filtered = members.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleBadgeStyle = (r: UserRole) => {
    switch (r) {
      case "admin":
        return "bg-pastel-lavender-100 text-pastel-lavender-500 border-pastel-lavender-200";
      case "ceo":
        return "bg-pastel-peach-100 text-pastel-peach-500 border-pastel-peach-200";
      case "sales_manager":
        return "bg-pastel-sky-100 text-pastel-sky-500 border-pastel-sky-200";
      case "lead_manager":
        return "bg-pastel-mint-100 text-pastel-mint-500 border-pastel-mint-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const roleTitle = (r: UserRole) => {
    switch (r) {
      case "admin":
        return "Admin / CTO";
      case "ceo":
        return "CEO";
      case "sales_manager":
        return "Sales Manager";
      case "lead_manager":
        return "Lead Manager";
      default:
        return "Team Member";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Team & Role Management
            </h1>
            <span className="rounded-md border border-pastel-lavender-200 bg-pastel-lavender-50 px-2 py-0.5 text-xs font-semibold text-pastel-lavender-500">
              Admin Exclusive
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Provision team accounts, assign RBAC permissions, and manage organization credentials.
          </p>
        </div>

        {/* Add User Action Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-md border border-pastel-lavender-300 bg-pastel-lavender-500 px-4 py-2.5 text-xs font-semibold text-white shadow-soft-sm transition-all duration-300 hover:scale-[1.02] hover:bg-pastel-lavender-400 hover:shadow-md active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          <span>Provision New Member</span>
        </button>
      </div>

      {/* Role Distribution Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-lg border border-pastel-lavender-200 bg-pastel-lavender-50/70 p-3 shadow-soft-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Admins / CTO</span>
            <Crown className="h-3.5 w-3.5 text-pastel-lavender-500" />
          </div>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {members.filter((m) => m.role === "admin").length}
          </p>
        </div>

        <div className="rounded-lg border border-pastel-peach-200 bg-pastel-peach-50/70 p-3 shadow-soft-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Executive / CEO</span>
            <TrendingUp className="h-3.5 w-3.5 text-pastel-peach-500" />
          </div>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {members.filter((m) => m.role === "ceo").length}
          </p>
        </div>

        <div className="rounded-lg border border-pastel-sky-200 bg-pastel-sky-50/70 p-3 shadow-soft-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Sales Managers</span>
            <Briefcase className="h-3.5 w-3.5 text-pastel-sky-500" />
          </div>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {members.filter((m) => m.role === "sales_manager").length}
          </p>
        </div>

        <div className="rounded-lg border border-pastel-mint-200 bg-pastel-mint-50/70 p-3 shadow-soft-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Lead Managers</span>
            <Shield className="h-3.5 w-3.5 text-pastel-mint-500" />
          </div>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {members.filter((m) => m.role === "lead_manager").length}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 shadow-soft-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Total Members</span>
            <Users className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <p className="mt-1 text-lg font-bold text-slate-900">{members.length}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search member name or email..."
            className="w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-soft-sm focus:border-pastel-lavender-400 focus:outline-none focus:ring-2 focus:ring-pastel-lavender-100"
          />
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-md border border-slate-200 bg-white p-1 text-xs shadow-soft-sm">
          {["all", "admin", "ceo", "sales_manager", "lead_manager", "member"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition-all ${
                roleFilter === r
                  ? "bg-pastel-lavender-100 text-pastel-lavender-600 font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {r === "all" ? "All Roles" : r.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-lg border border-slate-200/80 bg-white shadow-soft-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Team Member</th>
                <th className="px-5 py-3.5">Agency Email</th>
                <th className="px-5 py-3.5">Assigned Role</th>
                <th className="px-5 py-3.5">Permissions Granted</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                    Loading team members...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                    No team members found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((member) => {
                  const isCurrent = member.id === currentUser?.uid;
                  return (
                    <tr
                      key={member.id}
                      className="transition-colors hover:bg-slate-50/60"
                    >
                      {/* Avatar & Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-pastel-lavender-200 bg-pastel-lavender-100 font-semibold text-pastel-lavender-500 shadow-soft-sm">
                            {member.avatar_initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                              <span>{member.name}</span>
                              {isCurrent && (
                                <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] text-slate-500 font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-slate-400 truncate max-w-[120px] block">
                              {member.id.substring(0, 12)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-3.5 font-mono text-slate-600">
                        {member.email}
                      </td>

                      {/* Role Selector */}
                      <td className="px-5 py-3.5">
                        <select
                          value={member.role}
                          disabled={isCurrent}
                          onChange={(e) =>
                            handleRoleChange(member.id, e.target.value as UserRole)
                          }
                          className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-all ${
                            roleBadgeStyle(member.role)
                          } focus:outline-none disabled:opacity-80`}
                        >
                          <option value="admin">Admin / CTO</option>
                          <option value="ceo">CEO (Executive)</option>
                          <option value="sales_manager">Sales Manager</option>
                          <option value="lead_manager">Lead Manager</option>
                          <option value="member">Team Member</option>
                        </select>
                      </td>

                      {/* Permissions Description */}
                      <td className="px-5 py-3.5 text-slate-500">
                        {member.role === "admin" && (
                          <span className="text-pastel-lavender-500 font-medium">
                            Full Access • CMS • Team RBAC
                          </span>
                        )}
                        {member.role === "ceo" && (
                          <span className="text-pastel-peach-500 font-medium">
                            Executive View • All Tasks • CRM
                          </span>
                        )}
                        {member.role === "sales_manager" && (
                          <span className="text-pastel-sky-500 font-medium">
                            CRM & Leads • Outreach Pipeline
                          </span>
                        )}
                        {member.role === "lead_manager" && (
                          <span className="text-pastel-mint-500 font-medium">
                            Task Board • Task Management
                          </span>
                        )}
                        {member.role === "member" && (
                          <span className="text-slate-400">
                            Assigned Tasks • Team Kanban
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        {isCurrent ? (
                          <span className="text-[11px] text-slate-400 font-medium italic">
                            Protected Admin
                          </span>
                        ) : deleteConfirmId === member.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleDeleteUser(member.id, member.name)}
                              className="rounded border border-rose-300 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-100"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(member.id)}
                            title="Remove team member"
                            className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft-lg">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-pastel-lavender-200 bg-pastel-lavender-100 text-pastel-lavender-500 shadow-soft-sm">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Provision Team Member
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Create Firebase credentials and assign RBAC role
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-md border border-slate-200 p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Atul Sharma"
                    className="w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-soft-sm focus:border-pastel-lavender-400 focus:outline-none focus:ring-2 focus:ring-pastel-lavender-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agency Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. atul@nexusforgeagency.in"
                    className="w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-soft-sm focus:border-pastel-lavender-400 focus:outline-none focus:ring-2 focus:ring-pastel-lavender-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-soft-sm focus:border-pastel-lavender-400 focus:outline-none focus:ring-2 focus:ring-pastel-lavender-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  RBAC Role & Clearance
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-soft-sm focus:border-pastel-lavender-400 focus:outline-none focus:ring-2 focus:ring-pastel-lavender-100"
                >
                  <option value="admin">Admin / CTO (Full Access, CMS, Team RBAC)</option>
                  <option value="ceo">CEO (Executive View, Analytics, All Tasks, CRM)</option>
                  <option value="sales_manager">Sales Manager (CRM & Lead Pipelines)</option>
                  <option value="lead_manager">Lead Manager (Task Management)</option>
                  <option value="member">Team Member (Assigned Tasks & Kanban)</option>
                </select>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md border border-pastel-lavender-300 bg-pastel-lavender-500 px-4 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-pastel-lavender-400 disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Provision Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
