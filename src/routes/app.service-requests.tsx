import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataTable } from "@/shared/components/common/DataTable";
import { serviceRequests } from "@/shared/utils/mock-data";
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
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/service-requests")({
  head: () => ({ meta: [{ title: "Service Requests — HomeSure" }] }),
  component: ServiceRequestsPage,
});

function ServiceRequestsPage() {
  const [category, setCategory] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const filtered = serviceRequests.filter(
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
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Request submitted");
                  setOpen(false);
                }}
              >
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input placeholder="e.g. Leaking sink" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select defaultValue="Plumbing">
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
                    <Select defaultValue="Medium">
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
                  <Textarea rows={3} placeholder="Describe the issue…" />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Submit</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
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
            render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span>,
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
        ]}
      />
    </>
  );
}
