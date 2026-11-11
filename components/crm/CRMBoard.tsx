"use client";

import React, { useState, useEffect } from "react";
import { CRMLead, LeadStatus, TeamMember } from "@/lib/types";
import { getCRMLeads, createCRMLead, updateCRMLeadStatus, deleteCRMLead, getTeamMembers } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import {
  Briefcase,
  Plus,
  Mail,
  Phone,
  IndianRupee,
  Building,
  User as UserIcon,
  X,
  Trash2,
  ArrowRight,
  TrendingUp,
  Target,
  CheckCircle,
} from "lucide-react";

const PIPELINE_COLUMNS: { id: LeadStatus; title: string; color: string; badgeBg: string }[] = [
  { id: "new", title: "New Inquiries", color: "border-pastel-lavender-300", badgeBg: "bg-pastel-lavender-50 text-pastel-lavender-600 border-pastel-lavender-200" },
  { id: "contacted", title: "Outreach & Discovery", color: "border-pastel-sky-300", badgeBg: "bg-pastel-sky-50 text-pastel-sky-600 border-pastel-sky-200" },
  { id: "proposal_sent", title: "Proposal Sent", color: "border-pastel-peach-300", badgeBg: "bg-pastel-peach-50 text-pastel-peach-600 border-pastel-peach-200" },
  { id: "negotiation", title: "Negotiation", color: "border-amber-300", badgeBg: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "won", title: "Closed Won 🎉", color: "border-pastel-mint-300", badgeBg: "bg-pastel-mint-50 text-pastel-mint-600 border-pastel-mint-200" },
];

