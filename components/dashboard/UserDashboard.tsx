"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  getTasks,
  updateTaskStatus,
  getCRMLeads,
  updateCRMLeadStatus,
} from "@/lib/supabase";
import { Task, CRMLead, TaskStatus, LeadStatus, UserRole } from "@/lib/types";
import {
  Kanban,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Target,
  ArrowRight,
  ExternalLink,
  Calendar,
  IndianRupee,
  Phone,
  Mail,
  FileText,
  Shield,
  Sparkles,
  ChevronRight,
  Check,
  XCircle,
  Loader2,
} from "lucide-react";

export const UserDashboard: React.FC = () => {
  const { user, teamMember, role, isAdmin, isCEO, isSales, isLead } = useAuth();
  const { success, error: toastError } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [loading, setLoading] = useState(true);

  // Task Filter State
  const [taskFilter, setTaskFilter] = useState<"all" | TaskStatus>("all");
  const [taskViewScope, setTaskViewScope] = useState<"assigned" | "all">("assigned");

  // Lead Filter State
  const [leadStageFilter, setLeadStageFilter] = useState<string>("all");
  const [leadViewScope, setLeadViewScope] = useState<"assigned" | "all">(
    isAdmin || isCEO ? "all" : "assigned"
  );

  const isSalesOrLeadManager = isSales || isLead || isAdmin || isCEO;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fetchedTasks, fetchedLeads] = await Promise.all([
        getTasks().catch(() => []),
        isSalesOrLeadManager ? getCRMLeads().catch(() => []) : Promise.resolve([]),
      ]);
      setTasks(fetchedTasks);
      setLeads(fetchedLeads);
    } catch (err: any) {
      console.warn("Error fetching dashboard telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, isSalesOrLeadManager]);

  // Handle Quick Task Status Update
  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      await updateTaskStatus(taskId, newStatus);
      success("Task Updated", `Task moved to ${newStatus.replace("_", " ")}`);
    } catch (err: any) {
      toastError("Update Failed", err?.message || "Failed to update task status");
      fetchData();
    }
  };

  // Handle Quick CRM Lead Status Update
  const handleUpdateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    try {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      );
      await updateCRMLeadStatus(leadId, newStatus);
      success("Lead Updated", `Lead status updated to ${newStatus.replace("_", " ")}`);
    } catch (err: any) {
      toastError("Update Failed", err?.message || "Failed to update lead status");
      fetchData();
    }
  };

  // Filter Tasks assigned to logged-in user
  const currentUserId = user?.uid;
  const currentUserEmail = user?.email?.toLowerCase();

  const isAssignedToMe = (assignedTo?: string | null, memberEmail?: string | null) => {
    if (!assignedTo && !memberEmail) return false;
    if (assignedTo && (assignedTo === currentUserId || assignedTo === teamMember?.id)) return true;
    if (memberEmail && currentUserEmail && memberEmail.toLowerCase() === currentUserEmail) return true;
    return false;
  };

  // Filtered Tasks
  const relevantTasks = taskViewScope === "assigned"
    ? tasks.filter((t) => isAssignedToMe(t.assigned_to, t.assigned_member?.email))
    : tasks;

  const displayTasks = relevantTasks.filter((t) => {
    if (taskFilter === "all") return true;
    return t.status === taskFilter;
  });

  // Task Counts
  const myAssignedCount = tasks.filter((t) =>
    isAssignedToMe(t.assigned_to, t.assigned_member?.email)
  ).length;

  const myTodoCount = tasks.filter(
    (t) => isAssignedToMe(t.assigned_to, t.assigned_member?.email) && t.status === "todo"
  ).length;

  const myInProgressCount = tasks.filter(
    (t) =>
      isAssignedToMe(t.assigned_to, t.assigned_member?.email) &&
      (t.status === "in_progress" || t.status === "review")
  ).length;

  const myCompletedCount = tasks.filter(
    (t) => isAssignedToMe(t.assigned_to, t.assigned_member?.email) && t.status === "done"
  ).length;

  // Filtered Leads
  const relevantLeads = leadViewScope === "assigned"
    ? leads.filter((l) => isAssignedToMe(l.assigned_to, l.assigned_member?.email))
    : leads;

  const displayLeads = relevantLeads.filter((l) => {
    if (leadStageFilter === "all") return true;
    if (leadStageFilter === "interested") {
      return l.status === "proposal_sent" || l.status === "negotiation";
    }
    if (leadStageFilter === "not_interested") {
      return l.status === "lost";
    }
    return l.status === leadStageFilter;
  });

  // Outreach & CRM Metrics
  const totalLeadsCount = relevantLeads.length;
  const contactedCount = relevantLeads.filter((l) => l.status === "contacted").length;
  const interestedCount = relevantLeads.filter(
    (l) => l.status === "proposal_sent" || l.status === "negotiation"
  ).length;
  const wonCount = relevantLeads.filter((l) => l.status === "won").length;
  const lostCount = relevantLeads.filter((l) => l.status === "lost").length;

  // Conversion calculations
  const totalClosed = wonCount + lostCount;
  const conversionRate = totalClosed > 0
    ? Math.round((wonCount / totalClosed) * 100)
    : totalLeadsCount > 0
    ? Math.round((wonCount / totalLeadsCount) * 100)
    : 0;

  const pipelineValue = relevantLeads
    .filter((l) => l.status !== "lost")
    .reduce((sum, l) => sum + (Number(l.value) || 0), 0);

  const wonRevenue = relevantLeads
    .filter((l) => l.status === "won")
    .reduce((sum, l) => sum + (Number(l.value) || 0), 0);

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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-rose-50 text-rose-600 border-rose-200";
      case "high":
        return "bg-pastel-peach-100 text-pastel-peach-500 border-pastel-peach-200";
      case "medium":
        return "bg-pastel-sky-100 text-pastel-sky-500 border-pastel-sky-200";
      default:
        return "bg-pastel-mint-100 text-pastel-mint-500 border-pastel-mint-200";
    }
  };

  const getLeadStageBadge = (status: LeadStatus) => {
    switch (status) {
      case "won":
        return {
          label: "Converted (Won)",
          className: "bg-pastel-mint-100 text-pastel-mint-500 border-pastel-mint-200",
        };
      case "negotiation":
        return {
          label: "In Negotiation",
          className: "bg-pastel-lavender-100 text-pastel-lavender-500 border-pastel-lavender-200",
        };
      case "proposal_sent":
        return {
          label: "Interested (Proposal)",
          className: "bg-pastel-sky-100 text-pastel-sky-500 border-pastel-sky-200",
        };
      case "contacted":
        return {
          label: "Outreach Sent",
          className: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "lost":
        return {
          label: "Not Interested",
          className: "bg-rose-50 text-rose-600 border-rose-200",
        };
      default:
        return {
          label: "New Lead",
          className: "bg-slate-100 text-slate-600 border-slate-200",
        };
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] w-full flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-pastel-lavender-500" />
        <p className="text-xs font-medium text-slate-500">
          Loading personalized agency dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Welcome & Operational Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Welcome back, {teamMember?.name || user?.displayName || "Team Member"}
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
            Personalized dashboard tracking your assigned deliverables, outreach pipeline, and conversion performance.
          </p>
        </div>

        {/* Quick Route Shortcuts */}
        <div className="flex items-center gap-2">
          <Link
            href="/tasks"
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-soft-sm transition-all duration-300 hover:scale-[1.02] hover:bg-slate-50 active:scale-95"
          >
            <Kanban className="h-3.5 w-3.5 text-pastel-lavender-500" />
            <span>Task Board</span>
          </Link>
          {isSalesOrLeadManager && (
            <Link
              href="/crm"
              className="flex items-center gap-1.5 rounded-md border border-pastel-sky-200 bg-pastel-sky-50 px-3 py-1.5 text-xs font-semibold text-pastel-sky-500 shadow-soft-sm transition-all duration-300 hover:scale-[1.02] hover:bg-pastel-sky-100 active:scale-95"
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Sales CRM</span>
            </Link>
          )}
        </div>
      </div>

      {/* 2. Key Telemetry Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
        {/* Metric 1: My Active Tasks */}
        <div className="rounded-lg border border-pastel-lavender-200/80 bg-white p-4 shadow-soft-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-soft-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Assigned Tasks</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-pastel-lavender-200 bg-pastel-lavender-50 text-pastel-lavender-500">
              <Kanban className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{myAssignedCount}</span>
            <span className="text-[11px] text-slate-400">deliverables</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className="font-semibold text-amber-600">{myInProgressCount} In Progress</span>
            <span>•</span>
            <span className="font-semibold text-pastel-mint-500">{myCompletedCount} Done</span>
          </div>
        </div>

        {/* Metric 2: To Do / Immediate Attention */}
        <div className="rounded-lg border border-pastel-peach-200/80 bg-white p-4 shadow-soft-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-soft-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">To Do Queue</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-pastel-peach-200 bg-pastel-peach-50 text-pastel-peach-500">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{myTodoCount}</span>
            <span className="text-[11px] text-slate-400">pending</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">Ready to be started</p>
        </div>

        {/* Metric 3: Outreach & Pipeline (Sales / Lead Manager Only, or fallback) */}
        {isSalesOrLeadManager ? (
          <>
            <div className="rounded-lg border border-pastel-sky-200/80 bg-white p-4 shadow-soft-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-soft-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">
                  {leadViewScope === "assigned" ? "My Outreach" : "Agency Outreach"}
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-md border border-pastel-sky-200 bg-pastel-sky-50 text-pastel-sky-500">
                  <Target className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{totalLeadsCount}</span>
                <span className="text-[11px] text-slate-400">prospects</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                <span className="font-semibold text-pastel-sky-500">{interestedCount} Interested</span>
                <span>•</span>
                <span className="font-semibold text-pastel-mint-500">{wonCount} Won</span>
              </div>
            </div>

            {/* Metric 4: Conversion Ratio */}
            <div className="rounded-lg border border-pastel-mint-200/80 bg-white p-4 shadow-soft-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-soft-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">Conversion Ratio</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-md border border-pastel-mint-200 bg-pastel-mint-50 text-pastel-mint-500">
                  <TrendingUp className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{conversionRate}%</span>
                <span className="text-[11px] font-medium text-pastel-mint-500">win rate</span>
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                {wonCount} won of {totalClosed || totalLeadsCount} closed deals
              </p>
            </div>
          </>
        ) : (
          <>
            {/* General Member Accomplishments */}
            <div className="rounded-lg border border-pastel-mint-200/80 bg-white p-4 shadow-soft-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-soft-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">Completed</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-md border border-pastel-mint-200 bg-pastel-mint-50 text-pastel-mint-500">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{myCompletedCount}</span>
                <span className="text-[11px] text-slate-400">delivered</span>
              </div>
              <p className="mt-1 text-[10px] text-pastel-mint-500 font-medium">Quality verified</p>
            </div>

            {/* Operational Domain */}
            <div className="rounded-lg border border-pastel-lavender-200/80 bg-white p-4 shadow-soft-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-soft-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">Agency Workspace</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-md border border-pastel-lavender-200 bg-pastel-lavender-50 text-pastel-lavender-500">
                  <Shield className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="mt-2 font-mono text-xs font-semibold text-slate-800">
                teams.nexusforgeagency.in
              </p>
              <p className="mt-1 text-[10px] text-slate-400">Authenticated Member</p>
            </div>
          </>
        )}
      </div>

      {/* 3. SALES / LEAD MANAGER OUTREACH & CONVERSION SECTION */}
      {isSalesOrLeadManager && (
        <div className="space-y-4 rounded-lg border border-pastel-sky-200/80 bg-white p-6 shadow-soft-sm">
          {/* Section Header with View Scope Toggle */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-pastel-sky-200 bg-pastel-sky-50 text-pastel-sky-500 shadow-soft-sm">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Sales Outreach & Client Conversion Analytics
                </h2>
                <p className="text-[11px] text-slate-500">
                  Track client interest levels, outreach stages, and closing ratios.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(isAdmin || isCEO) && (
                <div className="flex items-center rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs">
                  <button
                    onClick={() => setLeadViewScope("assigned")}
                    className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-all ${
                      leadViewScope === "assigned"
                        ? "bg-white text-slate-800 shadow-soft-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    My Leads
                  </button>
                  <button
                    onClick={() => setLeadViewScope("all")}
                    className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-all ${
                      leadViewScope === "all"
                        ? "bg-white text-slate-800 shadow-soft-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Agency Wide
                  </button>
                </div>
              )}

              <Link
                href="/crm"
                className="flex items-center gap-1 rounded-md border border-pastel-sky-200 bg-pastel-sky-50 px-2.5 py-1 text-xs font-semibold text-pastel-sky-500 hover:bg-pastel-sky-100 transition-all"
              >
                <span>Full CRM Pipeline</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Client Stages & Outreach Conversion Bar */}
          <div className="rounded-md border border-slate-200/80 bg-slate-50/60 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
              <span className="text-xs font-bold text-slate-700">
                Client Pipeline Stages Distribution
              </span>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-500">
                  Active Pipeline Value:{" "}
                  <strong className="text-slate-800 font-mono font-semibold">
                    ₹{pipelineValue.toLocaleString()}
                  </strong>
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-pastel-mint-500 font-semibold">
                  Won Revenue: ₹{wonRevenue.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Visual Multi-segment Progress Bar */}
            <div className="flex h-3 w-full overflow-hidden rounded-md bg-slate-200">
              {totalLeadsCount > 0 ? (
                <>
                  <div
                    style={{ width: `${(contactedCount / totalLeadsCount) * 100}%` }}
                    className="bg-amber-400 transition-all"
                    title={`Contacted: ${contactedCount}`}
                  />
                  <div
                    style={{ width: `${(interestedCount / totalLeadsCount) * 100}%` }}
                    className="bg-pastel-sky-400 transition-all"
                    title={`Interested / In Proposal: ${interestedCount}`}
                  />
                  <div
                    style={{ width: `${(wonCount / totalLeadsCount) * 100}%` }}
                    className="bg-pastel-mint-400 transition-all"
                    title={`Converted / Won: ${wonCount}`}
                  />
                  <div
                    style={{ width: `${(lostCount / totalLeadsCount) * 100}%` }}
                    className="bg-rose-400 transition-all"
                    title={`Not Interested: ${lostCount}`}
                  />
                </>
              ) : (
                <div className="w-full bg-slate-200" />
              )}
            </div>

            {/* Interactive Stage Filters / Cards */}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-6">
              <button
                onClick={() => setLeadStageFilter("all")}
                className={`flex flex-col items-start rounded-md border p-2 text-left transition-all ${
                  leadStageFilter === "all"
                    ? "border-pastel-lavender-400 bg-white ring-1 ring-pastel-lavender-300 shadow-soft-sm"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <span className="text-[10px] font-semibold text-slate-400 uppercase">
                  All Leads
                </span>
                <span className="text-sm font-bold text-slate-800">{totalLeadsCount}</span>
              </button>

              <button
                onClick={() => setLeadStageFilter("contacted")}
                className={`flex flex-col items-start rounded-md border p-2 text-left transition-all ${
                  leadStageFilter === "contacted"
                    ? "border-amber-400 bg-amber-50/50 ring-1 ring-amber-300 shadow-soft-sm"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <span className="text-[10px] font-semibold text-amber-700 uppercase">
                  Outreach Sent
                </span>
                <span className="text-sm font-bold text-amber-800">{contactedCount}</span>
              </button>

              <button
                onClick={() => setLeadStageFilter("interested")}
                className={`flex flex-col items-start rounded-md border p-2 text-left transition-all ${
                  leadStageFilter === "interested"
                    ? "border-pastel-sky-400 bg-pastel-sky-50/50 ring-1 ring-pastel-sky-300 shadow-soft-sm"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <span className="text-[10px] font-semibold text-pastel-sky-500 uppercase">
                  Interested / Proposal
                </span>
                <span className="text-sm font-bold text-pastel-sky-500">{interestedCount}</span>
              </button>

              <button
                onClick={() => setLeadStageFilter("negotiation")}
                className={`flex flex-col items-start rounded-md border p-2 text-left transition-all ${
                  leadStageFilter === "negotiation"
                    ? "border-pastel-lavender-400 bg-pastel-lavender-50/50 ring-1 ring-pastel-lavender-300 shadow-soft-sm"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <span className="text-[10px] font-semibold text-pastel-lavender-500 uppercase">
                  In Negotiation
                </span>
                <span className="text-sm font-bold text-pastel-lavender-500">
                  {relevantLeads.filter((l) => l.status === "negotiation").length}
                </span>
              </button>

              <button
                onClick={() => setLeadStageFilter("won")}
                className={`flex flex-col items-start rounded-md border p-2 text-left transition-all ${
                  leadStageFilter === "won"
                    ? "border-pastel-mint-400 bg-pastel-mint-50/50 ring-1 ring-pastel-mint-300 shadow-soft-sm"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <span className="text-[10px] font-semibold text-pastel-mint-500 uppercase">
                  Converted (Won)
                </span>
                <span className="text-sm font-bold text-pastel-mint-500">{wonCount}</span>
              </button>

              <button
                onClick={() => setLeadStageFilter("not_interested")}
                className={`flex flex-col items-start rounded-md border p-2 text-left transition-all ${
                  leadStageFilter === "not_interested"
                    ? "border-rose-400 bg-rose-50/50 ring-1 ring-rose-300 shadow-soft-sm"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <span className="text-[10px] font-semibold text-rose-600 uppercase">
                  Not Interested
                </span>
                <span className="text-sm font-bold text-rose-700">{lostCount}</span>
              </button>
            </div>
          </div>

          {/* Quick Lead Outreach & Stage Updater Table */}
          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Company & Contact</th>
                  <th className="px-4 py-2.5">Deal Value</th>
                  <th className="px-4 py-2.5">Client Stage</th>
                  <th className="px-4 py-2.5">Assigned Manager</th>
                  <th className="px-4 py-2.5 text-right">Quick Stage Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No client leads found matching this filter criteria.
                    </td>
                  </tr>
                ) : (
                  displayLeads.slice(0, 6).map((lead) => {
                    const stageBadge = getLeadStageBadge(lead.status);
                    return (
                      <tr
                        key={lead.id}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-800">{lead.company_name}</p>
                          <p className="text-[11px] text-slate-500">
                            {lead.contact_person} • {lead.email}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                          ₹{Number(lead.value || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${stageBadge.className}`}
                          >
                            {stageBadge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-600">
                          {lead.assigned_member?.name || "Unassigned"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {/* Inline Stage Dropdown */}
                          <select
                            value={lead.status}
                            onChange={(e) =>
                              handleUpdateLeadStatus(lead.id, e.target.value as LeadStatus)
                            }
                            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-soft-sm transition-all focus:border-pastel-sky-400 focus:outline-none"
                          >
                            <option value="new">New Inbound</option>
                            <option value="contacted">Outreach Sent</option>
                            <option value="proposal_sent">Interested (Proposal)</option>
                            <option value="negotiation">In Negotiation</option>
                            <option value="won">Converted (Won)</option>
                            <option value="lost">Not Interested</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MY ASSIGNED TASKS & DELIVERABLES (For Every User) */}
      <div className="space-y-4 rounded-lg border border-pastel-lavender-200/80 bg-white p-6 shadow-soft-sm">
        {/* Section Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-pastel-lavender-200 bg-pastel-lavender-50 text-pastel-lavender-500 shadow-soft-sm">
              <Kanban className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {taskViewScope === "assigned"
                  ? "My Assigned Deliverables"
                  : "Agency Deliverables"}
              </h2>
              <p className="text-[11px] text-slate-500">
                Review deliverables assigned directly to your account and advance their completion status.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(isAdmin || isCEO) && (
              <div className="flex items-center rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs">
                <button
                  onClick={() => setTaskViewScope("assigned")}
                  className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    taskViewScope === "assigned"
                      ? "bg-white text-slate-800 shadow-soft-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  My Tasks ({myAssignedCount})
                </button>
                <button
                  onClick={() => setTaskViewScope("all")}
                  className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    taskViewScope === "all"
                      ? "bg-white text-slate-800 shadow-soft-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  All Tasks ({tasks.length})
                </button>
              </div>
            )}

            <Link
              href="/tasks"
              className="flex items-center gap-1 rounded-md border border-pastel-lavender-200 bg-pastel-lavender-50 px-2.5 py-1 text-xs font-semibold text-pastel-lavender-500 hover:bg-pastel-lavender-100 transition-all"
            >
              <span>Full Task Board</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Task Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
          {(["all", "todo", "in_progress", "review", "done"] as const).map((st) => {
            const count = st === "all"
              ? relevantTasks.length
              : relevantTasks.filter((t) => t.status === st).length;
            const labels: Record<string, string> = {
              all: "All",
              todo: "To Do",
              in_progress: "In Progress",
              review: "Review",
              done: "Completed",
            };
            return (
              <button
                key={st}
                onClick={() => setTaskFilter(st)}
                className={`rounded-md border px-3 py-1 text-xs font-semibold transition-all ${
                  taskFilter === st
                    ? "border-pastel-lavender-400 bg-pastel-lavender-50 text-pastel-lavender-600 shadow-soft-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {labels[st]} ({count})
              </button>
            );
          })}
        </div>

        {/* Tasks List */}
        {displayTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-pastel-mint-200 bg-pastel-mint-50 text-pastel-mint-500 shadow-soft-sm">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="mt-3 text-xs font-bold text-slate-700">
              No tasks pending in this filter
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {taskViewScope === "assigned"
                ? "You are all caught up! No active deliverables assigned to you right now."
                : "No tasks created in this stage."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {displayTasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col justify-between rounded-lg border border-slate-200/90 bg-white p-4 shadow-soft-sm transition-all duration-300 hover:scale-[1.01] hover:border-pastel-lavender-300 hover:shadow-soft-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getPriorityBadge(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>

                    {task.due_date && (
                      <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                        <Calendar className="h-3 w-3" />
                        {task.due_date}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-2 text-xs font-bold text-slate-900 leading-snug">
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Footer Controls: Assignee & Direct Status Action */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-sm border border-pastel-lavender-200 bg-pastel-lavender-50 text-[9px] font-bold text-pastel-lavender-500">
                      {task.assigned_member?.avatar_initials || "NF"}
                    </div>
                    <span className="text-[11px] font-medium text-slate-600 truncate max-w-[90px]">
                      {task.assigned_member?.name || "Unassigned"}
                    </span>
                  </div>

                  {/* Inline Status Changer Dropdown */}
                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleUpdateTaskStatus(task.id, e.target.value as TaskStatus)
                    }
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 transition-all focus:border-pastel-lavender-400 focus:bg-white focus:outline-none"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="done">Completed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

