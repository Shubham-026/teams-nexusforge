import { CRMBoard } from "@/components/crm/CRMBoard";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const metadata = {
  title: "Sales CRM & Leads | NexusForge Agency",
  description: "Client acquisition tracking and outreach pipeline for NexusForge.",
};

export default function CRMPage() {
  return (
    <RoleGuard
      allowedRoles={["admin", "ceo", "sales_manager", "lead_manager"]}
      moduleName="Sales CRM & Lead Pipeline"
    >
      <CRMBoard />
    </RoleGuard>
  );
}

