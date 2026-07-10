import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { properties, serviceRequests, leaseDocs } from "@/lib/mock-data";
import { StatCard } from "@/components/common/StatCard";
import { ChevronLeft, DollarSign, Users, Wrench, FileText, MapPin, Edit } from "lucide-react";

export const Route = createFileRoute("/app/properties/$id")({
  head: () => ({ meta: [{ title: "Property details — HomeSure" }] }),
  component: PropertyDetail,
});

function PropertyDetail() {
  const { id } = Route.useParams();
  const p = properties.find((x) => x.id === id) ?? properties[0];
  const reqs = serviceRequests.filter((r) => r.property === p.name);

  return (
    <>
      <Link to="/app/properties" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to properties
      </Link>
      <PageHeader
        title={p.name}
        description={p.address}
        actions={<><Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" /> Edit</Button><Button size="sm">Manage lease</Button></>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden border-border/70 shadow-card lg:col-span-2">
          <img src={p.image} alt="" className="h-64 w-full object-cover" />
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {p.address}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div><div className="text-xs text-muted-foreground">ID</div><div className="font-mono text-sm">{p.id}</div></div>
              <div><div className="text-xs text-muted-foreground">Type</div><div className="text-sm font-medium">{p.type}</div></div>
              <div><div className="text-xs text-muted-foreground">Monthly rent</div><div className="text-sm font-medium">${p.rent.toLocaleString()}</div></div>
              <div><div className="text-xs text-muted-foreground">Status</div><StatusBadge value={p.status} /></div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <StatCard label="Rent collected" value={`$${(p.rent * 6).toLocaleString()}`} icon={DollarSign} tone="success" delta={8} />
          <StatCard label="Tenant" value={p.tenant ?? "Vacant"} icon={Users} tone="info" />
          <StatCard label="Open requests" value={String(reqs.filter(r => r.status !== "Completed").length)} icon={Wrench} tone="warning" />
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lease">Lease</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card className="border-border/70 shadow-card">
            <CardHeader><CardTitle className="text-sm font-semibold">Property notes</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Recently renovated kitchen (2024). HVAC serviced March 2026. Tenant has been on time with all rent payments for the past 12 months.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="lease">
          <Card className="border-border/70 shadow-card">
            <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
              <div><div className="text-xs text-muted-foreground">Lease start</div><div className="text-sm font-medium">March 1, 2024</div></div>
              <div><div className="text-xs text-muted-foreground">Lease end</div><div className="text-sm font-medium">February 28, 2026</div></div>
              <div><div className="text-xs text-muted-foreground">Deposit</div><div className="text-sm font-medium">${(p.rent * 1.5).toLocaleString()}</div></div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="maintenance">
          <Card className="border-border/70 shadow-card">
            <CardContent className="space-y-2 p-5">
              {reqs.length === 0 && <div className="text-sm text-muted-foreground">No maintenance requests.</div>}
              {reqs.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-md border border-border/60 p-3">
                  <div><div className="text-sm font-medium">{r.title}</div><div className="text-xs text-muted-foreground">{r.category} · {r.created}</div></div>
                  <StatusBadge value={r.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents">
          <Card className="border-border/70 shadow-card">
            <CardContent className="space-y-2 p-5">
              {leaseDocs.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-md border border-border/60 p-3">
                  <FileText className="h-4 w-4 text-primary" />
                  <div className="flex-1"><div className="text-sm font-medium">{d.name}</div><div className="text-xs text-muted-foreground">{d.size}</div></div>
                  <Button variant="ghost" size="sm">Download</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
