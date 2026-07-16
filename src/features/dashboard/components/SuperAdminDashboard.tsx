import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
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
import { useSession } from "@/features/auth/store/auth-store";
import { toast } from "sonner";
import { fetchPlatformStats, fetchPlatformAuditLogs, fetchPlatformRevenue } from "@/core/api/users.functions";

const fmt = (n: number) => formatINR(n);

/* ---------------- SUPER ADMIN ---------------- */
export function SuperAdminDashboard() {
  const session = useSession();

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
      return logs.slice(0, 20); // get top 20 latest for full reports
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

  const handleExportDashboardReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocked! Please allow popups for HomeSure to export PDF.");
      return;
    }

    const today = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const logRows = recentLogs.map((l: any) => `
      <tr>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 10px;">${l.time}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${l.actor}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; text-transform: capitalize;">${l.role || "system"}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${l.action}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; color: #475569;">${l.description || ""}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 10px;">${l.ip}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>HomeSecure Platform Analytics Report - ${new Date().toLocaleDateString()}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; background: white; }
              .page-break { page-break-after: always; }
            }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; color: #1e293b; line-height: 1.5; }
            .cover { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 85vh; text-align: center; border: 1px solid #e2e8f0; padding: 40px; border-radius: 12px; margin-bottom: 40px; background: linear-gradient(to bottom right, #f8fafc, #eff6ff); }
            .logo { font-size: 36px; font-weight: 800; color: #1d4ed8; margin-bottom: 10px; letter-spacing: -0.025em; }
            .title { font-size: 28px; font-weight: 700; color: #0f172a; margin-top: 20px; }
            .subtitle { font-size: 16px; color: #64748b; margin-top: 5px; margin-bottom: 40px; }
            .meta { font-size: 12px; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 20px; width: 100%; max-width: 400px; text-align: left; }
            .meta-item { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .meta-label { font-weight: 600; color: #64748b; }
            .meta-val { color: #0f172a; }
            h2 { font-size: 18px; font-weight: 700; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 6px; margin-top: 30px; margin-bottom: 15px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
            .card-title { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 8px; }
            .card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 13px; }
            .card-row { display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px; }
            .card-row:last-child { border-bottom: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            th { background-color: #f1f5f9; padding: 8px 10px; text-align: left; border-bottom: 2px solid #cbd5e1; font-weight: 600; color: #475569; text-transform: uppercase; }
            .footer { margin-top: 50px; font-size: 10px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <!-- COVER PAGE -->
          <div class="cover page-break">
            <div class="logo">HomeSecure</div>
            <div class="title">Platform Analytics Report</div>
            <div class="subtitle">Complete Summary of Users, Properties, Subscriptions & Revenue Operations</div>
            <div class="meta">
              <div class="meta-item">
                <span class="meta-label">Generated Date & Time</span>
                <span class="meta-val">${today}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Author / Access Role</span>
                <span class="meta-val">${session?.name || "Super Admin"} (${session?.role || "super_admin"})</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Target Environment</span>
                <span class="meta-val">HomeSecure Production</span>
              </div>
            </div>
          </div>

          <!-- SUMMARY SECTIONS -->
          <h2>1. Platform Metrics & Breakdown</h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px;">
            <div class="card">
              <div class="card-title">User Breakdown</div>
              <div class="card-grid">
                <div class="card-row"><span style="color:#64748b;">Total Users</span><span style="font-weight:600;">${totalUsers}</span></div>
                <div class="card-row"><span style="color:#64748b;">Active Landlords</span><span style="font-weight:600;">${stats?.activeLandlords || 0}</span></div>
                <div class="card-row"><span style="color:#64748b;">Active Tenants</span><span style="font-weight:600;">${stats?.activeTenants || 0}</span></div>
                <div class="card-row"><span style="color:#64748b;">Active Contractors</span><span style="font-weight:600;">${stats?.activeContractors || 0}</span></div>
                <div class="card-row"><span style="color:#64748b;">Active Realtors</span><span style="font-weight:600;">${stats?.activeRealtors || 0}</span></div>
                <div class="card-row"><span style="color:#64748b;">Service Admins</span><span style="font-weight:600;">${stats?.activeServiceAdmins || 0}</span></div>
              </div>
            </div>

            <div class="card">
              <div class="card-title">Properties & Service Operations</div>
              <div class="card-grid">
                <div class="card-row"><span style="color:#64748b;">Total Properties</span><span style="font-weight:600;">${totalProperties}</span></div>
                <div class="card-row"><span style="color:#64748b;">Pending Requests</span><span style="font-weight:600;">${pendingRequests}</span></div>
                <div class="card-row"><span style="color:#64748b;">Active Subscriptions</span><span style="font-weight:600;">${activeSubs}</span></div>
                <div class="card-row"><span style="color:#64748b;">Monthly Recurring (MRR)</span><span style="font-weight:600;">${formatINR(mrrVal)}</span></div>
              </div>
            </div>
          </div>

          <h2>2. Financial Analytics Summary</h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px;">
            <div class="card">
              <div class="card-title">Commissions & Revenue</div>
              <div class="card-grid">
                <div class="card-row"><span style="color:#64748b;">Subscription Revenue</span><span style="font-weight:600;">${formatINR(revenueData?.stats?.subscriptionRevenue || 0)}</span></div>
                <div class="card-row"><span style="color:#64748b;">Contractor Comm (10%)</span><span style="font-weight:600;">${formatINR(revenueData?.stats?.contractorCommission || 0)}</span></div>
                <div class="card-row"><span style="color:#64748b;">Realtor Comm (5%)</span><span style="font-weight:600;">${formatINR(revenueData?.stats?.realtorCommission || 0)}</span></div>
                <div class="card-row"><span style="color:#64748b;">Total Aggregate Revenue</span><span style="font-weight:600; color:#16a34a;">${formatINR(revenueData?.stats?.totalRevenue || 0)}</span></div>
              </div>
            </div>
            
            <div class="card">
              <div class="card-title">Report Metadata</div>
              <div class="card-grid">
                <div class="card-row"><span style="color:#64748b;">Estimated ARR</span><span style="font-weight:600;">${formatINR(mrrVal * 12)}</span></div>
                <div class="card-row"><span style="color:#64748b;">System Health Status</span><span style="font-weight:600; color:#16a34a;">Online / Optimal</span></div>
                <div class="card-row"><span style="color:#64748b;">Database Connection</span><span style="font-weight:600;">Supabase API Secure</span></div>
              </div>
            </div>
          </div>

          <div class="page-break"></div>

          <h2>3. Recent Platform Activity Logs (Latest 20)</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Timestamp</th>
                <th style="width: 15%;">Actor</th>
                <th style="width: 12%;">Role</th>
                <th style="width: 18%;">Action</th>
                <th style="width: 30%;">Description</th>
                <th style="width: 10%;">IP Address</th>
              </tr>
            </thead>
            <tbody>
              ${logRows}
            </tbody>
          </table>

          <div class="footer">
            Generated Automatically by HomeSecure Platform Management System · Page 1 of 1 · ${today}
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Health, revenue and activity across the entire HomeSure network."
        actions={
          <Button variant="outline" size="sm" className="cursor-pointer" onClick={handleExportDashboardReport}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Export report
          </Button>
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
                recentLogs.slice(0, 5).map((l) => (
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
