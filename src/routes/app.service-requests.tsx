import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataTable } from "@/shared/components/common/DataTable";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getServiceRequests,
  createServiceRequest,
  getTenantServiceRequests,
  updateServiceRequest,
  deleteServiceRequest,
} from "@/core/db/supabase-queries";
import { useTenantContext } from "@/features/tenant/hooks/useTenantContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
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
import { Textarea } from "@/shared/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/service-requests")({
  head: () => ({ meta: [{ title: "Service Requests — HomeSure" }] }),
  component: ServiceRequestsPage,
});

function ServiceRequestsPage() {
  const [category, setCategory] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [open, setOpen] = useState(false);

  // Form states for creation
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Plumbing");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newDesc, setNewDesc] = useState("");

  const [editingRequest, setEditingRequest] = useState<any | null>(null);
  const [editCategory, setEditCategory] = useState("Plumbing");
  const [editPriority, setEditPriority] = useState("Medium");
  const [editStatus, setEditStatus] = useState("Pending");

  const queryClient = useQueryClient();
  const tenantContext = useTenantContext();
  const isTenant = tenantContext.isTenant;
  const tenantId = tenantContext.tenantId;
  const serviceTenantId = tenantContext.serviceTenantId;

  // Load service requests from Supabase
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["service-requests", isTenant ? `${tenantId}:${serviceTenantId}` : "all"],
    queryFn: () =>
      isTenant && tenantId
        ? getTenantServiceRequests(tenantId, serviceTenantId)
        : getServiceRequests(),
    enabled: !isTenant || (!!tenantId && !!serviceTenantId),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, category, priority, status }: { id: string; category: string; priority: string; status: string }) =>
      updateServiceRequest(id, { category, priority, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast.success("Request updated successfully!");
      setEditingRequest(null);
    },
    onError: (err: any) => {
      toast.error("Error updating request: " + (err.message || String(err)));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteServiceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast.success("Request deleted successfully!");
    },
    onError: (err: any) => {
      toast.error("Error deleting request: " + (err.message || String(err)));
    }
  });

  // Create request mutation
  const createMutation = useMutation({
    mutationFn: createServiceRequest,
    onSuccess: (created) => {
      queryClient.setQueryData(
        ["service-requests", isTenant ? `${tenantId}:${serviceTenantId}` : "all"],
        (current: any[] | undefined) => [...(created || []), ...(current || [])],
      );
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast.success("Request submitted");
      setOpen(false);
      // Reset form
      setNewTitle("");
      setNewCategory("Plumbing");
      setNewPriority("Medium");
      setNewDesc("");
    },
    onError: (err: any) => {
      toast.error("Error submitting request: " + (err.message || String(err)));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title: newTitle,
      category: newCategory,
      priority: newPriority,
      description: newDesc,
      tenant_id: serviceTenantId || tenantId || undefined,
      property_id: tenantContext.propertyId || undefined,
      created_by: serviceTenantId || tenantId || undefined,
    });
  };

  const filtered = requests.filter(
    (r) =>
      (category === "all" || r.category === category) &&
      (priority === "all" || r.priority === priority),
  );

  return (
    <>
      <PageHeader
        title="Service requests"
        description="Track maintenance work end-to-end."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> New request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create service request</DialogTitle>
                <DialogDescription>
                  Submit a new maintenance ticket. A contractor will be assigned shortly.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-3" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input
                    placeholder="e.g. Leaking sink"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "Plumbing",
                          "Electrical",
                          "HVAC",
                          "Landscaping",
                          "Painting",
                          "Appliance",
                          "Locksmith",
                        ].map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Priority</Label>
                    <Select value={newPriority} onValueChange={setNewPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Low", "Medium", "High", "Urgent"].map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    placeholder="Describe the issue…"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      setNewTitle("");
                      setNewCategory("Plumbing");
                      setNewPriority("Medium");
                      setNewDesc("");
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
          <p className="text-sm text-muted-foreground animate-pulse">Loading service requests...</p>
        </div>
      ) : (
        <DataTable
          rows={filtered}
          filterKeys={["title", "id", "property", "tenant"]}
          toolbar={
            <>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {[
                    "Plumbing",
                    "Electrical",
                    "HVAC",
                    "Landscaping",
                    "Painting",
                    "Appliance",
                    "Locksmith",
                  ].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-9 w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {["Low", "Medium", "High", "Urgent"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
          columns={[
            {
              key: "id",
              header: "ID",
              render: (r) => (
                <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
              ),
            },
            {
              key: "title",
              header: "Request",
              sortable: true,
              render: (r) => (
                <div>
                  <div className="text-sm font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.category}</div>
                </div>
              ),
            },
            { key: "property", header: "Property" },
            { key: "tenant", header: "Tenant" },
            {
              key: "priority",
              header: "Priority",
              render: (r) => <StatusBadge value={r.priority} />,
            },
            {
              key: "contractor",
              header: "Contractor",
              render: (r) =>
                r.contractor ?? <span className="text-muted-foreground">Unassigned</span>,
            },
            { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
            {
              key: "actions",
              header: "",
              render: (r) => (
                <div className="flex items-center gap-1 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-primary-soft hover:text-primary"
                    onClick={() => {
                      setEditingRequest(r);
                      setEditCategory(r.category || "Plumbing");
                      setEditPriority(r.priority || "Medium");
                      setEditStatus(r.status || "Pending");
                    }}
                    title="Edit Request"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this service request?")) {
                        deleteMutation.mutate(r.id);
                      }
                    }}
                    title="Delete Request"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}

      <Dialog open={!!editingRequest} onOpenChange={(open) => !open && setEditingRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service Request {editingRequest?.id}</DialogTitle>
            <DialogDescription>
              Update category, priority level, or work progress status.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingRequest) return;
              updateMutation.mutate({
                id: editingRequest.id,
                category: editCategory,
                priority: editPriority,
                status: editStatus
              });
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="editCategorySelect">Category</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger id="editCategorySelect">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {["Plumbing", "Electrical", "HVAC", "Landscaping", "Painting", "Appliance", "Locksmith"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editPrioritySelect">Priority</Label>
              <Select value={editPriority} onValueChange={setEditPriority}>
                <SelectTrigger id="editPrioritySelect">
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  {["Low", "Medium", "High", "Urgent"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editStatusSelect">Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger id="editStatusSelect">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  {["Pending", "Assigned", "In Progress", "Completed", "Resolved"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingRequest(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
