import { KanbanBoard } from "@/components/tasks/KanbanBoard";

export const metadata = {
  title: "Task Board | NexusForge Agency",
  description: "Internal Kanban task board for NexusForge digital agency teams.",
};

export default function TasksPage() {
  return <KanbanBoard />;
}

