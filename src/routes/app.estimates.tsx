import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataTable } from "@/shared/components/common/DataTable";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEstimates,
  updateEstimateStatus,
  createEstimate,
  getServiceRequests,
  getContractors,
} from "@/core/db/supabase-queries";
import { Plus, Check, X } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/shared/utils/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export const Route = createFileRoute("/app/estimates")({
  head: () => ({ meta: [{ title: "Estimates — HomeSure" }] }),
  component: EstimatesPage,
});

function EstimatesPage() {
  const queryClient = useQueryClient();

  const [openCreate, setOpenCreate] = useState(false);
  const [createRequestId, setCreateRequestId] = useState("");
  const [createContractorId, setCreateContractorId] = useState("");
  const [createAmount, setCreateAmount] = useState("");

  const { data: estimateList = [], isLoading } = useQuery({
    queryKey: ["estimates"],
    queryFn: getEstimates,
  });

  const { data: serviceRequests = [] } = useQuery({
    queryKey: ["service-requests"],
    queryFn: () => getServiceRequests(),
  });

  const { data: contractors = [] } = useQuery({
    queryKey: ["contractors"],
    queryFn: getContractors,
  });

  const createMutation = useMutation({
    mutationFn: createEstimate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast.success("Estimate submitted successfully!");
      setOpenCreate(false);
      setCreateRequestId("");
      setCreateContractorId("");
      setCreateAmount("");
    },
    onError: (err: any) => {
      toast.error("Error submitting estimate: " + (err.message || String(err)));
    },
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createRequestId || !createContractorId || !createAmount) {
      toast.error("Please fill in all fields.");
      return;
    }
    createMutation.mutate({
  service_request_id: parseInt(createRequestId.replace("SR-", ""), 10),
  contractor_id: Number(createContractorId),
  estimated_cost: Number(createAmount),
});
  };

  return (
    <>
      <PageHeader
        title="Estimates"
        description="Submitted estimates awaiting approval."
        actions={
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Submit estimate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Estimate</DialogTitle>
                <DialogDescription>
                  Create a new estimate for a service request.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <Label>Service Request</Label>
                  <Select value={createRequestId} onValueChange={setCreateRequestId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service request" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceRequests.map((sr) => (
                        <SelectItem key={sr.id} value={sr.id}>
                          {sr.id}: {sr.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Contractor</Label>
                  <Select
  value={createContractorId}
  onValueChange={(value) => {
    setCreateContractorId(value);
  }}
>
  <SelectTrigger>
    <SelectValue placeholder="Select contractor" />
  </SelectTrigger>

  <SelectContent>
    {contractors.map((c) => (
      <SelectItem
        key={String(c.id)}
        value={String(c.id)}
      >
        {c.name} ({c.trade})
      </SelectItem>
    ))}
  </SelectContent>
</Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Estimated Cost (INR)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 5000"
                    required
                    value={createAmount}
                    onChange={(e) => setCreateAmount(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpenCreate(false);
                      setCreateRequestId("");
                      setCreateContractorId("");
                      setCreateAmount("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Submitting..." : "Submit"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
              key: "document",
              header: "Document",
              render: (e) => e.documentUrl ? (
                <a href={e.documentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline font-medium hover:text-primary/80">
                  {e.documentName || "View Estimate"}
                </a>
              ) : <span className="text-slate-400 text-xs">—</span>
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


