import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataTable } from "@/shared/components/common/DataTable";
import { estimates } from "@/shared/utils/mock-data";
import { Plus, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/estimates")({
  head: () => ({ meta: [{ title: "Estimates — HomeSure" }] }),
  component: EstimatesPage,
});

function EstimatesPage() {
  return (
    <>
      <PageHeader
        title="Estimates"
        description="Submitted estimates awaiting approval."
        actions={
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" /> Submit estimate
          </Button>
        }
      />
      <DataTable
        rows={estimates}
        filterKeys={["id", "request", "contractor"]}
        columns={[
          {
            key: "id",
            header: "Estimate",
            render: (e) => <span className="font-mono text-xs">{e.id}</span>,
          },
          {
            key: "request",
            header: "Request",
            render: (e) => <span className="font-mono text-xs">{e.request}</span>,
          },
          { key: "contractor", header: "Contractor" },
          { key: "submitted", header: "Submitted" },
          {
            key: "amount",
            header: "Amount",
            sortable: true,
            render: (e) => <span className="font-medium">${e.amount.toLocaleString()}</span>,
          },
          { key: "status", header: "Status", render: (e) => <StatusBadge value={e.status} /> },
          {
            key: "actions",
            header: "",
            render: (e) =>
              e.status === "Pending" ? (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2"
                    onClick={() => toast.success("Estimate approved")}
                  >
                    <Check className="h-3.5 w-3.5 text-success" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2"
                    onClick={() => toast.error("Estimate rejected")}
                  >
                    <X className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ) : null,
          },
        ]}
      />
    </>
  );
}
