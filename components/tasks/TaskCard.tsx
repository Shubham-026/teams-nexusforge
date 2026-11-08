"use client";

import React from "react";
import { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { Calendar, Trash2, ArrowRight, ArrowLeft, GripVertical } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onDelete: (id: string) => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
}

const priorityConfig: Record<TaskPriority, { label: string; bg: string; text: string; border: string }> = {
  low: {
    label: "Low",
    bg: "bg-pastel-mint-50",
    text: "text-pastel-mint-500",
    border: "border-pastel-mint-200",
  },
  medium: {
    label: "Medium",
    bg: "bg-pastel-sky-50",
    text: "text-pastel-sky-500",
    border: "border-pastel-sky-200",
  },
  high: {
    label: "High",
    bg: "bg-pastel-peach-50",
    text: "text-pastel-peach-500",
    border: "border-pastel-peach-200",
  },
  urgent: {
    label: "Urgent",
    bg: "bg-red-50",
    text: "text-rose-600",
    border: "border-rose-200",
  },
};

const statusOrder: TaskStatus[] = ["todo", "in_progress", "review", "done"];

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  onDelete,
  onDragStart,
}) => {
  const currentIdx = statusOrder.indexOf(task.status);
  const priorityStyle = priorityConfig[task.priority] || priorityConfig.medium;

  const handleNext = () => {
    if (currentIdx < statusOrder.length - 1) {
      onStatusChange(task.id, statusOrder[currentIdx + 1]);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      onStatusChange(task.id, statusOrder[currentIdx - 1]);
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, task.id)}
      className="group relative flex cursor-grab flex-col justify-between rounded-lg border border-slate-200/90 bg-white p-4 shadow-soft-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-pastel-lavender-300 active:cursor-grabbing"
    >
      <div>
        {/* Header Tags: Priority & Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <GripVertical className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-400 transition-colors" />
            {/* Strict soft square badge: rounded-md, NEVER rounded-full */}
            <span
              className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}
            >
              {priorityStyle.label}
            </span>
          </div>

          <button
            onClick={() => onDelete(task.id)}
            title="Delete task"
            className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-all duration-300 hover:bg-pastel-peach-100 hover:text-pastel-peach-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Title */}
        <h4 className="mt-2.5 text-sm font-semibold text-slate-800 leading-snug">
          {task.title}
        </h4>

        {/* Description */}
        {task.description && (
          <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Footer: Assignee, Due Date & Quick Advancement */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Strict soft square assignee avatar */}
          <div
            title={task.assigned_member?.name || "Assigned Team Member"}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-pastel-lavender-200 bg-pastel-lavender-100 text-[11px] font-bold text-pastel-lavender-500"
          >
            {task.assigned_member?.avatar_initials || "NF"}
          </div>

          {task.due_date && (
            <div className="flex items-center gap-1 rounded-md bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
              <Calendar className="h-3 w-3 text-slate-400" />
              <span>{task.due_date}</span>
            </div>
          )}
        </div>

        {/* Status Stage progression controls */}
        <div className="flex items-center gap-1">
          {currentIdx > 0 && (
            <button
              onClick={handlePrev}
              title="Move backward"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition-all duration-300 hover:scale-[1.02] hover:bg-white hover:border-pastel-lavender-300 hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          )}

          {currentIdx < statusOrder.length - 1 && (
            <button
              onClick={handleNext}
              title="Advance to next stage"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-pastel-mint-200 bg-pastel-mint-50 text-pastel-mint-500 transition-all duration-300 hover:scale-[1.02] hover:bg-pastel-mint-100 hover:shadow-soft-sm"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
