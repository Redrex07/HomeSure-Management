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
import { formatINR } from "@/shared/utils/utils";
import { useQuery } from "@tanstack/react-query";
import {
  getTenantAppointments,
  getTenantInvoices,
  getTenantServiceRequests,
} from "@/core/db/supabase-queries";
import { useTenantContext } from "@/features/tenant/hooks/useTenantContext";

const fmt = (n: number) => formatINR(n);

/* ---------------- TENANT ---------------- */
export function TenantDashboard() {
  const session = useSession();
  const tenantContext = useTenantContext();
  const tenantName = session?.name?.split(" ")[0] || "Sarah";
  const { data: dbRequests = [] } = useQuery({
    queryKey: ["service-requests", tenantContext.tenantId, tenantContext.serviceTenantId],
    queryFn: () => getTenantServiceRequests(tenantContext.tenantId!, tenantContext.serviceTenantId),
    enabled: !!tenantContext.tenantId && !!tenantContext.serviceTenantId,
  });
  const { data: dbAppointments = [] } = useQuery({
    queryKey: ["appointments", tenantContext.tenantId, tenantContext.serviceTenantId],
    queryFn: () => getTenantAppointments(tenantContext.tenantId!, tenantContext.serviceTenantId),
    enabled: !!tenantContext.tenantId && !!tenantContext.serviceTenantId,
  });
  const { data: dbInvoices = [] } = useQuery({
    queryKey: ["invoices", tenantContext.tenantId],
    queryFn: () => getTenantInvoices(tenantContext.tenantId!, tenantContext.serviceTenantId),
    enabled: !!tenantContext.tenantId,
  });

  const visibleRequests = dbRequests.length > 0 ? dbRequests : serviceRequests;
  const visibleAppointments = dbAppointments.length > 0 ? dbAppointments : appointments;
  const visibleInvoices = dbInvoices.length > 0 ? dbInvoices : invoices;
  const myUnit = properties[0];
  const next = visibleInvoices.find((i) => i.status === "Pending") ?? visibleInvoices[0];
  const openRequests = visibleRequests.filter((r) => r.status !== "Completed");
  const upcomingAppointments = visibleAppointments.filter((a) => {
    if (!a.date) return true;
    return new Date(`${a.date}T23:59:59`) >= new Date();
  });
  return (
    <>
      <PageHeader
        title={`Hello, ${tenantName}`}
        description="Your home, payments and requests in one place."
        actions={
          <Link to="/app/service-requests">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> New request
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70 shadow-card lg:col-span-2">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <img
              src={myUnit.image}
              alt=""
              className="h-32 w-full rounded-lg object-cover sm:w-48"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Home className="h-3.5 w-3.5" /> Your residence
              </div>
              <h3 className="mt-1 text-lg font-semibold">{myUnit.name}</h3>
              <p className="text-sm text-muted-foreground">{myUnit.address}</p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Monthly rent</div>
                  <div className="font-semibold">{fmt(myUnit.rent)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Lease ends</div>
                  <div className="font-semibold">Feb 28, 2026</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Landlord</div>
                  <div className="font-semibold">{myUnit.landlord}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary-soft shadow-card">
          <CardContent className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">
              Next rent
            </div>
            <div className="mt-2 text-3xl font-bold text-foreground">
              {fmt(next?.amount ?? myUnit.rent)}
            </div>
            <div className="text-sm text-muted-foreground">Due {next?.due ?? "This month"}</div>
            <Button asChild className="mt-4 w-full">
              <Link to="/app/invoices">Pay rent</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/app/service-requests" className="block">
          <StatCard
            label="Open requests"
            value={String(openRequests.length)}
            icon={Wrench}
            tone="info"
          />
        </Link>
        <Link to="/app/appointments" className="block">
          <StatCard
            label="Upcoming appointments"
            value={String(upcomingAppointments.length)}
            icon={Calendar}
          />
        </Link>
        <Link to="/app/leases" className="block">
          <StatCard
            label="Documents on file"
            value={String(leaseDocs.length)}
            icon={FileText}
            tone="success"
          />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">My maintenance requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {visibleRequests.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.category} · {r.contractor ?? "Awaiting assignment"}
                  </div>
                </div>
                <StatusBadge value={r.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Lease documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaseDocs.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-md border border-border/60 p-2.5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-soft text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.size} · Updated {d.updated}
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/app/leases">View</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
