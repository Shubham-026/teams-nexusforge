import { UserDashboard } from "@/components/dashboard/UserDashboard";

export const metadata = {
  title: "Dashboard Overview | NexusForge Agency",
  description: "Personalized agency dashboard: task deliverables, sales outreach, conversion ratios, and pipeline stages.",
};

export default function DashboardPage() {
  return <UserDashboard />;
}

