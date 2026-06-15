import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { DataCardGrid } from "@/shared/components/common/DataCardGrid";
import { tenants as mockTenants, leaseDocs } from "@/shared/utils/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { FileText, Download, Plus, Trash2 } from "lucide-react";
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

  const handleDeleteLease = (id: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this lease?");
    if (!confirmDelete) return;

    setLeases(leases.filter((lease) => lease.id !== id));
    toast.success("Lease deleted successfully");
  };

  const handleDownloadLease = (leaseName: string) => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lease Agreement - ${leaseName}</title>
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px; color: #1e293b; }
        .document { background-color: #ffffff; max-width: 800px; margin: 0 auto; padding: 50px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border-top: 8px solid #4f46e5; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: 800; color: #4f46e5; letter-spacing: -1px; }
        .doc-title { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; font-weight: 600; }
        h1 { font-size: 32px; margin: 0 0 10px 0; color: #0f172a; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; background: #f1f5f9; padding: 25px; border-radius: 8px; }
        .label { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600; margin-bottom: 5px; }
        .value { font-size: 16px; font-weight: 500; color: #0f172a; }
        h2 { font-size: 20px; color: #334155; margin-top: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
        p { line-height: 1.6; color: #475569; }
        ul { padding-left: 20px; color: #475569; line-height: 1.8; }
        li::marker { color: #4f46e5; }
        .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; }
        .sign-box { border-top: 2px dashed #cbd5e1; padding-top: 15px; }
        .sign-title { font-weight: 600; color: #334155; }
        .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="document">
        <div class="header">
            <div class="logo">HomeSure</div>
            <div class="doc-title">Official Document</div>
        </div>
        
        <h1>Residential Lease Agreement</h1>
        <p>This legally binding agreement is entered into on <strong>${new Date().toLocaleDateString()}</strong>.</p>
        
        <div class="grid">
            <div>
                <div class="label">Landlord</div>
                <div class="value">HomeSure Management LLC</div>
            </div>
            <div>
                <div class="label">Tenant</div>
                <div class="value">${leaseName}</div>
            </div>
            <div>
                <div class="label">Property Address</div>
                <div class="value">Subject Property</div>
            </div>
            <div>
                <div class="label">Status</div>
                <div class="value" style="color: #059669;">Active & Valid</div>
            </div>
        </div>

        <h2>1. Terms and Conditions</h2>
        <p>The Tenant agrees to lease the Premises from the Landlord for the duration specified in the HomeSure system. The Tenant shall use the Premises for residential purposes only.</p>

        <h2>2. Rent Payments</h2>
        <ul>
            <li>Rent shall be paid in full on or before the 1st of every month.</li>
            <li>Payments are to be processed via the HomeSure Management portal.</li>
            <li>A late fee will be applied for payments received after the grace period.</li>
        </ul>

        <h2>3. Maintenance and Utilities</h2>
        <p>The Tenant is responsible for maintaining the general cleanliness of the property. All major maintenance requests must be logged through the HomeSure platform. Utilities shall be covered as dictated in the primary leasing portal.</p>

        <div class="signatures">
            <div class="sign-box">
                <div class="sign-title">Landlord Signature</div>
                <div style="font-family: 'Brush Script MT', cursive; font-size: 24px; color: #4f46e5; margin-top: 10px;">HomeSure Auth</div>
            </div>
            <div class="sign-box">
                <div class="sign-title">Tenant Signature</div>
                <div style="font-style: italic; color: #94a3b8; margin-top: 15px;">Pending Electronic Signature</div>
            </div>
        </div>

        <div class="footer">
            Document generated securely by HomeSure Management System on ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>
    `;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Lease_Agreement_${leaseName.replace(/\s+/g, "_")}.html`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded colorful lease for ${leaseName}`);
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

      <DataCardGrid
        rows={leases}
        filterKeys={["name", "property"]}
        fields={[
          {
            key: "name",
            label: "Tenant",
            primary: true,
          },
          {
            key: "property",
            label: "Property",
            secondary: true,
          },
          {
            key: "leaseStart",
            label: "Start Date",
          },
          {
            key: "leaseEnd",
            label: "End Date",
          },
          {
            key: "rent",
            label: "Rent",
            render: (t) => (
              <span className="font-semibold text-foreground">
                ₹{t.rent?.toLocaleString()}
              </span>
            ),
          },
        ]}
        actions={(t) => (
          <div className="flex items-center gap-1 justify-end">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-primary-soft hover:text-primary" onClick={(e) => { e.stopPropagation(); handleDownloadLease(t.name); }}>
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); handleDeleteLease(t.id); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
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

