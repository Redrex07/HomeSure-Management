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

export const Route = createFileRoute("/app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — HomeSure" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <>
      <PageHeader title="Analytics" description="Revenue, service operations and user metrics." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue (mo)"
          value={formatINR(71900)}
          icon={DollarSign}
          tone="success"
          delta={18}
        />
        <StatCard label="Occupancy" value="92%" icon={Building2} tone="info" delta={3} />
        <StatCard label="Active users" value="4,218" icon={Users} delta={12} />
        <StatCard label="Avg. resolution" value="2.4d" icon={Wrench} tone="warning" delta={-9} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Revenue trend">
          <RevenueArea data={revenueSeries} />
        </ChartCard>
        <ChartCard title="Request volume">
          <RequestsBar data={requestsSeries} />
        </ChartCard>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Request categories">
          <CategoryPie data={categoryBreakdown} />
        </ChartCard>
        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Top performing properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Maplewood Apartments #3B", v: 96 },
              { name: "Birchwood Townhome", v: 88 },
              { name: "Oakridge Single Family", v: 81 },
              { name: "Harbor View Loft 12", v: 72 },
              { name: "Sunset Villas #7", v: 65 },
            ].map((p) => (
              <div key={p.name}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground">{p.v}</span>
                </div>
                <Progress value={p.v} className="mt-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
