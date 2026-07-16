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
  CategoryPie,
} from "@/shared/components/charts/Charts";
import {
  Users,
  Building2,
  CreditCard,
  DollarSign,
  ClipboardCheck,
  FileSpreadsheet,
} from "lucide-react";
import {
  revenueSeries,
  categoryBreakdown,
} from "@/shared/utils/mock-data";
import { Link } from "@tanstack/react-router";
import { formatINR } from "@/shared/utils/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchPlatformStats, fetchPlatformAuditLogs, fetchPlatformRevenue } from "@/core/api/users.functions";

const fmt = (n: number) => formatINR(n);

/* ---------------- SUPER ADMIN ---------------- */
export function SuperAdminDashboard() {
  // Query live platform stats
  const { data: stats } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: () => fetchPlatformStats(),
    refetchOnWindowFocus: false,
  });

  // Query live recent audit logs
  const { data: recentLogs = [] } = useQuery({
    queryKey: ["platform-recent-logs"],
    queryFn: async () => {
      const logs = await fetchPlatformAuditLogs();
      return logs.slice(0, 5); // get top 5 latest
    },
    refetchOnWindowFocus: false,
  });

  // Query live MRR and subscriptions
  const { data: revenueData } = useQuery({
    queryKey: ["platform-revenue"],
    queryFn: () => fetchPlatformRevenue(),
    refetchOnWindowFocus: false,
  });

  const totalUsers = stats?.totalUsers ?? 4218;
  const totalProperties = stats?.totalProperties ?? 1847;
  const pendingRequests = stats?.pendingRequests ?? 0;
  
  // Calculate subscription count and MRR
  const activeSubs = revenueData?.items?.filter(x => x.type === "Subscription" && x.status === "Active")?.length ?? 612;
  const mrrVal = revenueData?.stats?.subscriptionRevenue ?? 71900;

  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Health, revenue and activity across the entire HomeSure network."
        actions={
          <Link to="/app/analytics">
            <Button variant="outline" size="sm" className="cursor-pointer">
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Export report
            </Button>
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={String(totalUsers)} icon={Users} delta={12} hint="live platform count" />
        <StatCard
          label="Active Properties"
          value={String(totalProperties)}
          icon={Building2}
          delta={8}
          tone="info"
          hint="across all regions"
        />
        <StatCard
          label="Active Subscriptions"
          value={String(activeSubs)}
          icon={CreditCard}
          delta={5}
          tone="success"
          hint="subscribers list"
        />
        <StatCard
          label="Monthly Revenue (MRR)"
          value={formatINR(mrrVal)}
          icon={DollarSign}
          delta={18}
          tone="success"
          hint="from subscriptions"
        />
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
        {/* Live Recent Audit Logs */}
        <Card className="border-border/70 shadow-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-800">Recent audit logs</CardTitle>
            <Link to="/app/audit-logs">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-0">
            <div className="divide-y divide-border">
              {recentLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">No recent actions recorded.</div>
              ) : (
                recentLogs.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 px-6 py-2.5 text-sm hover:bg-slate-50/50 transition-all">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      <ClipboardCheck className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-slate-800">{l.action}</div>
                      <div className="text-xs text-slate-500 truncate">
                        {l.actor} · {l.ip}
                      </div>
                    </div>
                    <div className="shrink-0 text-[10px] font-mono text-slate-400">{l.time.split(",")[1] || l.time}</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Subscribers Status */}
        <Card className="border-border/70 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-800">Subscription Health</CardTitle>
            <Link to="/app/subscriptions">
              <Button variant="ghost" size="sm">
                Manage
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {revenueData?.items?.filter(x => x.type === "Subscription").slice(0, 4).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 border-b pb-2 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-800">{s.source}</div>
                  <div className="text-xs text-slate-500">
                    {s.id.split("-").pop()} · {s.date}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-sm font-bold text-slate-800">{fmt(s.commission)}</div>
                  <StatusBadge value={s.status} />
                </div>
              </div>
            )) || (
              <div className="text-center text-xs text-muted-foreground p-6">No subscribers list.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
