import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Progress } from "@/shared/components/ui/progress";
import { StatCard } from "@/shared/components/common/StatCard";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { ChartCard, RevenueArea, RequestsBar, CategoryPie } from "@/shared/components/charts/Charts";
import {
  Users, Building2, CreditCard, DollarSign, Wrench, ClipboardCheck, HardHat, Clock,
  LifeBuoy, CheckCircle2, AlertTriangle, FileText, Calendar, Receipt, Eye, Plus,
  TrendingUp, FileSpreadsheet, Sparkles, Home,
} from "lucide-react";
import {
  properties, tenants, serviceRequests, contractors, appointments, estimates,
  invoices, tickets, users, subscriptions, auditLogs, revenueSeries, requestsSeries,
  categoryBreakdown, listings, leaseDocs,
} from "@/shared/utils/mock-data";
import { Link } from "@tanstack/react-router";
import { useSession } from "@/features/auth/store/auth-store";

const fmt = (n: number) => `$${n.toLocaleString()}`;


/* ---------------- SERVICE ADMIN ---------------- */
export function ServiceAdminDashboard() {
  const pending = serviceRequests.filter((r) => r.status === "Pending").length;
  const assigned = serviceRequests.filter((r) => r.status === "Assigned" || r.status === "In Progress").length;
  const completed = serviceRequests.filter((r) => r.status === "Completed").length;

  return (
    <>
      <PageHeader
        title="Service operations"
        description="Triage requests, manage contractors and track delivery."
        actions={<Link to="/app/service-requests"><Button size="sm"><Plus className="mr-2 h-4 w-4" /> New request</Button></Link>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total requests" value={String(serviceRequests.length * 24)} icon={Wrench} delta={6} />
        <StatCard label="Pending" value={String(pending)} icon={Clock} tone="warning" delta={-3} />
        <StatCard label="Assigned / in-progress" value={String(assigned)} icon={HardHat} tone="info" delta={9} />
        <StatCard label="Completed (mo)" value={String(completed * 18)} icon={CheckCircle2} tone="success" delta={14} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Requests · last 7 days" className="lg:col-span-2"><RequestsBar data={requestsSeries} /></ChartCard>
        <Card className="border-border/70 shadow-card">
          <CardHeader><CardTitle className="text-sm font-semibold">Top contractors</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {contractors.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary-soft text-xs text-primary">{c.name.split(" ").map(w => w[0]).slice(0,2).join("")}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.trade} · ★ {c.rating}</div>
                </div>
                <span className={`h-2 w-2 rounded-full ${c.available ? "bg-success" : "bg-muted-foreground/40"}`} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70 shadow-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Active service requests</CardTitle>
            <Link to="/app/service-requests"><Button variant="ghost" size="sm">View all</Button></Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {serviceRequests.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2.5 hover:bg-muted/40">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{r.id}</span>
                    <StatusBadge value={r.priority} />
                  </div>
                  <div className="mt-0.5 truncate text-sm font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.property} · {r.contractor ?? "Unassigned"}</div>
                </div>
                <StatusBadge value={r.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Today's appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            {appointments.map((a) => (
              <div key={a.id} className="rounded-md border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{a.title}</div>
                  <StatusBadge value={a.status} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{a.date} · {a.time} · {a.property}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

