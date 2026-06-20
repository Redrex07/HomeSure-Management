import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/shared/components/ui/sidebar";
import { AppSidebar } from "@/shared/components/app/AppSidebar";
import { AppTopbar } from "@/shared/components/app/AppTopbar";
import { useSession, setSession } from "@/features/auth/store/auth-store";
import { ROLE_LABELS } from "@/features/auth/utils/roles";
import { Clock, XCircle, LogOut } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

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

  // Intercept access for users whose registration is not fully approved
  if (session && (session.status === "Pending" || session.status === "Declined")) {
    const isPending = session.status === "Pending";
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/30 px-4 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              HomeSure<span className="text-primary">.</span>
            </span>
          </div>
          
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="flex flex-col items-center text-center">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                isPending ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
              } mb-4`}>
                {isPending ? (
                  <Clock className="h-6 w-6 animate-pulse" />
                ) : (
                  <XCircle className="h-6 w-6" />
                )}
              </div>
              
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {isPending ? "Registration Pending Approval" : "Registration Declined"}
              </h2>
              
              <p className="mt-3 text-sm text-muted-foreground">
                {isPending 
                  ? "Thank you for registering! Your account request is under review by a Super Admin. You will gain access as soon as your role is verified."
                  : "Your registration request has been declined by the Super Admin. Please contact support or sign up with different credentials if this is an error."
                }
              </p>

              <div className="mt-6 w-full space-y-2 rounded-lg bg-muted/50 p-3 text-left text-xs text-muted-foreground">
                <div><span className="font-semibold text-foreground">Registered Name:</span> {session.name}</div>
                <div><span className="font-semibold text-foreground">Work Email:</span> {session.email}</div>
                <div><span className="font-semibold text-foreground">Requested Role:</span> {ROLE_LABELS[session.role]}</div>
              </div>
              
              <Button 
                onClick={() => {
                  setSession(null);
                  nav({ to: "/login" });
                }} 
                variant="outline" 
                className="mt-6 w-full gap-2"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
