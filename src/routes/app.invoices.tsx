import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatCard } from "@/shared/components/common/StatCard";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataTable } from "@/shared/components/common/DataTable";
import { invoices } from "@/shared/utils/mock-data";
import { Download, Receipt, DollarSign, AlertTriangle, Clock } from "lucide-react";

export const Route = createFileRoute("/app/invoices")({
  head: () => ({ meta: [{ title: "Invoices — HomeSure" }] }),
  component: InvoicesPage,
});

function InvoicesPage() {
  const paid = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const pending = invoices.filter(i => i.status === "Pending").reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter(i => i.status === "Overdue").reduce((s, i) => s + i.amount, 0);

  return (
    <>
      <PageHeader title="Invoices" description="Track billing, payments and overdue accounts." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Paid (mo)" value={`$${paid.toLocaleString()}`} icon={DollarSign} tone="success" />
        <StatCard label="Pending" value={`$${pending.toLocaleString()}`} icon={Clock} tone="warning" />
        <StatCard label="Overdue" value={`$${overdue.toLocaleString()}`} icon={AlertTriangle} tone="destructive" />
      </div>
      <DataTable
        rows={invoices}
        filterKeys={["id", "request"] as any}
        columns={[
          { key: "id", header: "Invoice", render: (i) => <span className="font-mono text-xs">{i.id}</span> },
          { key: "request", header: "Request", render: (i) => <span className="font-mono text-xs text-muted-foreground">{i.request}</span> },
          { key: "issued", header: "Issued" },
          { key: "due", header: "Due" },
          { key: "amount", header: "Amount", sortable: true, render: (i) => <span className="font-medium">${i.amount.toLocaleString()}</span> },
          { key: "status", header: "Status", render: (i) => <StatusBadge value={i.status} /> },
          { key: "actions", header: "", render: () => <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button> },
        ]}
      />
    </>
  );
}
