import { useState, useEffect, useCallback } from "react";
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
  serviceRequests,
  contractors,
  appointments,
  estimates,
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
import { useTenants } from "@/shared/utils/tenants-store";
import { useInvoices } from "@/shared/utils/invoices-store";
import { getLandlordProperties, getInvoices } from "@/core/db/supabase-queries";
import { supabase } from "@/core/db/supabase";
import { formatINR } from "@/shared/utils/utils";

const fmt = (n: number) => formatINR(n);

const parseImageUrls = (val: unknown): string[] => {
  if (!val) return [];
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [val];
    }
  }
  return [];
};

/* ---------------- LANDLORD ---------------- */
export function LandlordDashboard() {
  const session = useSession();
  const landlordId = "2"; // Same fixed landlordId for now

  const localTenants = useTenants();
  const localInvoices = useInvoices();

  const [supabaseProperties, setSupabaseProperties] = useState<any[]>([]);
  const [supabaseInvoices, setSupabaseInvoices] = useState<any[]>([]);

  const fetchProperties = useCallback(async () => {
    const fetchId = session?.id || "2";
    const data = await getLandlordProperties(fetchId);
    setSupabaseProperties(data as any[]);
  }, [session?.id]);

  const fetchInvoices = useCallback(async () => {
    const data = await getInvoices();
    setSupabaseInvoices(data as any[]);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProperties();
    fetchInvoices();
  }, [fetchProperties, fetchInvoices]);

  // Real-time subscription for properties table
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-properties-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "properties" },
        () => {
          // Re-fetch properties whenever any INSERT/UPDATE/DELETE happens
          fetchProperties();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProperties]);

  const dbProperties = supabaseProperties;
  const dbTenants = localTenants;
  const invoices = [...supabaseInvoices, ...localInvoices];

  const occupied = dbProperties.filter((p) => p.availability_status === "Occupied").length;
  const occupancy = dbProperties.length > 0 ? Math.round((occupied / dbProperties.length) * 100) : 0;
  
  const activeTenants = dbTenants.filter((t) => t.onboarding_status === "Active" || t.onboarding_status === "Completed").length;

  const collected = invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const outstanding = invoices.filter((i) => i.status !== "Paid").reduce((s, i) => s + i.amount, 0);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${session?.name || "Adithya"}`}
        description="Here's how your portfolio is performing today."
        actions={
          <Link to="/app/properties">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add property
            </Button>
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Properties" value={String(dbProperties.length)} icon={Building2} delta={4} />
        <StatCard
          label="Active tenants"
          value={String(activeTenants)}
          icon={Users}
          tone="info"
          delta={2}
        />
        <StatCard
          label="Rent collected"
          value={fmt(collected)}
          icon={DollarSign}
          tone="success"
          delta={11}
        />
        <StatCard
          label="Open requests"
          value={String(serviceRequests.filter((r) => r.status !== "Completed").length)}
          icon={Wrench}
          tone="warning"
          delta={-3}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Rent revenue trend" className="lg:col-span-2">
          <RevenueArea data={revenueSeries} />
        </ChartCard>
        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Portfolio occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-bold">{occupancy}%</div>
              <div className="text-sm text-muted-foreground">
                {occupied} of {dbProperties.length}
              </div>
            </div>
            <Progress value={occupancy} className="mt-4" />
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Outstanding rent</span>
                <span className="font-semibold">{fmt(outstanding)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg. days to fill</span>
                <span className="font-semibold">12 days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Renewals (90d)</span>
                <span className="font-semibold">3</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Recent properties</CardTitle>
            <Link to="/app/properties">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {dbProperties.slice(0, 4).map((p) => {
              const images = parseImageUrls(p.image_url);
              const firstImage = images.length > 0 ? images[0] : "https://placehold.co/100x100?text=No+Image";
              
              return (
                <Link
                  key={p.property_id}
                  to="/app/properties/$id"
                  params={{ id: String(p.property_id) }}
                  className="flex items-center gap-3 rounded-md border border-border/60 p-2.5 hover:bg-muted/40"
                >
                  <img src={firstImage} alt="" className="h-12 w-16 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{p.property_name}</div>
                    <div className="truncate text-xs text-muted-foreground">{p.address}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{fmt(p.rent_amount)}</div>
                    <StatusBadge value={p.availability_status} />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Maintenance requests</CardTitle>
            <Link to="/app/service-requests">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {serviceRequests.slice(0, 4).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.property} · {r.category}
                  </div>
                </div>
                <StatusBadge value={r.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
