import { CMSTable } from "@/components/cms/CMSTable";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const metadata = {
  title: "Website CMS | NexusForge Agency",
  description: "Manage portfolio items, blog publications, and copywriting for nexusforgeagency.in",
};

export default function CMSPage() {
  return (
    <RoleGuard allowedRoles={["admin"]} moduleName="Website CMS (Admin / CTO Only)">
      <CMSTable />
    </RoleGuard>
  );
}
