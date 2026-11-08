"use client";

import React, { useEffect, useState } from "react";
import { Task, TaskStatus, TeamMember } from "@/lib/types";
import { TaskCard } from "./TaskCard";
import { CreateTaskModal } from "./CreateTaskModal";
import { KanbanSkeleton } from "./KanbanSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getTasks, createTask, updateTaskStatus, deleteTask, subscribeToTasks, getTeamMembers } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";
import { Plus, Search, Filter, Kanban as KanbanIcon, Sparkles, CheckCircle2, Clock, CheckCheck, TrendingUp } from "lucide-react";

const initialColumns: { id: TaskStatus; title: string; color: string; border: string; bg: string }[] = [
  {
    id: "todo",
    title: "To Do",
    color: "text-pastel-lavender-500",
    border: "border-pastel-lavender-200",
    bg: "bg-pastel-lavender-50/50",
  },
  {
    id: "in_progress",
    title: "In Progress",
    color: "text-pastel-sky-500",
    border: "border-pastel-sky-200",
    bg: "bg-pastel-sky-50/50",
  },
  {
    id: "review",
    title: "Review",
    color: "text-pastel-peach-500",
    border: "border-pastel-peach-200",
    bg: "bg-pastel-peach-50/50",
  },
  {
    id: "done",
    title: "Done",
    color: "text-pastel-mint-500",
    border: "border-pastel-mint-200",
    bg: "bg-pastel-mint-50/50",
  },
];

