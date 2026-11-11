import { TeamManagement } from "@/components/team/TeamManagement";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const metadata = {
  title: "Team & Role Access | NexusForge Agency",
  description: "Executive & Admin user provisioning and Role-Based Access Control (RBAC).",
};

export default function TeamPage() {
  return (
    <RoleGuard
      allowedRoles={["admin", "ceo"]}
      moduleName="Team & Role Governance (CEO / CTO Only)"
    >
      <TeamManagement />
    </RoleGuard>
  );
}
