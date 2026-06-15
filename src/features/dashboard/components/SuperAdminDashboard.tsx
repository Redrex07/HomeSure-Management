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


/* ---------------- SUPER ADMIN ---------------- */
export function SuperAdminDashboard() {
  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Health, revenue and activity across the entire HomeSure network."
        actions={<Button variant="outline" size="sm"><FileSpreadsheet className="mr-2 h-4 w-4" /> Export report</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value="4,218" icon={Users} delta={12} hint="vs last month" />
        <StatCard label="Active properties" value="1,847" icon={Building2} delta={8} tone="info" hint="across 14 regions" />
        <StatCard label="Active subscriptions" value="612" icon={CreditCard} delta={5} tone="success" />
        <StatCard label="Monthly revenue" value="$71,900" icon={DollarSign} delta={18} tone="success" hint="MRR" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Revenue & expenses" className="lg:col-span-2">
          <RevenueArea data={revenueSeries} />
        </ChartCard>
        <ChartCard title="Requests by category">
          <CategoryPie data={categoryBreakdown} />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70 shadow-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Recent audit logs</CardTitle>
            <Link to="/app/audit-logs"><Button variant="ghost" size="sm">View all</Button></Link>
          </CardHeader>
          <CardContent className="px-0">
            <div className="divide-y divide-border">
              {auditLogs.map((l) => (
                <div key={l.id} className="flex items-center gap-3 px-6 py-2.5 text-sm">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <ClipboardCheck className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-foreground">{l.action}</div>
                    <div className="text-xs text-muted-foreground">{l.actor} · {l.ip}</div>
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">{l.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader><CardTitle className="text-sm font-semibold">Subscription health</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {subscriptions.slice(0, 4).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{s.customer}</div>
                  <div className="text-xs text-muted-foreground">{s.plan} · {s.seats} seats</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-sm font-semibold">{fmt(s.mrr)}</div>
                  <StatusBadge value={s.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

