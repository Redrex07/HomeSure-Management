import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@/features/auth/store/auth-store";
import {
  SuperAdminDashboard, ServiceAdminDashboard, LandlordDashboard,
  TenantDashboard, ContractorDashboard, RealtorDashboard,
} from "@/features/dashboard/components";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — HomeSure" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const s = useSession();
  switch (s?.role) {
    case "super_admin": return <SuperAdminDashboard />;
    case "service_admin": return <ServiceAdminDashboard />;
    case "tenant": return <TenantDashboard />;
    case "contractor": return <ContractorDashboard />;
    case "realtor": return <RealtorDashboard />;
    case "landlord":
    default:
      return <LandlordDashboard />;
  }
}
