import { TeamManagement } from "@/components/team/TeamManagement";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const metadata = {
  title: "Team & Role Access | NexusForge Agency",
  description: "Admin user provisioning and Role-Based Access Control (RBAC).",
};

export default function TeamPage() {
  return (
    <RoleGuard allowedRoles={["admin"]} moduleName="Team Management (Admin / CTO Only)">
      <TeamManagement />
    </RoleGuard>
  );
}

