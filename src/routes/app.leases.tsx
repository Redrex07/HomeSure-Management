import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { DataTable } from "@/shared/components/common/DataTable";
import { tenants, leaseDocs } from "@/shared/utils/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { FileText, Download } from "lucide-react";

export const Route = createFileRoute("/app/leases")({
  head: () => ({ meta: [{ title: "Leases — HomeSure" }] }),
  component: LeasesPage,
});

function LeasesPage() {
  return (
    <>
      <PageHeader title="Lease agreements" description="All active and upcoming leases." actions={<Button size="sm">New lease</Button>} />
      <DataTable
        rows={tenants.filter(t => t.status === "Active")}
        filterKeys={["name", "property"] as any}
        columns={[
          { key: "name", header: "Tenant" },
          { key: "property", header: "Property" },
          { key: "leaseStart", header: "Start" },
          { key: "leaseEnd", header: "End" },
          { key: "rent", header: "Rent", render: (t) => `$${t.rent.toLocaleString()}` },
          { key: "actions", header: "", render: () => <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button> },
        ]}
      />
      <Card className="border-border/70 shadow-card">
        <CardHeader><CardTitle className="text-sm font-semibold">Recent lease documents</CardTitle></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {leaseDocs.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-md border border-border/60 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-soft text-primary"><FileText className="h-4 w-4" /></div>
              <div className="flex-1"><div className="text-sm font-medium">{d.name}</div><div className="text-xs text-muted-foreground">{d.size} · {d.updated}</div></div>
              <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
