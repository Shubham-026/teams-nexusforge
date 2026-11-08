"use client";

import React, { useState } from "react";
import { Task, TaskPriority, TaskStatus, TeamMember } from "@/lib/types";
import { X, Plus, Calendar, AlertCircle } from "lucide-react";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Partial<Task>) => Promise<void>;
  teamMembers: TeamMember[];
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  teamMembers,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a task title");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        title,
        description: description.trim() ? description : null,
        priority,
        status,
        assigned_to: assignedTo ? assignedTo : null,
        due_date: dueDate ? dueDate : null,
      });
      // reset form
      setTitle("");
      setDescription("");
      setPriority("medium");
      setStatus("todo");
      setAssignedTo("");
      setDueDate("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-all duration-300">
      <div className="w-full max-w-lg rounded-lg border border-pastel-lavender-200 bg-white p-6 shadow-soft-lg transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Create New Team Task</h3>
            <p className="text-xs text-slate-400">Assign work items to NexusForge team members</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500 transition-all duration-300 hover:scale-[1.02] hover:bg-pastel-peach-50 hover:text-pastel-peach-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design 3D particle hero for agency landing page"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition-all duration-300 focus:border-pastel-lavender-400 focus:outline-none focus:ring-2 focus:ring-pastel-lavender-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed specifications, deliverables, and guidelines..."
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition-all duration-300 focus:border-pastel-lavender-400 focus:outline-none focus:ring-2 focus:ring-pastel-lavender-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 transition-all duration-300 focus:border-pastel-lavender-400 focus:outline-none focus:ring-2 focus:ring-pastel-lavender-100"
              >
                <option value="low">Low (Muted Mint)</option>
                <option value="medium">Medium (Sky Blue)</option>
                <option value="high">High (Pale Peach)</option>
                <option value="urgent">Urgent (Soft Coral)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Column
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 transition-all duration-300 focus:border-pastel-lavender-400 focus:outline-none focus:ring-2 focus:ring-pastel-lavender-100"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assignee
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 transition-all duration-300 focus:border-pastel-lavender-400 focus:outline-none focus:ring-2 focus:ring-pastel-lavender-100"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 transition-all duration-300 focus:border-pastel-lavender-400 focus:outline-none focus:ring-2 focus:ring-pastel-lavender-100"
              >
              </input>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition-all duration-300 hover:scale-[1.02] hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-md border border-pastel-lavender-300 bg-pastel-lavender-500 px-4 py-2 text-xs font-semibold text-white shadow-soft-sm transition-all duration-300 hover:scale-[1.02] hover:bg-pastel-lavender-400 hover:shadow-soft-md disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>{loading ? "Creating..." : "Create Task"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

