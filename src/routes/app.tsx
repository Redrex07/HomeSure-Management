import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/shared/components/ui/sidebar";
import { AppSidebar } from "@/shared/components/app/AppSidebar";
import { AppTopbar } from "@/shared/components/app/AppTopbar";
import { useSession, setSession } from "@/features/auth/store/auth-store";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const session = useSession();
  const nav = useNavigate();

  useEffect(() => {
    // Auto-create demo session if missing so the prototype is always navigable.
    if (typeof window !== "undefined" && !session) {
      setSession({ email: "demo@homesure.app", name: "Adithya", role: "landlord" });
    }
  }, [session, nav]);

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