export const CRMBoard: React.FC = () => {
  const { role } = useAuth();
  const { success, error: toastError, info } = useToast();
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // New Lead Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [value, setValue] = useState<string>("5000");
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadsData, membersData] = await Promise.all([
        getCRMLeads(),
        getTeamMembers(),
      ]);
      setLeads(leadsData);
      setMembers(membersData);
    } catch (err: any) {
      toastError("Failed to load CRM data", err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createCRMLead({
        company_name: companyName,
        contact_person: contactPerson,
        email,
        phone: phone || null,
        value: parseFloat(value) || 0,
        status: "new",
        assigned_to: assignedTo || null,
        notes: notes || null,
      });

      success("New Lead Added", "Opportunity created in sales pipeline.");
      setIsModalOpen(false);
      setCompanyName("");
      setContactPerson("");
      setEmail("");
      setPhone("");
      setValue("5000");
      setNotes("");
      await fetchData();
    } catch (err: any) {
      toastError("Failed to create lead", err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMoveStatus = async (leadId: string, nextStatus: LeadStatus) => {
    try {
      await updateCRMLeadStatus(leadId, nextStatus);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: nextStatus } : l))
      );
      success("Stage Updated", `Lead moved to ${nextStatus.replace("_", " ")}`);
    } catch (err: any) {
      toastError("Stage Update Failed", err?.message);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await deleteCRMLead(leadId);
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      info("Lead Removed", "Opportunity deleted from CRM.");
    } catch (err: any) {
      toastError("Delete Failed", err?.message);
    }
  };

  // Pipeline metrics
  const totalPipelineValue = leads.reduce((acc, l) => acc + (Number(l.value) || 0), 0);
  const wonDeals = leads.filter((l) => l.status === "won");
  const wonValue = wonDeals.reduce((acc, l) => acc + (Number(l.value) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Sales CRM & Lead Pipeline
            </h1>
            <span className="rounded-md border border-pastel-sky-200 bg-pastel-sky-50 px-2 py-0.5 text-xs font-semibold text-pastel-sky-600">
              Sales / Executive Access
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Client acquisition tracking, project proposals, and revenue pipeline for NexusForge Agency.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-md border border-pastel-sky-300 bg-pastel-sky-500 px-4 py-2.5 text-xs font-semibold text-white shadow-soft-sm transition-all duration-300 hover:scale-[1.02] hover:bg-pastel-sky-400 hover:shadow-md active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Add Prospective Client</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-pastel-sky-200 bg-pastel-sky-50/70 p-4 shadow-soft-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Total Pipeline Value</span>
            <TrendingUp className="h-4 w-4 text-pastel-sky-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            ₹{totalPipelineValue.toLocaleString()}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
            Across {leads.length} active opportunities
          </p>
        </div>

        <div className="rounded-lg border border-pastel-mint-200 bg-pastel-mint-50/70 p-4 shadow-soft-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Closed Won Revenue</span>
            <CheckCircle className="h-4 w-4 text-pastel-mint-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            ₹{wonValue.toLocaleString()}
          </p>
          <p className="mt-0.5 text-[11px] text-pastel-mint-600 font-medium">
            {wonDeals.length} contracts signed
          </p>
        </div>

        <div className="rounded-lg border border-pastel-lavender-200 bg-pastel-lavender-50/70 p-4 shadow-soft-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Active Prospects</span>
            <Target className="h-4 w-4 text-pastel-lavender-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {leads.filter((l) => l.status !== "won" && l.status !== "lost").length}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
            Currently in negotiation / outreach
          </p>
        </div>
      </div>

      {/* Pipeline Columns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {PIPELINE_COLUMNS.map((col) => {
          const colLeads = leads.filter((l) => l.status === col.id);
          const colValue = colLeads.reduce((acc, l) => acc + (Number(l.value) || 0), 0);

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-lg border border-slate-200/80 bg-slate-50/60 p-3 shadow-soft-sm min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-slate-800">{col.title}</h3>
                  <span className={`rounded border px-1.5 py-0.2 text-[10px] font-semibold ${col.badgeBg}`}>
                    {colLeads.length}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-medium text-slate-500">
                  ₹{colValue.toLocaleString()}
                </span>
              </div>

              {/* Cards List */}
              <div className="flex-1 space-y-2.5 overflow-y-auto">
                {colLeads.length === 0 ? (
                  <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-slate-200 text-[11px] text-slate-400">
                    No leads in this stage
                  </div>
                ) : (
                  colLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-soft-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-soft-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 leading-tight">
                            {lead.company_name}
                          </h4>
                          <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                            {lead.contact_person}
                          </p>
                        </div>
                        <span className="rounded-md border border-pastel-mint-200 bg-pastel-mint-50 px-2 py-0.5 font-mono text-[11px] font-bold text-pastel-mint-600">
                          ₹{Number(lead.value).toLocaleString()}
                        </span>
                      </div>

                      {/* Contact Details */}
                      <div className="mt-2.5 space-y-1 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                      </div>

                      {lead.notes && (
                        <p className="mt-2 rounded bg-slate-50 p-1.5 text-[10px] text-slate-500 italic line-clamp-2">
                          "{lead.notes}"
                        </p>
                      )}

                      {/* Actions */}
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          title="Delete opportunity"
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        {/* Move next stage */}
                        {col.id !== "won" && (
                          <button
                            onClick={() => {
                              const order: LeadStatus[] = ["new", "contacted", "proposal_sent", "negotiation", "won"];
                              const currIdx = order.indexOf(col.id);
                              if (currIdx !== -1 && currIdx < order.length - 1) {
                                handleMoveStatus(lead.id, order[currIdx + 1]);
                              }
                            }}
                            className="flex items-center gap-1 font-semibold text-pastel-sky-600 hover:text-pastel-sky-700 hover:underline"
                          >
                            <span>Next Stage</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-pastel-sky-200 bg-pastel-sky-100 text-pastel-sky-500 shadow-soft-sm">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Add Prospective Client
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Track client acquisition in sales pipeline
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

            <form onSubmit={handleCreateLead} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company / Organization Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme FinTech Corp"
                    className="w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-soft-sm focus:border-pastel-sky-400 focus:outline-none focus:ring-2 focus:ring-pastel-sky-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Key Contact Person
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Sarah Jenkins (Head of Marketing)"
                    className="w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-soft-sm focus:border-pastel-sky-400 focus:outline-none focus:ring-2 focus:ring-pastel-sky-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@acme.com"
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-soft-sm focus:border-pastel-sky-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555-0192"
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-soft-sm focus:border-pastel-sky-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Deal Value (₹)
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    min={0}
                    step={100}
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="5000"
                    className="w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-soft-sm focus:border-pastel-sky-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Sales Lead
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-soft-sm focus:border-pastel-sky-400 focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scope & Project Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Website redesign and custom CRM automation scope..."
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-soft-sm focus:border-pastel-sky-400 focus:outline-none"
                />
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
                  className="rounded-md border border-pastel-sky-300 bg-pastel-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-pastel-sky-400 disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add to Pipeline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
