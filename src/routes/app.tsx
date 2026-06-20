import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AppTopbar } from "@/components/app/AppTopbar";
import { useSession, setSession } from "@/lib/auth-store";
import { ROLE_LABELS } from "@/lib/roles";
import { Clock, XCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const session = useSession();
  const nav = useNavigate();

  useEffect(() => {
    // Auto-create demo session if missing so the prototype is always navigable.
    if (typeof window !== "undefined" && !session) {
      setSession({ email: "demo@homesure.app", name: "Alex Morgan", role: "landlord" });
    }
  }, [session, nav]);

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
