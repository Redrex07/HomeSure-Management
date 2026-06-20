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

const fmt = (n: number) => formatINR(n);

/* ---------------- REALTOR ---------------- */
export function RealtorDashboard() {
  return (
    <>
      <PageHeader
        title="Listing performance"
        description="Track properties on the market and onboarding pipeline."
        actions={
          <Link to="/app/properties">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> New listing
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active listings"
          value={String(listings.filter((l) => l.status === "Active").length)}
          icon={Building2}
          delta={2}
        />
        <StatCard label="Total views (30d)" value="4,218" icon={Eye} tone="info" delta={26} />
        <StatCard label="Leads generated" value="44" icon={TrendingUp} tone="success" delta={12} />
        <StatCard
          label="Onboarding tenants"
          value={String(tenants.filter((t) => t.status === "Onboarding").length)}
          icon={Users}
          tone="warning"
        />
      </div>

      <Card className="border-border/70 shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Listings</CardTitle>
          <Link to="/app/properties">
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="px-0">
          <div className="divide-y divide-border">
            {listings.map((l) => (
              <div
                key={l.id}
                className="grid grid-cols-2 items-center gap-3 px-6 py-3 sm:grid-cols-6"
              >
                <div className="sm:col-span-2">
                  <div className="text-sm font-medium">{l.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {l.id} · {fmt(l.price)}/mo
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Views</div>
                  <div className="text-sm font-semibold">{l.views.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Leads</div>
                  <div className="text-sm font-semibold">{l.leads}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Days listed</div>
                  <div className="text-sm font-semibold">{l.days}</div>
                </div>
                <div className="text-right">
                  <StatusBadge value={l.status} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Property readiness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Harbor View Loft 12", v: 92 },
              { name: "Cedar Heights #11", v: 78 },
              { name: "Ridgeline Studio", v: 35 },
              { name: "Riverside 2BR", v: 60 },
            ].map((p) => (
              <div key={p.name}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground">{p.v}%</span>
                </div>
                <Progress value={p.v} className="mt-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Tenant onboarding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tenants.slice(-3).map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-md border border-border/60 p-2.5"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary-soft text-xs text-primary">
                    {t.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.email}</div>
                </div>
                <StatusBadge value={t.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
