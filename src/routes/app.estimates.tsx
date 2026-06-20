import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataTable } from "@/shared/components/common/DataTable";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEstimates, updateEstimateStatus } from "@/core/db/supabase-queries";
import { Plus, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/estimates")({
  head: () => ({ meta: [{ title: "Estimates — HomeSure" }] }),
  component: EstimatesPage,
});

function EstimatesPage() {
  const queryClient = useQueryClient();

  const { data: estimateList = [], isLoading } = useQuery({
    queryKey: ["estimates"],
    queryFn: getEstimates,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => updateEstimateStatus(id, "Approved"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast.success("Estimate approved");
    },
    onError: (err: any) => {
      toast.error("Error approving estimate: " + (err.message || String(err)));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => updateEstimateStatus(id, "Rejected"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast.error("Estimate rejected");
    },
    onError: (err: any) => {
      toast.error("Error rejecting estimate: " + (err.message || String(err)));
    },
  });

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
      {isLoading ? (
        <div className="flex h-64 items-center justify-center border border-border/60 rounded-md bg-background/50">
          <p className="text-sm text-muted-foreground animate-pulse">Loading estimates...</p>
        </div>
      ) : (
        <DataTable
          rows={estimateList}
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
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      onClick={() => approveMutation.mutate(e.id)}
                    >
                      <Check className="h-3.5 w-3.5 text-success" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2"
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate(e.id)}
                    >
                      <X className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ) : null,
            },
          ]}
        />
      )}
    </>
  );
}

