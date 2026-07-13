import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataTable } from "@/shared/components/common/DataTable";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupportTickets, createSupportTicket, getUsers, updateSupportTicket } from "@/core/db/supabase-queries";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export const Route = createFileRoute("/app/support")({
  head: () => ({ meta: [{ title: "Support — HomeSure" }] }),
  component: SupportPage,
});

function SupportPage() {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [userId, setUserId] = useState("");

  const [editingTicket, setEditingTicket] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [ticketStatus, setTicketStatus] = useState("Open");
  const [assignedTo, setAssignedTo] = useState("");

  const queryClient = useQueryClient();

  const { data: ticketList = [], isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: getSupportTickets,
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, status, notes, assignedTo }: { id: string; status: string; notes?: string; assignedTo?: string }) =>
      updateSupportTicket(id, { status, notes, assignedTo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Ticket updated successfully!");
      setEditingTicket(null);
      setResolutionNotes("");
      setAssignedTo("");
    },
    onError: (err: any) => {
      toast.error("Error updating ticket: " + (err.message || String(err)));
    }
  });

  const { data: usersList = [] } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const createMutation = useMutation({
    mutationFn: createSupportTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Support ticket created successfully!");
      setOpen(false);
      setSubject("");
      setDescription("");
      setPriority("Medium");
      setUserId("");
    },
    onError: (err: any) => {
      toast.error("Error creating ticket: " + (err.message || String(err)));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("Please select a reporter.");
      return;
    }
    createMutation.mutate({
      user_id: parseInt(userId, 10),
      subject,
      description,
      priority,
    });
  };

  return (
    <>
      <PageHeader
        title="Support tickets"
        description="Customer support queue and resolutions."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> New ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Support Ticket</DialogTitle>
                <DialogDescription>
                  Create a new customer support ticket in the queue.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <Label>Reporter / User</Label>
                  <Select value={userId} onValueChange={setUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersList.map((u) => (
                        <SelectItem key={u.user_id} value={String(u.user_id)}>
                          {u.name} ({u.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <Input
                    placeholder="e.g. Broken heater"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Provide details about the issue..."
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Low", "Medium", "High", "Urgent"].map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      setSubject("");
                      setDescription("");
                      setPriority("Medium");
                      setUserId("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Ticket"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      {isLoading ? (
        <div className="flex h-64 items-center justify-center border border-border/60 rounded-md bg-background/50">
          <p className="text-sm text-muted-foreground animate-pulse">Loading support tickets...</p>
        </div>
      ) : (
        <DataTable
          rows={ticketList}
          filterKeys={["subject", "user", "id"]}
          columns={[
            {
              key: "id",
              header: "ID",
              render: (t) => <span className="font-mono text-xs">{t.id}</span>,
            },
            {
              key: "subject",
              header: "Subject",
              sortable: true,
              render: (t) => <span className="font-medium">{t.subject}</span>,
            },
            {
              key: "user",
              header: "Reporter",
              render: (t) => (
                <div>
                  <div className="text-sm">{t.user}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              ),
            },
            {
              key: "priority",
              header: "Priority",
              render: (t) => <StatusBadge value={t.priority} />,
            },
            { key: "created", header: "Created" },
            { key: "status", header: "Status", render: (t) => <StatusBadge value={t.status} /> },
            {
              key: "actions",
              header: "",
              render: (t) => (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setEditingTicket(t);
                      setTicketStatus(t.status);
                      setResolutionNotes(t.resolutionNotes || "");
                      setAssignedTo(t.assignedTo || "");
                    }}
                    title="Edit Resolution / Status"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}

      <Dialog open={!!editingTicket} onOpenChange={(open) => !open && setEditingTicket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Ticket {editingTicket?.id}</DialogTitle>
            <DialogDescription>
              Assign the ticket or write resolution notes to resolve/close it.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingTicket) return;
              updateTicketMutation.mutate({
                id: editingTicket.id,
                status: ticketStatus,
                notes: resolutionNotes,
                assignedTo: assignedTo
              });
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="ticketStatusSelect">Ticket Status</Label>
              <Select value={ticketStatus} onValueChange={setTicketStatus}>
                <SelectTrigger id="ticketStatusSelect">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assigneeInput">Assigned To</Label>
              <Input
                id="assigneeInput"
                placeholder="e.g. support-agent-1"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resNotes">Resolution Notes</Label>
              <Textarea
                id="resNotes"
                placeholder="Describe how the issue was resolved..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingTicket(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateTicketMutation.isPending}>
                {updateTicketMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}


