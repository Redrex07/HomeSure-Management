import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/shared/components/ui/sidebar";
import { AppSidebar } from "@/shared/components/app/AppSidebar";
import { AppTopbar } from "@/shared/components/app/AppTopbar";
import { useSession } from "@/features/auth/store/auth-store";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

const ALLOWED_ROUTES: Record<string, string[]> = {
  super_admin: [
    "/app/dashboard",
    "/app/users",
    "/app/subscriptions",
    "/app/properties",
    "/app/analytics",
    "/app/audit-logs",
    "/app/service-requests",
    "/app/support",
    "/app/settings"
  ],
  service_admin: [
    "/app/dashboard",
    "/app/service-requests",
    "/app/contractors",
    "/app/realtors",
    "/app/appointments",
    "/app/estimates",
    "/app/invoices",
    "/app/support",
    "/app/settings"
  ],
  landlord: [
    "/app/dashboard",
    "/app/properties",
    "/app/tenants",
    "/app/leases",
    "/app/invoices",
    "/app/service-requests",
    "/app/analytics",
    "/app/subscriptions",
    "/app/settings"
  ],
  tenant: [
    "/app/dashboard",
    "/app/properties",
    "/app/invoices",
    "/app/service-requests",
    "/app/appointments",
    "/app/leases",
    "/app/notifications",
    "/app/settings"
  ],
  contractor: [
    "/app/dashboard",
    "/app/service-requests",
    "/app/appointments",
    "/app/estimates",
    "/app/invoices",
    "/app/settings"
  ],
  realtor: [
    "/app/dashboard",
    "/app/properties",
    "/app/analytics",
    "/app/tenants",
    "/app/settings"
  ],
};

function isRouteAllowed(role: string, pathname: string): boolean {
  if (pathname === "/app/dashboard" || pathname === "/app/settings") {
    return true;
  }
  const allowedList = ALLOWED_ROUTES[role] || [];
  return allowedList.some((allowedPath) => {
    if (allowedPath === "/app/dashboard" || allowedPath === "/app/settings") return false;
    return pathname === allowedPath || pathname.startsWith(allowedPath + "/");
  });
}

function AppLayout() {
  const session = useSession();
  const nav = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!session) {
        nav({ to: "/login" });
      } else if (path === "/app") {
        nav({ to: "/app/dashboard" });
      } else if (path !== "/app/dashboard" && !isRouteAllowed(session.role, path)) {
        nav({ to: "/app/dashboard" });
      }
    }
  }, [session, path, nav]);

  if (!session) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <AppTopbar />
          <main className="flex-1 p-4 sm:p-6">
            <div className="mx-auto w-full max-w-7xl space-y-6">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