export const KanbanBoard: React.FC = () => {
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to persist to localStorage
  const saveToLocal = (newTasks: Task[]) => {
    try {
      localStorage.setItem("nexusforge_tasks", JSON.stringify(newTasks));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Initial hydration from localStorage if available
    try {
      const cached = localStorage.getItem("nexusforge_tasks");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const userOnly = parsed.filter((t) => !["task-01", "task-02", "task-03", "task-04"].includes(t.id));
          setTasks(userOnly);
        }
      }
    } catch (e) {
      console.warn("Failed reading tasks from cache:", e);
    }

    // 2. Fetch live data exclusively from Supabase
    async function loadBoardData() {
      try {
        const [remoteTasks, members] = await Promise.all([
          getTasks(),
          getTeamMembers(),
        ]);
        if (mounted) {
          setTasks(remoteTasks || []);
          setTeamMembers(members || []);
          saveToLocal(remoteTasks || []);
          setSyncNotice(null);
        }
      } catch (err: any) {
        if (mounted) {
          const msg = err?.message || "Database connection unverified";
          console.warn("Supabase load notice:", msg);
          if (msg.includes("relation") || msg.includes("does not exist") || msg.includes("Failed to fetch")) {
            setSyncNotice("Supabase tables not initialized or reachable. Showing local state.");
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    loadBoardData();

    // 3. Subscribe to live task updates via Supabase Realtime
    const unsubscribe = subscribeToTasks(() => {
      if (mounted) {
        loadBoardData();
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t));
    setTasks(updated);
    saveToLocal(updated);

    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (err: any) {
      console.warn("Updated locally (Supabase write failed):", err?.message);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (taskId) {
      handleStatusChange(taskId, newStatus);
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDelete = async (taskId: string) => {
    const previous = [...tasks];
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    saveToLocal(updated);

    try {
      await deleteTask(taskId);
      toast.success("Task Removed", "Deleted from Supabase database");
      setSyncNotice(null);
    } catch (err: any) {
      console.error("Delete task failed:", err);
      // Revert optimistic delete if database rejected
      setTasks(previous);
      saveToLocal(previous);
      const msg = err?.message || "Could not delete task from database";
      toast.error("Delete Failed", msg);
      setSyncNotice(`Database error: ${msg}`);
    }
  };

  const handleCreateTask = async (taskData: Partial<Task>) => {
    const assignedMember = teamMembers.find((m) => m.id === taskData.assigned_to) || null;
    const tempId = `task-${Date.now()}`;
    const newTask: Task = {
      id: tempId,
      title: taskData.title || "",
      description: taskData.description || null,
      status: taskData.status || "todo",
      priority: taskData.priority || "medium",
      assigned_to: taskData.assigned_to || null,
      assigned_member: assignedMember,
      due_date: taskData.due_date || null,
      created_by: "usr_dev_03",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save immediately to local state and localStorage
    setTasks((prev) => {
      const next = [newTask, ...prev];
      saveToLocal(next);
      return next;
    });

    // Persist to Supabase
    try {
      const created = await createTask(taskData);
      if (created && created.id) {
        // Swap temp ID with Supabase UUID
        setTasks((prev) => {
          const finalized = prev.map((t) => (t.id === tempId ? created : t));
          saveToLocal(finalized);
          return finalized;
        });
        toast.success("Task Created", `"${created.title}" saved to database`);
        setSyncNotice(null);
      }
    } catch (err: any) {
      const errMsg = err?.message || "Unknown error";
      console.error("Supabase save error (kept in browser storage):", errMsg);
      toast.error("Database Save Error", errMsg);
      setSyncNotice(`Task saved in browser memory! (Supabase notice: ${errMsg})`);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesQuery =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMember = selectedMember ? t.assigned_to === selectedMember : true;
    return matchesQuery && matchesMember;
  });

  const totalCount = tasks.length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const reviewCount = tasks.filter((t) => t.status === "review").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Notice Banner if offline or database unseeded */}
      {syncNotice && (
        <div className="flex items-center justify-between rounded-md border border-pastel-peach-200 bg-pastel-peach-50/90 px-4 py-2.5 text-xs text-slate-700 shadow-soft-sm transition-all duration-300">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-pastel-peach-200 text-pastel-peach-500 font-bold text-[10px]">!</span>
            <span>{syncNotice}</span>
          </div>
          <button
            onClick={() => setSyncNotice(null)}
            className="rounded-md px-2 py-0.5 text-[11px] font-medium text-slate-500 hover:bg-pastel-peach-100 hover:text-slate-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sprint Overview Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Tasks */}
        <div className="flex items-center gap-3.5 rounded-lg border border-pastel-lavender-200/90 bg-white p-4 shadow-soft-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-pastel-lavender-200 bg-pastel-lavender-50 text-pastel-lavender-500 shadow-soft-sm">
            <KanbanIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Work Items</p>
            <p className="text-xl font-bold text-slate-800">{totalCount}</p>
          </div>
        </div>

        {/* In Progress */}
        <div className="flex items-center gap-3.5 rounded-lg border border-pastel-sky-200/90 bg-white p-4 shadow-soft-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-pastel-sky-200 bg-pastel-sky-50 text-pastel-sky-500 shadow-soft-sm">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">In Active Flow</p>
            <p className="text-xl font-bold text-slate-800">{inProgressCount}</p>
          </div>
        </div>

        {/* Under Review */}
        <div className="flex items-center gap-3.5 rounded-lg border border-pastel-peach-200/90 bg-white p-4 shadow-soft-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-pastel-peach-200 bg-pastel-peach-50 text-pastel-peach-500 shadow-soft-sm">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Editorial Review</p>
            <p className="text-xl font-bold text-slate-800">{reviewCount}</p>
          </div>
        </div>

        {/* Completed Rate */}
        <div className="flex items-center gap-3.5 rounded-lg border border-pastel-mint-200/90 bg-white p-4 shadow-soft-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-pastel-mint-200 bg-pastel-mint-50 text-pastel-mint-500 shadow-soft-sm">
            <CheckCheck className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Delivered</p>
              <span className="rounded-md border border-pastel-mint-200 bg-pastel-mint-50 px-1.5 py-0.5 text-[10px] font-bold text-pastel-mint-500">{completionRate}%</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{doneCount}</p>
          </div>
        </div>
      </div>

      {/* Top action & filter bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800">
            Sprint & Delivery Board
          </h2>
          <p className="text-xs text-slate-500">
            Drag and drop tasks across stages or use quick advancement controls
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search box with strict soft square */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-48 rounded-md border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-700 placeholder-slate-400 transition-all duration-300 focus:border-pastel-lavender-400 focus:outline-none focus:ring-2 focus:ring-pastel-lavender-100 sm:w-56"
            />
          </div>

          {/* Member select */}
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-all duration-300 focus:border-pastel-lavender-400 focus:outline-none focus:ring-2 focus:ring-pastel-lavender-100"
          >
            <option value="">All Team Members</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Create Task Button: STRICT soft square (no rounded-full) */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-md border border-pastel-lavender-300 bg-pastel-lavender-500 px-3.5 text-xs font-semibold text-white shadow-soft-sm transition-all duration-300 hover:scale-[1.02] hover:bg-pastel-lavender-400 hover:shadow-soft-md active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <KanbanSkeleton />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={KanbanIcon}
          title="Sprint delivery board is empty"
          description="Your team workspace has no active tasks. Create a new task to organize your sprints, set priorities, and assign deliverables."
          actionLabel="Create First Task"
          onAction={() => setIsModalOpen(true)}
          accent="lavender"
        />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching tasks found"
          description={`No tasks match "${searchQuery}" or the selected assignee. Try adjusting or resetting your filter criteria.`}
          actionLabel="Reset Search & Filters"
          onAction={() => {
            setSearchQuery("");
            setSelectedMember("");
          }}
          accent="lavender"
        />
      ) : (
        /* Kanban 4-Column Layout with Native Drag & Drop */
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {initialColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            const isOver = dragOverColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`flex flex-col rounded-lg border p-4 transition-all duration-300 ${col.border} ${col.bg} ${
                  isOver ? "border-pastel-lavender-400 bg-pastel-lavender-100/50 shadow-soft-md scale-[1.01]" : ""
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-sm bg-current ${col.color}`} />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {col.title}
                    </h3>
                  </div>

                  {/* Soft square counter badge: rounded-md */}
                  <span className="flex h-5 items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-600 shadow-soft-sm">
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Task Cards */}
                <div className="flex flex-col gap-3 min-h-[350px]">
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      onDragStart={handleDragStart}
                    />
                  ))}

                  {colTasks.length === 0 && (
                    <div className="flex flex-1 flex-col items-center justify-center rounded-md border border-dashed border-slate-200/90 bg-white/40 p-6 text-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white border border-slate-200 text-slate-400 shadow-soft-sm mb-2">
                        <KanbanIcon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">No {col.title} tasks</span>
                      <span className="mt-0.5 text-[11px] text-slate-400">Drag items here or add new</span>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-3 flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-all duration-300 hover:scale-[1.02] hover:border-pastel-lavender-300 hover:bg-pastel-lavender-50 hover:text-pastel-lavender-500 shadow-soft-sm"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Task</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Creation Modal */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTask}
        teamMembers={teamMembers}
      />
    </div>
  );
};
