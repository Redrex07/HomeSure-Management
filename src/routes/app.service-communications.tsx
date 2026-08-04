import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataTable } from "@/shared/components/common/DataTable";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getServiceCommunications,
  createServiceCommunication,
  updateServiceCommunication,
  deleteServiceCommunication,
  getServiceRequests,
  getUsers,
} from "@/core/db/supabase-queries";
import {
  MessageSquare,
  Send,
  Eye,
  Trash2,
  Edit2,
  FileCheck,
  Paperclip,
  Check,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/service-communications")({
  head: () => ({ meta: [{ title: "Service Communications — HomeSure" }] }),
  component: ServiceCommunicationsPage,
});

function ServiceCommunicationsPage() {
  const queryClient = useQueryClient();

  const [openSend, setOpenSend] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("openAdd") === "1") {
      setOpenSend(true);
    }
  }, []);

  const [selectedRequest, setSelectedRequest] = useState("");
  const [selectedReceiver, setSelectedReceiver] = useState("");
  const [commType, setCommType] = useState("Chat");
  const [messageText, setMessageText] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");

  const [editingMsg, setEditingMsg] = useState<any | null>(null);
  const [editMessageText, setEditMessageText] = useState("");

  // Queries
  const { data: communications = [], isLoading, isError, error } = useQuery({
    queryKey: ["service-communications"],
    queryFn: getServiceCommunications,
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["service-requests"],
    queryFn: getServiceRequests,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  // Mutations
  const sendMutation = useMutation({
    mutationFn: createServiceCommunication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-communications"] });
      toast.success("Message sent successfully!");
      setOpenSend(false);
      setSelectedRequest("");
      setSelectedReceiver("");
      setCommType("Chat");
      setMessageText("");
      setAttachmentUrl("");
    },
    onError: (err: any) => {
      toast.error("Failed to send message: " + (err.message || String(err)));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) =>
      updateServiceCommunication(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-communications"] });
      toast.success("Message updated successfully!");
      setEditingMsg(null);
      setEditMessageText("");
    },
    onError: (err: any) => {
      toast.error("Failed to update message: " + (err.message || String(err)));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteServiceCommunication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-communications"] });
      toast.success("Message deleted successfully!");
    },
    onError: (err: any) => {
      toast.error("Failed to delete message: " + (err.message || String(err)));
    },
  });

  // Handlers
  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !selectedReceiver || !messageText.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    sendMutation.mutate({
      service_request_id: parseInt(selectedRequest, 10),
      sender_id: 1, // Assume current user (service admin) is ID 1
      receiver_id: parseInt(selectedReceiver, 10),
      communication_type: commType,
      message: messageText.trim(),
      attachment_url: attachmentUrl.trim() || undefined,
      status: "Sent",
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMsg || !editMessageText.trim()) return;
    
    updateMutation.mutate({
      id: editingMsg.id,
      payload: { message: editMessageText.trim() },
    });
  };

  const handleMarkRead = (id: number) => {
    updateMutation.mutate({
      id,
      payload: { status: "Read", read_at: new Date().toISOString() },
    });
  };

  const handleMarkDelivered = (id: number) => {
    updateMutation.mutate({
      id,
      payload: { status: "Delivered" },
    });
  };

  return (
    <>
      <PageHeader
        title="Service Communications"
        description="Broadcast updates and chat logs directly with landlords, tenants, and contractors."
        actions={
          <Button size="sm" onClick={() => setOpenSend(true)}>
            <Send className="mr-2 h-4 w-4" /> Send Message
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center border border-border/60 rounded-md bg-background/50">
          <p className="text-sm text-muted-foreground animate-pulse">Loading message logs...</p>
        </div>
      ) : isError ? (
        <div className="flex h-64 flex-col items-center justify-center border border-destructive/30 rounded-md bg-destructive-soft p-6 text-center">
          <p className="text-sm font-semibold text-destructive mb-2">Failed to load messages</p>
          <p className="text-xs text-muted-foreground max-w-md">
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      ) : (
        <DataTable
          rows={communications}
          filterKeys={["message", "senderName", "receiverName"]}
          empty="No Communications Found"
          columns={[
            {
              key: "requestId",
              header: "Request ID",
              render: (c) => (
                <span className="font-mono text-xs text-muted-foreground">
                  SR-{c.requestId}
                </span>
              ),
            },
            {
              key: "senderName",
              header: "Sender",
              render: (c) => <span className="font-medium">{c.senderName}</span>,
            },
            {
              key: "receiverName",
              header: "Receiver",
              render: (c) => <span className="font-medium">{c.receiverName}</span>,
            },
            {
              key: "message",
              header: "Message",
              render: (c) => (
                <div className="max-w-[280px] truncate text-slate-700" title={c.message}>
                  {c.message}
                </div>
              ),
            },
            {
              key: "type",
              header: "Type",
              render: (c) => <StatusBadge value={c.type} />,
            },
            {
              key: "attachmentUrl",
              header: "Attachment",
              render: (c) =>
                c.attachmentUrl ? (
                  <a
                    href={c.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                  >
                    <Paperclip className="h-3 w-3" /> View
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                ),
            },
            {
              key: "status",
              header: "Status",
              render: (c) => (
                <div className="flex items-center gap-1.5">
                  <StatusBadge value={c.status} />
                  {c.status === "Read" ? (
                    <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                  ) : c.status === "Delivered" ? (
                    <CheckCheck className="h-3.5 w-3.5 text-slate-400" />
                  ) : c.status === "Sent" ? (
                    <Check className="h-3.5 w-3.5 text-slate-400" />
                  ) : null}
                </div>
              ),
            },
            {
              key: "sentAt",
              header: "Sent At",
              render: (c) => (
                <span className="text-xs text-muted-foreground">
                  {c.sentAt ? c.sentAt.replace("T", " ").substring(0, 16) : "—"}
                </span>
              ),
            },
            {
              key: "actions",
              header: "",
              render: (c) => (
                <div className="flex items-center justify-end gap-1">
                  {c.status !== "Read" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => handleMarkRead(c.id)}
                        title="Mark Read"
                      >
                        <FileCheck className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700"
                        onClick={() => handleMarkDelivered(c.id)}
                        title="Mark Delivered"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  {!c.readAt && c.status !== "Read" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        setEditingMsg(c);
                        setEditMessageText(c.message);
                      }}
                      title="Edit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this message?")) {
                        deleteMutation.mutate(c.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}

      {/* Send Message Dialog */}
      <Dialog open={openSend} onOpenChange={setOpenSend}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>Compose a new update or direct message linked to a service request.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Service Request</Label>
                <Select value={selectedRequest} onValueChange={setSelectedRequest}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select request" />
                  </SelectTrigger>
                  <SelectContent>
                    {requests.map((r: any) => (
                      <SelectItem key={r.requestId} value={String(r.requestId)}>
                        SR-{r.requestId} · {r.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Recipient</Label>
                <Select value={selectedReceiver} onValueChange={setSelectedReceiver}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u: any) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name} ({u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={commType} onValueChange={setCommType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select communication type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chat">Chat Message</SelectItem>
                  <SelectItem value="Email">Email Update</SelectItem>
                  <SelectItem value="SMS">SMS Notification</SelectItem>
                  <SelectItem value="Internal Note">Internal Staff Note</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message content here..."
                required
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Attachment URL</Label>
              <Input
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="e.g. https://supabase.co/storage/v1/object/public/..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenSend(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={sendMutation.isPending}>
                {sendMutation.isPending ? "Sending..." : "Send"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Message Dialog */}
      <Dialog open={!!editingMsg} onOpenChange={(open) => !open && setEditingMsg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
            <DialogDescription>Modify message content. This is only allowed for unread communications.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={editMessageText}
                onChange={(e) => setEditMessageText(e.target.value)}
                required
                className="min-h-[100px]"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingMsg(null)}>
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
