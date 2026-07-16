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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { DataTable } from "@/shared/components/common/DataTable";
import { revenueSeries, requestsSeries, categoryBreakdown } from "@/shared/utils/mock-data";
import { DollarSign, Building2, Users, Wrench, FileDown, Search, Filter, RefreshCw, Calendar } from "lucide-react";
import { formatINR } from "@/shared/utils/utils";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { fetchPlatformStats, fetchPlatformRevenue } from "@/core/api/users.functions";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — HomeSure" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: () => fetchPlatformStats(),
    refetchOnWindowFocus: false,
  });

  const { data: revenueData, isLoading: isRevenueLoading, refetch: refetchRevenue } = useQuery({
    queryKey: ["platform-revenue"],
    queryFn: () => fetchPlatformRevenue(),
    refetchOnWindowFocus: false,
  });

  const totalProperties = stats?.totalProperties ?? 0;
  const activeLandlords = stats?.activeLandlords ?? 0;
  const activeTenants = stats?.activeTenants ?? 0;
  const activeContractors = stats?.activeContractors ?? 0;
  const totalUsers = stats?.totalUsers ?? 0;
  const pendingRequests = stats?.pendingRequests ?? 0;

  // Process and filter revenue items
  const filteredRevenueItems = useMemo(() => {
    if (!revenueData?.items) return [];
    let items = revenueData.items;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.source.toLowerCase().includes(q) || 
        item.type.toLowerCase().includes(q) || 
        item.id.toLowerCase().includes(q)
      );
    }

    if (startDate) {
      items = items.filter(item => item.date >= startDate);
    }

    if (endDate) {
      items = items.filter(item => item.date <= endDate);
    }

    return items;
  }, [revenueData, searchQuery, startDate, endDate]);

  // Aggregate stats based on filtered items
  const aggregatedStats = useMemo(() => {
    let sub = 0;
    let con = 0;
    let rlt = 0;

    filteredRevenueItems.forEach(item => {
      if (item.type === "Subscription") sub += item.commission;
      else if (item.type === "Contractor Commission") con += item.commission;
      else if (item.type === "Realtor Commission") rlt += item.commission;
    });

    const total = sub + con + rlt;

    return {
      totalRevenue: total,
      subscriptionRevenue: sub,
      contractorCommission: con,
      realtorCommission: rlt,
    };
  }, [filteredRevenueItems]);

  const handleExportCSV = () => {
    if (filteredRevenueItems.length === 0) {
      toast.error("No data to export.");
      return;
    }
    const headers = ["Transaction ID", "Type", "Source/Reference", "Gross Amount", "Platform Revenue", "Date", "Status"];
    const rows = filteredRevenueItems.map(item => [
      item.id,
      item.type,
      item.source.replace(/"/g, '""'),
      item.amount,
      item.commission,
      item.date,
      item.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `homesure_revenue_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    // Generate XML spreadsheet structure or just structured CSV (Excel likes standard UTF-8 CSV with sep=,)
    if (filteredRevenueItems.length === 0) {
      toast.error("No data to export.");
      return;
    }
    const headers = ["Transaction ID", "Type", "Source/Reference", "Gross Amount", "Platform Revenue", "Date", "Status"];
    const rows = filteredRevenueItems.map(item => [
      item.id,
      item.type,
      item.source.replace(/"/g, '""'),
      item.amount,
      item.commission,
      item.date,
      item.status
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8,sep=,\n" 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `homesure_revenue_report_${new Date().toISOString().split("T")[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (filteredRevenueItems.length === 0) {
      toast.error("No data to export.");
      return;
    }
    
    // Print window strategy
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocked! Please allow popups for HomeSure to export PDF.");
      return;
    }

    const rowsHtml = filteredRevenueItems.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; font-family: monospace; font-size: 11px;">${item.id}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.type}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.source}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatINR(item.amount)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">${formatINR(item.commission)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.date}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.status}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>HomeSure Revenue Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 30px; color: #333; }
            h1 { color: #1e3a8a; margin-bottom: 5px; }
            h2 { color: #555; font-size: 14px; margin-top: 0; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f3f4f6; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; font-size: 12px; text-transform: uppercase; color: #666; }
            .totals-container { display: flex; justify-content: space-between; margin-bottom: 30px; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
            .total-card { text-align: center; flex: 1; }
            .total-card h3 { margin: 0 0 5px 0; font-size: 12px; color: #64748b; text-transform: uppercase; }
            .total-card p { margin: 0; font-size: 18px; font-weight: bold; color: #0f172a; }
          </style>
        </head>
        <body>
          <h1>HomeSure Financial Report</h1>
          <h2>Generated on ${new Date().toLocaleString()}</h2>
          
          <div class="totals-container">
            <div class="total-card">
              <h3>Total Platform Revenue</h3>
              <p>${formatINR(aggregatedStats.totalRevenue)}</p>
            </div>
            <div class="total-card">
              <h3>Subscription MRR</h3>
              <p>${formatINR(aggregatedStats.subscriptionRevenue)}</p>
            </div>
            <div class="total-card">
              <h3>Contractor Commission</h3>
              <p>${formatINR(aggregatedStats.contractorCommission)}</p>
            </div>
            <div class="total-card">
              <h3>Realtor Commission</h3>
              <p>${formatINR(aggregatedStats.realtorCommission)}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Type</th>
                <th>Source/Reference</th>
                <th style="text-align: right;">Gross Value</th>
                <th style="text-align: right;">Revenue/Commission</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          
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
      <PageHeader title="Analytics & Revenue" description="Monitor platform usage, subscriptions growth, and financial operations." />

      <Tabs defaultValue="usage">
        <TabsList className="bg-slate-100 p-1 rounded-lg mb-4">
          <TabsTrigger value="usage">Platform Usage</TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Revenue & Commissions</TabsTrigger>
        </TabsList>

        <TabsContent value="usage">
          {isStatsLoading ? (
            <div className="flex h-12 items-center justify-center">
              <p className="animate-pulse text-xs text-slate-400">Loading statistics...</p>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
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

          <div className="grid gap-4 lg:grid-cols-2 mb-6">
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
            <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
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
                      <span className="font-medium text-slate-700">{p.name}</span>
                      <span className="text-slate-500 font-semibold">{p.v}</span>
                    </div>
                    <Progress value={p.v} className="mt-1.5 h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          {/* Revenue Cards */}
          <div className="grid gap-4 sm:grid-cols-4 mb-6">
            <StatCard
              label="Total Revenue"
              value={formatINR(aggregatedStats.totalRevenue)}
              icon={DollarSign}
              tone="success"
            />
            <StatCard 
              label="Subscription MRR" 
              value={formatINR(aggregatedStats.subscriptionRevenue)} 
              icon={Users} 
              tone="success" 
            />
            <StatCard 
              label="Contractor Commission (10%)" 
              value={formatINR(aggregatedStats.contractorCommission)} 
              icon={Wrench} 
              tone="info" 
            />
            <StatCard 
              label="Realtor Commission (5%)" 
              value={formatINR(aggregatedStats.realtorCommission)} 
              icon={Building2} 
              tone="warning" 
            />
          </div>

          {/* Filters & Export Toolbar */}
          <Card className="border border-slate-200 shadow-sm bg-white rounded-xl p-4 mb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end justify-between">
              <div className="grid gap-3 sm:grid-cols-3 flex-1 max-w-3xl">
                <div className="space-y-1.5">
                  <Label htmlFor="search-rev" className="text-xs font-semibold text-slate-500">Search Transaction</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <Input id="search-rev" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search payee..." className="pl-9 h-9" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="start-date" className="text-xs font-semibold text-slate-500">Start Date</Label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="pl-9 h-9" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end-date" className="text-xs font-semibold text-slate-500">End Date</Label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="pl-9 h-9" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 self-start md:self-end">
                <Button size="sm" variant="outline" className="h-9 cursor-pointer" onClick={handleExportCSV}>
                  <FileDown className="mr-1.5 h-4 w-4" /> CSV
                </Button>
                <Button size="sm" variant="outline" className="h-9 cursor-pointer" onClick={handleExportExcel}>
                  <FileDown className="mr-1.5 h-4 w-4" /> Excel
                </Button>
                <Button size="sm" variant="outline" className="h-9 cursor-pointer" onClick={handleExportPDF}>
                  <FileDown className="mr-1.5 h-4 w-4" /> PDF Report
                </Button>
              </div>
            </div>
          </Card>

          {/* Revenue Breakdown Table */}
          {isRevenueLoading ? (
            <div className="flex h-48 items-center justify-center">
              <p className="animate-pulse text-sm text-slate-400">Loading transactions...</p>
            </div>
          ) : (
            <DataTable
              rows={filteredRevenueItems}
              filterKeys={["id", "source", "type"]}
              columns={[
                { key: "id", header: "Txn ID", render: (r) => <span className="font-mono text-xs text-slate-500">{r.id}</span> },
                { 
                  key: "type", 
                  header: "Type", 
                  sortable: true,
                  render: (r) => {
                    if (r.type === "Subscription") return <Badge className="bg-emerald-50 text-emerald-700 border-0">Subscription</Badge>;
                    if (r.type === "Contractor Commission") return <Badge className="bg-blue-50 text-blue-700 border-0">Contractor Comm</Badge>;
                    return <Badge className="bg-amber-50 text-amber-700 border-0">Realtor Comm</Badge>;
                  }
                },
                { key: "source", header: "Payee / Source", sortable: true },
                { key: "amount", header: "Gross Amount", sortable: true, render: (r) => formatINR(r.amount) },
                { key: "commission", header: "Platform Revenue", sortable: true, render: (r) => <span className="font-semibold text-slate-800">{formatINR(r.commission)}</span> },
                { key: "date", header: "Date", sortable: true, render: (r) => <span className="font-mono text-xs">{r.date}</span> },
                { key: "status", header: "Status", sortable: true, render: (r) => <Badge variant="outline" className="text-xs capitalize">{r.status}</Badge> }
              ]}
            />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
