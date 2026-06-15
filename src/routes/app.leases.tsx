import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { DataTable } from "@/shared/components/common/DataTable";
import { tenants as mockTenants, leaseDocs } from "@/shared/utils/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { FileText, Download, Plus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/app/leases")({
  head: () => ({ meta: [{ title: "Leases — HomeSure" }] }),
  component: LeasesPage,
});

function LeasesPage() {
  const [leases, setLeases] = useState(() => mockTenants.filter((t) => t.status === "Active"));
  const [showNewLease, setShowNewLease] = useState(false);
  const [form, setForm] = useState({
    name: "",
    property: "",
    leaseStart: "",
    leaseEnd: "",
    rent: "",
  });

  const handleAddLease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.property || !form.leaseStart || !form.leaseEnd || !form.rent) {
      toast.error("Please fill all fields");
      return;
    }

    const newLease = {
      id: `T-${Math.floor(Math.random() * 10000)}`,
      name: form.name,
      property: form.property,
      leaseStart: form.leaseStart,
      leaseEnd: form.leaseEnd,
      rent: Number(form.rent),
      status: "Active",
      email: "",
      phone: "",
    };

    setLeases([newLease, ...leases]);
    toast.success("Lease added successfully");
    setShowNewLease(false);
    setForm({ name: "", property: "", leaseStart: "", leaseEnd: "", rent: "" });
  };

  const handleDownloadLease = (leaseName: string) => {
    const content = `LEASE AGREEMENT\n\nThis is a mock lease agreement for ${leaseName}.\n\nTerms and Conditions:\n1. The tenant agrees to pay rent on time.\n2. The landlord agrees to maintain the property.\n3. Standard mock terms apply.\n\nDate: ${new Date().toISOString().split("T")[0]}\n`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Lease_Agreement_${leaseName.replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded lease for ${leaseName}`);
  };

  return (
    <>
      <PageHeader
        title="Lease agreements"
        description="All active and upcoming leases."
        actions={
          <Button size="sm" onClick={() => setShowNewLease(true)}>
            <Plus className="mr-2 h-4 w-4" /> New lease
          </Button>
        }
      />

      <Dialog open={showNewLease} onOpenChange={setShowNewLease}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Lease</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddLease} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Tenant Name</Label>
              <Input
                placeholder="Example: John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Property</Label>
              <Input
                placeholder="Example: 123 Main St"
                value={form.property}
                onChange={(e) => setForm({ ...form, property: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Lease Start</Label>
              <Input
                type="date"
                value={form.leaseStart}
                onChange={(e) => setForm({ ...form, leaseStart: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Lease End</Label>
              <Input
                type="date"
                value={form.leaseEnd}
                onChange={(e) => setForm({ ...form, leaseEnd: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Rent Amount</Label>
              <Input
                type="number"
                placeholder="Example: 1500"
                value={form.rent}
                onChange={(e) => setForm({ ...form, rent: e.target.value })}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowNewLease(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Lease</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DataTable
        rows={leases}
        filterKeys={["name", "property"]}
        columns={[
          { key: "name", header: "Tenant" },
          { key: "property", header: "Property" },
          { key: "leaseStart", header: "Start" },
          { key: "leaseEnd", header: "End" },
          { key: "rent", header: "Rent", render: (t) => `$${t.rent.toLocaleString()}` },
          {
            key: "actions",
            header: "",
            render: (t) => (
              <Button variant="ghost" size="sm" onClick={() => handleDownloadLease(t.name)}>
                <Download className="h-4 w-4" />
              </Button>
            ),
          },
        ]}
      />
      <Card className="border-border/70 shadow-card mt-6">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Recent lease documents</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {leaseDocs.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-3 rounded-md border border-border/60 p-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-soft text-primary">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{d.name}</div>
                <div className="text-xs text-muted-foreground">
                  {d.size} · {d.updated}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDownloadLease(d.name)}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

