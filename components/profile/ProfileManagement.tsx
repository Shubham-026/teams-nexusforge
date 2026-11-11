"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { updateCurrentUserProfile } from "@/lib/supabase";
import {
  firebaseUpdatePassword,
  firebaseUpdateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  auth,
} from "@/lib/firebase";
import { UserRole } from "@/lib/types";
import {
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Copy,
  Check,
  Briefcase,
  Users,
  FileText,
  Kanban,
  Palette,
  ExternalLink,
} from "lucide-react";

export const ProfileManagement: React.FC = () => {
  const { user, teamMember, role, refreshProfile } = useAuth();
  const { success, error: toastError, info } = useToast();

  // Profile Information State
  const [name, setName] = useState(teamMember?.name || user?.displayName || "");
  const [initials, setInitials] = useState(teamMember?.avatar_initials || "NF");
  const [color, setColor] = useState(teamMember?.color || "lavender");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Management State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Copied UID state
  const [copiedUid, setCopiedUid] = useState(false);

  // Synchronize state when teamMember loads
  useEffect(() => {
    if (teamMember) {
      setName(teamMember.name);
      setInitials(teamMember.avatar_initials || "NF");
      setColor(teamMember.color || "lavender");
    } else if (user) {
      setName(user.displayName || user.email?.split("@")[0] || "");
    }
  }, [teamMember, user]);

  const isGoogleUser = user?.providerData?.some(
    (p) => p.providerId === "google.com"
  );

  const roleTitles: Record<UserRole, string> = {
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

  const colorThemes = [
    {
      id: "lavender",
      name: "Pastel Lavender",
      bgClass: "bg-pastel-lavender-100",
      borderClass: "border-pastel-lavender-200",
      textClass: "text-pastel-lavender-500",
      activeRing: "ring-pastel-lavender-400",
    },
    {
      id: "mint",
      name: "Pastel Mint",
      bgClass: "bg-pastel-mint-100",
      borderClass: "border-pastel-mint-200",
      textClass: "text-pastel-mint-500",
      activeRing: "ring-pastel-mint-400",
    },
    {
      id: "peach",
      name: "Pastel Peach",
      bgClass: "bg-pastel-peach-100",
      borderClass: "border-pastel-peach-200",
      textClass: "text-pastel-peach-500",
      activeRing: "ring-pastel-peach-400",
    },
    {
      id: "sky",
      name: "Pastel Sky",
      bgClass: "bg-pastel-sky-100",
      borderClass: "border-pastel-sky-200",
      textClass: "text-pastel-sky-500",
      activeRing: "ring-pastel-sky-400",
    },
  ];

  const handleCopyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
      info("Copied", "Firebase UID copied to clipboard");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      toastError("Validation Error", "Full Name cannot be empty");
      return;
    }

    setSavingProfile(true);
    try {
      // 1. Update Firebase Auth Display Name
      if (auth.currentUser) {
        await firebaseUpdateProfile(auth.currentUser, {
          displayName: name.trim(),
        });
      }

      // 2. Update Supabase team_members profile
      const cleanInitials = (initials.trim() || name.slice(0, 2)).toUpperCase();
      await updateCurrentUserProfile(
        user.uid,
        {
          name: name.trim(),
          avatar_initials: cleanInitials,
          color,
        },
        user.email
      );

      await refreshProfile();
      success("Profile Updated", "Your profile details have been saved successfully");
    } catch (err: any) {
      console.error("Profile update error:", err);
      toastError("Update Failed", err?.message || "Failed to save profile changes");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;

    if (newPassword.length < 6) {
      toastError("Validation Error", "New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toastError("Validation Error", "New passwords do not match");
      return;
    }

    if (!currentPassword) {
      toastError("Validation Error", "Please enter your current password to confirm");
      return;
    }

    setUpdatingPassword(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No active authenticated session");

      // 1. Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // 2. Update to new password
      await firebaseUpdatePassword(currentUser, newPassword);

      // Reset password form fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      success("Password Changed", "Your password has been updated securely");
    } catch (err: any) {
      console.error("Password update error:", err);
      const msg = err?.message || "Failed to update password";
      if (msg.includes("auth/wrong-password") || msg.includes("auth/invalid-credential")) {
        toastError("Authentication Failed", "Current password is incorrect");
      } else if (msg.includes("auth/requires-recent-login")) {
        toastError(
          "Session Expired",
          "For security, please sign out and sign back in before changing your password"
        );
      } else {
        toastError("Update Failed", msg);
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  const currentColorTheme =
    colorThemes.find((c) => c.id === color) || colorThemes[0];

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Account & Profile Settings
            </h1>
            <span
              className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${
                roleBadgeStyles[role] || roleBadgeStyles.member
              }`}
            >
              {roleTitles[role] || "Member"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Manage your personal profile, customize your agency badge, and update your security credentials.
          </p>
        </div>
      </div>

      {/* Profile Overview Hero Card (Strict soft square rounded-lg) */}
      <div className="rounded-lg border border-pastel-lavender-200/80 bg-white p-6 shadow-soft-sm transition-all duration-300 hover:shadow-soft-md">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Live Avatar Preview (Strict soft square rounded-lg) */}
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-lg border text-xl font-bold shadow-soft-sm transition-all duration-300 ${currentColorTheme.bgClass} ${currentColorTheme.borderClass} ${currentColorTheme.textClass}`}
            >
              {initials || "NF"}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {name || "Team Member"}
                </h2>
                <span className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  <Shield className="h-3 w-3 text-pastel-lavender-500" />
                  <span>{roleTitles[role] || "Member"}</span>
                </span>
              </div>
              <p className="mt-0.5 font-mono text-xs text-slate-500">
                {user?.email || "verified-member@nexusforgeagency.in"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyUid}
                  className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-mono text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                  title="Click to copy UID"
                >
                  {copiedUid ? (
                    <Check className="h-3 w-3 text-pastel-mint-500" />
                  ) : (
                    <Copy className="h-3 w-3 text-slate-400" />
                  )}
                  <span>UID: {user?.uid?.slice(0, 10)}...</span>
                </button>
                <span className="rounded-md border border-pastel-mint-200 bg-pastel-mint-50 px-2 py-0.5 text-[10px] font-medium text-pastel-mint-500">
                  Verified Agency Access
                </span>
              </div>
            </div>
          </div>

          {/* Subdomain Pill / Agency Info */}
          <div className="rounded-md border border-slate-200/80 bg-slate-50/80 p-3 text-left sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Agency Domain
            </p>
            <p className="font-mono text-xs font-semibold text-slate-700">
              teams.nexusforgeagency.in
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              RBAC synced with Firebase Auth & Supabase
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Card 1: Personal Profile Information */}
        <div className="rounded-lg border border-pastel-lavender-200/80 bg-white p-6 shadow-soft-sm transition-all duration-300 hover:shadow-soft-md">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-pastel-lavender-200 bg-pastel-lavender-50 text-pastel-lavender-500 shadow-soft-sm">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Personal Information
              </h3>
              <p className="text-[11px] text-slate-500">
                Update how your name and initials appear on tasks and agency boards.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  const generated = e.target.value
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  if (generated) setInitials(generated);
                }}
                placeholder="e.g. Shubham Gupta"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 transition-all duration-300 focus:border-pastel-lavender-400 focus:outline-none focus:ring-2 focus:ring-pastel-lavender-100"
              />
            </div>

            {/* Email Address (Read-only) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Agency Email
                </label>
                <span className="text-[10px] text-slate-400">Admin Managed</span>
              </div>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500 focus:outline-none"
              />
            </div>

            {/* Avatar Initials */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Badge Initials (Max 2 Chars)
              </label>
              <input
                type="text"
                maxLength={2}
                value={initials}
                onChange={(e) => setInitials(e.target.value.toUpperCase())}
                placeholder="e.g. SG"
                className="w-full max-w-[120px] rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs font-semibold uppercase text-slate-800 transition-all duration-300 focus:border-pastel-lavender-400 focus:outline-none focus:ring-2 focus:ring-pastel-lavender-100"
              />
            </div>

            {/* Color Theme Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Badge Pastel Theme
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {colorThemes.map((c) => {
                  const isSelected = color === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-md border p-2.5 text-xs font-medium transition-all duration-200 active:scale-95 ${
                        isSelected
                          ? `${c.bgClass} ${c.borderClass} ${c.textClass} ring-2 ${c.activeRing} shadow-soft-sm`
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-sm border ${c.bgClass} ${c.borderClass}`}
                      />
                      <span className="text-[11px] capitalize">{c.id}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center justify-center gap-2 rounded-md border border-pastel-lavender-300 bg-pastel-lavender-500 px-4 py-2 text-xs font-semibold text-white shadow-soft-sm transition-all duration-300 hover:scale-[1.02] hover:bg-pastel-lavender-400 hover:shadow-lg active:scale-95 disabled:opacity-50"
              >
                <span>{savingProfile ? "Saving Details..." : "Save Profile Details"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Card 2: Password & Security (Edit Password) */}
        <div className="rounded-lg border border-pastel-lavender-200/80 bg-white p-6 shadow-soft-sm transition-all duration-300 hover:shadow-soft-md">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-pastel-peach-200 bg-pastel-peach-50 text-pastel-peach-500 shadow-soft-sm">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Security & Password
              </h3>
              <p className="text-[11px] text-slate-500">
                Update your Firebase authentication credentials.
              </p>
            </div>
          </div>

          {isGoogleUser ? (
            <div className="mt-5 rounded-md border border-pastel-sky-200 bg-pastel-sky-50/70 p-4 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-semibold text-pastel-sky-500">
                <Sparkles className="h-4 w-4" />
                <span>Google Workspace Single Sign-On Active</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                Your account is authenticated via Google Workspace. Your password and two-factor authentication are managed through your Google account.
              </p>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="mt-5 space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter existing password"
                    className="w-full rounded-md border border-slate-200 bg-white pl-9 pr-9 py-2 text-xs text-slate-800 placeholder-slate-400 transition-all duration-300 focus:border-pastel-lavender-400 focus:outline-none focus:ring-2 focus:ring-pastel-lavender-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password (Min 6 Characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter secure new password"
                    className="w-full rounded-md border border-slate-200 bg-white pl-9 pr-9 py-2 text-xs text-slate-800 placeholder-slate-400 transition-all duration-300 focus:border-pastel-lavender-400 focus:outline-none focus:ring-2 focus:ring-pastel-lavender-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className={`w-full rounded-md border bg-white pl-9 pr-9 py-2 text-xs text-slate-800 placeholder-slate-400 transition-all duration-300 focus:outline-none focus:ring-2 ${
                      passwordsMismatch
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                        : passwordsMatch
                        ? "border-pastel-mint-300 focus:border-pastel-mint-400 focus:ring-pastel-mint-100"
                        : "border-slate-200 focus:border-pastel-lavender-400 focus:ring-pastel-lavender-100"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {passwordsMatch && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-pastel-mint-500">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Passwords match</span>
                  </p>
                )}
                {passwordsMismatch && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-rose-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Passwords do not match</span>
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updatingPassword || passwordsMismatch}
                  className="flex items-center justify-center gap-2 rounded-md border border-pastel-peach-300 bg-pastel-peach-500 px-4 py-2 text-xs font-semibold text-white shadow-soft-sm transition-all duration-300 hover:scale-[1.02] hover:bg-pastel-peach-400 hover:shadow-lg active:scale-95 disabled:opacity-50"
                >
                  <span>
                    {updatingPassword ? "Updating Password..." : "Update Password"}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Card 3: RBAC Role & Access Transparency (Read-Only) */}
      <div className="rounded-lg border border-pastel-lavender-200/80 bg-white p-6 shadow-soft-sm transition-all duration-300 hover:shadow-soft-md">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-pastel-lavender-200 bg-pastel-lavender-50 text-pastel-lavender-500 shadow-soft-sm">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Role & Permissions Matrix
            </h3>
            <p className="text-[11px] text-slate-500">
              Your authorized operational privileges inside NexusForge Agency.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Task Board */}
          <div className="rounded-md border border-pastel-lavender-200 bg-pastel-lavender-50/50 p-4 transition-all hover:bg-pastel-lavender-50">
            <div className="flex items-center justify-between">
              <Kanban className="h-4 w-4 text-pastel-lavender-500" />
              <span className="flex items-center gap-1 rounded bg-pastel-mint-100 px-1.5 py-0.5 text-[10px] font-semibold text-pastel-mint-500">
                <Check className="h-3 w-3" />
                Active
              </span>
            </div>
            <h4 className="mt-2 text-xs font-bold text-slate-800">Task Board</h4>
            <p className="mt-1 text-[11px] text-slate-500 leading-tight">
              Create, review, and collaborate on agency deliverables.
            </p>
          </div>

          {/* CRM & Leads */}
          <div
            className={`rounded-md border p-4 transition-all ${
              role === "admin" || role === "ceo" || role === "sales_manager"
                ? "border-pastel-sky-200 bg-pastel-sky-50/50 hover:bg-pastel-sky-50"
                : "border-slate-200 bg-slate-50/60 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between">
              <Briefcase className="h-4 w-4 text-pastel-sky-500" />
              {role === "admin" || role === "ceo" || role === "sales_manager" ? (
                <span className="flex items-center gap-1 rounded bg-pastel-mint-100 px-1.5 py-0.5 text-[10px] font-semibold text-pastel-mint-500">
                  <Check className="h-3 w-3" />
                  Active
                </span>
              ) : (
                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                  Locked
                </span>
              )}
            </div>
            <h4 className="mt-2 text-xs font-bold text-slate-800">Sales CRM</h4>
            <p className="mt-1 text-[11px] text-slate-500 leading-tight">
              Client acquisition tracking and proposal pipelines.
            </p>
          </div>

          {/* Website CMS */}
          <div
            className={`rounded-md border p-4 transition-all ${
              role === "admin"
                ? "border-pastel-mint-200 bg-pastel-mint-50/50 hover:bg-pastel-mint-50"
                : "border-slate-200 bg-slate-50/60 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between">
              <FileText className="h-4 w-4 text-pastel-mint-500" />
              {role === "admin" ? (
                <span className="flex items-center gap-1 rounded bg-pastel-mint-100 px-1.5 py-0.5 text-[10px] font-semibold text-pastel-mint-500">
                  <Check className="h-3 w-3" />
                  Active
                </span>
              ) : (
                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                  Admin Only
                </span>
              )}
            </div>
            <h4 className="mt-2 text-xs font-bold text-slate-800">Website CMS</h4>
            <p className="mt-1 text-[11px] text-slate-500 leading-tight">
              Publish blog posts, portfolio items, and landing copy.
            </p>
          </div>

          {/* Team Management */}
          <div
            className={`rounded-md border p-4 transition-all ${
              role === "admin"
                ? "border-pastel-peach-200 bg-pastel-peach-50/50 hover:bg-pastel-peach-50"
                : "border-slate-200 bg-slate-50/60 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between">
              <Users className="h-4 w-4 text-pastel-peach-500" />
              {role === "admin" ? (
                <span className="flex items-center gap-1 rounded bg-pastel-mint-100 px-1.5 py-0.5 text-[10px] font-semibold text-pastel-mint-500">
                  <Check className="h-3 w-3" />
                  Active
                </span>
              ) : (
                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                  Admin Only
                </span>
              )}
            </div>
            <h4 className="mt-2 text-xs font-bold text-slate-800">Team RBAC</h4>
            <p className="mt-1 text-[11px] text-slate-500 leading-tight">
              Provision agency users and manage access roles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

