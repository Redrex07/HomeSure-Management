import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataTable } from "@/shared/components/common/DataTable";
import { StatCard } from "@/shared/components/common/StatCard";
import { subscriptions } from "@/shared/utils/mock-data";
import { CreditCard, DollarSign, TrendingUp, Plus } from "lucide-react";

export const Route = createFileRoute("/app/subscriptions")({
  head: () => ({ meta: [{ title: "Subscriptions — HomeSure" }] }),
  component: SubsPage,
});

function SubsPage() {
  const mrr = subscriptions.reduce((s, x) => s + x.mrr, 0);
  return (
    <>
      <PageHeader
        title="Subscriptions"
        description="Plans, billing and renewals."
        actions={
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add subscription
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active subs"
          value={String(subscriptions.filter((s) => s.status === "Active").length)}
          icon={CreditCard}
          tone="success"
        />
        <StatCard
          label="MRR"
          value={`$${mrr.toLocaleString()}`}
          icon={DollarSign}
          tone="success"
          delta={14}
        />
        <StatCard
          label="Trials"
          value={String(subscriptions.filter((s) => s.status === "Trial").length)}
          icon={TrendingUp}
          tone="info"
        />
      </div>
      <DataTable
        rows={subscriptions}
        filterKeys={["customer", "plan"]}
        columns={[
          {
            key: "id",
            header: "ID",
            render: (s) => <span className="font-mono text-xs">{s.id}</span>,
          },
          {
            key: "customer",
            header: "Customer",
            sortable: true,
            render: (s) => <span className="font-medium">{s.customer}</span>,
          },
          { key: "plan", header: "Plan" },
          { key: "seats", header: "Seats" },
          { key: "mrr", header: "MRR", render: (s) => `$${s.mrr}` },
          { key: "renews", header: "Renews" },
          { key: "status", header: "Status", render: (s) => <StatusBadge value={s.status} /> },
        ]}
      />
    </>
  );
}
