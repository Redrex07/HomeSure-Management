import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Progress } from "@/shared/components/ui/progress";
import { StatCard } from "@/shared/components/common/StatCard";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { PageHeader } from "@/shared/components/common/PageHeader";
import {
  ChartCard,
  RevenueArea,
  RequestsBar,
  CategoryPie,
} from "@/shared/components/charts/Charts";
import {
  Users,
  Building2,
  CreditCard,
  DollarSign,
  Wrench,
  ClipboardCheck,
  HardHat,
  Clock,
  LifeBuoy,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Receipt,
  Eye,
  Plus,
  TrendingUp,
  FileSpreadsheet,
  Sparkles,
  Home,
} from "lucide-react";
import {
  properties,
  tenants,
  serviceRequests,
  contractors,
  appointments,
  estimates,
  invoices,
  tickets,
  users,
  subscriptions,
  auditLogs,
  revenueSeries,
  requestsSeries,
  categoryBreakdown,
  listings,
  leaseDocs,
} from "@/shared/utils/mock-data";
import { Link } from "@tanstack/react-router";
import { useSession } from "@/features/auth/store/auth-store";

const fmt = (n: number) => `$${n.toLocaleString()}`;

/* ---------------- CONTRACTOR ---------------- */
export function ContractorDashboard() {
  const assigned = serviceRequests.filter(
    (r) => r.contractor === "BlueLine Plumbing" || r.status === "Assigned",
  );
  const totalInv = invoices.reduce((s, i) => s + i.amount, 0);
  return (
    <>
      <PageHeader
        title="Today's workspace"
        description="Jobs, schedule and invoices for BlueLine Plumbing."
        actions={
          <Button size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Submit estimate
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assigned jobs" value={String(assigned.length)} icon={Wrench} tone="info" />
        <StatCard label="Upcoming visits" value={String(appointments.length)} icon={Calendar} />
        <StatCard
          label="Estimates pending"
          value={String(estimates.filter((e) => e.status === "Pending").length)}
          icon={FileSpreadsheet}
          tone="warning"
        />
        <StatCard
          label="Invoiced (mo)"
          value={fmt(totalInv)}
          icon={Receipt}
          tone="success"
          delta={9}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70 shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Active jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {assigned.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{r.id}</span>
                    <StatusBadge value={r.priority} />
                  </div>
                  <div className="mt-0.5 truncate text-sm font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.property} · ETA {r.eta}
                  </div>
                </div>
                <StatusBadge value={r.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Upcoming appointments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {appointments.map((a) => (
              <div key={a.id} className="rounded-md border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{a.title}</div>
                  <span className="text-xs text-muted-foreground">{a.time}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {a.date} · {a.property}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
