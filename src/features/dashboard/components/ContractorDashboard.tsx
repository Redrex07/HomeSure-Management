import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { StatCard } from "@/shared/components/common/StatCard";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { ChartCard } from "@/shared/components/charts/Charts";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Wrench,
  Calendar,
  Receipt,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import {
  serviceRequests,
  appointments,
  estimates,
  invoices,
  contractors,
  revenueSeries,
} from "@/shared/utils/mock-data";
import { Link } from "@tanstack/react-router";

const fmtUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const fmt = (n: number) => fmtUsd.format(n);

const chartTooltipStyle = {
  contentStyle: {
    background: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    fontSize: "12px",
    boxShadow: "var(--shadow-elegant)",
  },
  labelStyle: { color: "var(--color-muted-foreground)", fontSize: "11px" },
};

function ContractorEarningsArea({
  data,
}: {
  data: { month: string; revenue: number; expenses: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="contractor-rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="contractor-exp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-info)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--color-info)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="month"
          stroke="var(--color-muted-foreground)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="var(--color-muted-foreground)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip {...chartTooltipStyle} formatter={(v: number) => fmt(v)} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-primary)"
          strokeWidth={2}
          fill="url(#contractor-rev)"
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stroke="var(--color-info)"
          strokeWidth={2}
          fill="url(#contractor-exp)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const CONTRACTOR = "BlueLine Plumbing";

const earningsSeries = revenueSeries.map(({ month, revenue }) => ({
  month,
  revenue: Math.round(revenue * 0.085),
  expenses: Math.round(revenue * 0.028),
}));

/* ---------------- CONTRACTOR ---------------- */
export function ContractorDashboard() {
  const contractor = contractors.find((c) => c.name === CONTRACTOR);
  const contractorJobs = serviceRequests.filter((r) => r.contractor === CONTRACTOR);
  const assigned = contractorJobs.filter((r) => r.status !== "Completed");
  const completedJobs = contractorJobs.filter((r) => r.status === "Completed").length;
  const pendingJobs = assigned.length;
  const totalAssignedJobs = contractorJobs.length;
  const completionRate =
    totalAssignedJobs > 0 ? Math.round((completedJobs / totalAssignedJobs) * 100) : 0;

  const averageRating = contractor?.rating ?? 0;
  const performanceScore = Math.min(
    100,
    Math.max(0, completedJobs * 5 + averageRating * 10 - pendingJobs),
  );

  const contractorAppointments = appointments.filter((a) => a.contractor === CONTRACTOR);
  const contractorRequestIds = new Set(contractorJobs.map((j) => j.id));
  const recentInvoices = invoices.filter((i) => contractorRequestIds.has(i.request));
  const totalInv = recentInvoices.reduce((s, i) => s + i.amount, 0);
  const monthlyEarnings = recentInvoices
    .filter((i) => i.status === "Paid")
    .reduce((s, i) => s + i.amount, 0);

  return (
    <>
      <PageHeader
        title="Today's workspace"
        description={`Jobs, schedule and invoices for ${CONTRACTOR}.`}
        actions={
          <Button size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Submit estimate
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assigned jobs" value={String(assigned.length)} icon={Wrench} tone="info" />
        <StatCard
          label="Upcoming visits"
          value={String(contractorAppointments.length)}
          icon={Calendar}
        />
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
        <StatCard
          label="Performance Score"
          value={`${performanceScore}/100`}
          icon={TrendingUp}
          tone="success"
          hint={`Rating ${averageRating.toFixed(1)}`}
        />
        <StatCard
          label="Completion Rate"
          value={`${completionRate}%`}
          icon={CheckCircle2}
          tone="success"
          hint={`${completedJobs} of ${totalAssignedJobs} jobs`}
        />
        <StatCard
          label="Monthly Earnings"
          value={fmt(monthlyEarnings)}
          icon={DollarSign}
          tone="success"
          hint="Paid invoices"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Monthly earnings" className="lg:col-span-2">
          <ContractorEarningsArea data={earningsSeries} />
        </ChartCard>

        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Job completion rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-bold">{completionRate}%</div>
              <div className="text-sm text-muted-foreground">
                {completedJobs} of {totalAssignedJobs} jobs
              </div>
            </div>
            <Progress value={completionRate} className="mt-4" />
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active jobs</span>
                <span className="font-semibold">{assigned.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed this month</span>
                <span className="font-semibold">{completedJobs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">On-time rate</span>
                <span className="font-semibold">94%</span>
              </div>
            </div>
          </CardContent>
        </Card>
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Quick stats</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid invoices</span>
              <span className="font-semibold">
                {fmt(recentInvoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amount, 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending payment</span>
              <span className="font-semibold">
                {fmt(recentInvoices.filter((i) => i.status !== "Paid").reduce((s, i) => s + i.amount, 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next visit</span>
              <span className="font-semibold">
                {contractorAppointments[0]?.date ?? "—"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Upcoming appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Visit
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Date
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Property
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contractorAppointments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      No upcoming appointments.
                    </TableCell>
                  </TableRow>
                )}
                {contractorAppointments.map((a) => (
                  <TableRow key={a.id} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="text-sm font-medium">{a.title}</div>
                      <div className="text-xs text-muted-foreground">{a.time}</div>
                    </TableCell>
                    <TableCell className="text-sm">{a.date}</TableCell>
                    <TableCell className="max-w-[140px] truncate text-sm text-muted-foreground">
                      {a.property}
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={a.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Recent invoices</CardTitle>
            <Link to="/app/invoices">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Invoice
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Issued
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Amount
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      No invoices yet.
                    </TableCell>
                  </TableRow>
                )}
                {recentInvoices.map((i) => (
                  <TableRow key={i.id} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="font-mono text-xs">{i.id}</div>
                      <div className="text-xs text-muted-foreground">{i.request}</div>
                    </TableCell>
                    <TableCell className="text-sm">{i.issued}</TableCell>
                    <TableCell className="text-sm font-medium">{fmt(i.amount)}</TableCell>
                    <TableCell>
                      <StatusBadge value={i.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
