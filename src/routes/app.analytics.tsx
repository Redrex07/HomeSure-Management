import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatCard } from "@/shared/components/common/StatCard";
import {
  ChartCard,
  RevenueArea,
  RequestsBar,
  CategoryPie,
} from "@/shared/components/charts/Charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { revenueSeries, requestsSeries, categoryBreakdown } from "@/shared/utils/mock-data";
import { DollarSign, Building2, Users, Wrench } from "lucide-react";
import { formatINR } from "@/shared/utils/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchPlatformStats } from "@/core/api/users.functions";
import { getInvoices, getServiceRequests, getAllProperties } from "@/core/db/supabase-queries";
import { useMemo } from "react";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — HomeSure" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: () => fetchPlatformStats(),
    refetchOnWindowFocus: false,
  });

  const { data: invoices = [], isLoading: isInvoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: getInvoices,
  });

  const { data: requests = [], isLoading: isRequestsLoading } = useQuery({
    queryKey: ["requests"],
    queryFn: () => getServiceRequests(),
  });

  const { data: properties = [], isLoading: isPropertiesLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: getAllProperties,
  });

  const isLoading = isStatsLoading || isInvoicesLoading || isRequestsLoading || isPropertiesLoading;

  const totalProperties = stats?.totalProperties ?? 0;
  const activeLandlords = stats?.activeLandlords ?? 0;
  const activeTenants = stats?.activeTenants ?? 0;
  const activeContractors = stats?.activeContractors ?? 0;
  const totalUsers = stats?.totalUsers ?? 0;
  const pendingRequests = stats?.pendingRequests ?? 0;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const dynamicRevenueSeries = useMemo(() => {
    const grouped: Record<string, number> = {};
    invoices.forEach(inv => {
      if (inv.status === "Paid" || inv.status === "Successful") {
        const d = new Date(inv.issued || new Date());
        const month = months[d.getMonth()];
        grouped[month] = (grouped[month] || 0) + (inv.amount || 0);
      }
    });
    return months.map(m => ({ month: m, revenue: grouped[m] || 0, expenses: 0 })).filter(item => item.revenue > 0 || months.indexOf(item.month) <= new Date().getMonth());
  }, [invoices]);

  const dynamicRequestsSeries = useMemo(() => {
    const grouped: Record<string, number> = {};
    requests.forEach(req => {
      const d = new Date(req.created || new Date());
      const month = months[d.getMonth()];
      grouped[month] = (grouped[month] || 0) + 1;
    });
    return months.map(m => ({ day: m, created: grouped[m] || 0, completed: 0 })).filter(item => item.created > 0 || months.indexOf(item.day) <= new Date().getMonth());
  }, [requests]);

  const dynamicCategoryBreakdown = useMemo(() => {
    const grouped: Record<string, number> = {};
    requests.forEach(req => {
      const cat = req.category || "General";
      grouped[cat] = (grouped[cat] || 0) + 1;
    });
    const result = Object.entries(grouped).map(([name, value]) => ({ name, value }));
    return result.length > 0 ? result : [{ name: "No Requests", value: 1 }];
  }, [requests]);

  const topProperties = useMemo(() => {
    const revenueByProp: Record<string, number> = {};
    invoices.forEach(inv => {
      if ((inv.status === "Paid" || inv.status === "Successful") && inv.propertyId) {
        revenueByProp[inv.propertyId] = (revenueByProp[inv.propertyId] || 0) + (inv.amount || 0);
      }
    });
    
    const propArr = Object.entries(revenueByProp).map(([propId, rev]) => {
      const prop = properties.find(p => String(p.property_id) === String(propId));
      return {
        name: prop?.property_name || `Property #${propId}`,
        v: rev,
        rawRev: rev
      };
    });

    propArr.sort((a, b) => b.rawRev - a.rawRev);
    const top5 = propArr.slice(0, 5);
    const maxRev = top5.length > 0 ? top5[0].rawRev : 1;

    return top5.map(p => ({
      name: p.name,
      v: Math.round((p.rawRev / maxRev) * 100),
      label: formatINR(p.rawRev)
    }));
  }, [invoices, properties]);

  return (
    <>
      <PageHeader title="Analytics" description="Revenue, service operations and user metrics." />
      
      {isLoading ? (
        <div className="flex h-12 items-center justify-center">
          <p className="animate-pulse text-xs text-muted-foreground">Loading statistics...</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Properties"
          value={String(totalProperties)}
          icon={Building2}
          tone="info"
        />
        <StatCard 
          label="Active Landlords" 
          value={String(activeLandlords)} 
          icon={Users} 
          tone="success" 
        />
        <StatCard 
          label="Active Tenants" 
          value={String(activeTenants)} 
          icon={Users} 
          tone="info" 
        />
        <StatCard 
          label="Pending Requests" 
          value={String(pendingRequests)} 
          icon={Wrench} 
          tone="warning" 
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Revenue trend">
          <RevenueArea data={dynamicRevenueSeries} />
        </ChartCard>
        <ChartCard title="Request volume">
          <RequestsBar data={dynamicRequestsSeries} />
        </ChartCard>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Request categories">
          <CategoryPie data={dynamicCategoryBreakdown} />
        </ChartCard>
        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Top performing properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topProperties.length > 0 ? (
              topProperties.map((p) => (
                <div key={p.name}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground">{p.label}</span>
                  </div>
                  <Progress value={p.v} className="mt-1.5" />
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground pt-4 text-center">No revenue data available to rank properties.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

