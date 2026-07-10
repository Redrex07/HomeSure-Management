import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { StatCard } from "@/shared/components/common/StatCard";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { PageHeader } from "@/shared/components/common/PageHeader";
import {
  ChartCard,
  RequestsBar,
} from "@/shared/components/charts/Charts";
import {
  Wrench,
  HardHat,
  Clock,
  CheckCircle2,
  Calendar,
  Plus,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getServiceAdminDashboard } from "@/core/db/supabase-queries";

/* ---------------- SERVICE ADMIN ---------------- */
export function ServiceAdminDashboard() {
  const { data: dashboardData, isLoading, isError, error } = useQuery({
    queryKey: ["service-admin-dashboard"],
    queryFn: getServiceAdminDashboard,
  });

  console.log("🔍 Rendering ServiceAdminDashboard (features) - Data:", dashboardData);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center border border-border/60 rounded-md bg-background/50">
        <p className="text-sm text-muted-foreground animate-pulse">Loading operations dashboard...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center border border-destructive/30 rounded-md bg-destructive-soft p-6 text-center">
        <p className="text-sm font-semibold text-destructive mb-2">Failed to load operations dashboard</p>
        <p className="text-xs text-muted-foreground max-w-md">
          {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    );
  }

  const {
    stats = { total: 0, pending: 0, assigned: 0, completed: 0 },
    requestsSeries = [],
    contractors = [],
    activeRequests = [],
    appointments = [],
  } = dashboardData || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service operations"
        description="Triage requests, manage contractors and track delivery."
        actions={
          <Link to="/app/service-requests">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> New request
            </Button>
          </Link>
        }
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total requests"
          value={String(stats.total)}
          icon={Wrench}
        />
        <StatCard label="Pending" value={String(stats.pending)} icon={Clock} tone="warning" />
        <StatCard
          label="Assigned / in-progress"
          value={String(stats.assigned)}
          icon={HardHat}
          tone="info"
        />
        <StatCard
          label="Completed (mo)"
          value={String(stats.completed)}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Requests · last 7 days" className="lg:col-span-2">
          <RequestsBar data={requestsSeries} />
        </ChartCard>
        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Top contractors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contractors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <HardHat className="h-8 w-8 stroke-1 text-muted-foreground/50 mb-2" />
                <p className="text-xs font-semibold text-slate-800">No contractors registered</p>
                <p className="text-[10px] text-muted-foreground">Invite technicians in the Contractors tab.</p>
              </div>
            ) : (
              contractors.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary-soft text-xs text-primary">
                      {c.name
                        .split(" ")
                        .map((w: string) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.trade} · ★ {c.rating}
                    </div>
                  </div>
                  <span
                    className={`h-2 w-2 rounded-full ${c.available ? "bg-success" : "bg-muted-foreground/40"}`}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/70 shadow-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Active service requests</CardTitle>
            <Link to="/app/service-requests">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <Wrench className="h-8 w-8 stroke-1 text-muted-foreground/50 mb-2" />
                <p className="text-xs font-semibold text-slate-800">No active requests</p>
                <p className="text-[10px] text-muted-foreground">All logged maintenance tasks have been resolved.</p>
              </div>
            ) : (
              activeRequests.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2.5 hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{r.id}</span>
                      <StatusBadge value={r.priority} />
                    </div>
                    <div className="mt-0.5 truncate text-sm font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.property} · {r.contractor ?? "Unassigned"}
                    </div>
                  </div>
                  <StatusBadge value={r.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Today's appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            {appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <Calendar className="h-8 w-8 stroke-1 text-muted-foreground/50 mb-2" />
                <p className="text-xs font-semibold text-slate-800">No visits scheduled today</p>
                <p className="text-[10px] text-muted-foreground">Operations are currently clear.</p>
              </div>
            ) : (
              appointments.map((a) => (
                <div key={a.id} className="rounded-md border border-border/60 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{a.title}</div>
                    <StatusBadge value={a.status} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {a.date} · {a.time} · {a.property}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

