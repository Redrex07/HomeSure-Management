import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { DataTable } from "@/shared/components/common/DataTable";
import { StatCard } from "@/shared/components/common/StatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Plus, MoreHorizontal, Trash2, RefreshCw, Users, UserCheck, Mail, Pencil, Eye, Check, X, FileDown, Lock } from "lucide-react";
import { ROLE_LABELS, type Role } from "@/features/auth/utils/roles";
import { 
  invitePlatformUser, 
  deletePlatformUser, 
  fetchPlatformUsers,
  updatePlatformUser,
  resetPlatformUserPassword,
  fetchPlatformClosureRequests,
  updatePlatformClosureRequest,
  type PlatformUser,
  type ClosureRequest
} from "@/core/api/users.functions";
import { useSession } from "@/features/auth/store/auth-store";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/card";
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

export const Route = createFileRoute("/app/users")({
  head: () => ({ meta: [{ title: "Users — HomeSure" }] }),
  component: UsersPage,
});

type StatusFilter = "All" | "Active" | "Pending" | "Invited" | "Expired" | "Deactivated";

function statusBadge(status: PlatformUser["status"]) {
  switch (status) {
    case "Active":
      return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs font-medium">Active</Badge>;
    case "Pending":
      return <Badge className="bg-amber-100 text-amber-700 border-0 text-xs font-medium">Pending</Badge>;
    case "Invited":
      return <Badge className="bg-blue-100 text-blue-700 border-0 text-xs font-medium">Invited</Badge>;
    case "Expired":
      return <Badge className="bg-red-100 text-red-700 border-0 text-xs font-medium">Expired</Badge>;
    case "Deactivated":
      return <Badge className="bg-slate-100 text-slate-700 border-0 text-xs font-medium">Deactivated</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

function UsersPage() {
  const session = useSession();
  const queryClient = useQueryClient();
  
  // Modals state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("landlord");
  
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [viewingUser, setViewingUser] = useState<PlatformUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<PlatformUser | null>(null);
  const [resettingUser, setResettingUser] = useState<PlatformUser | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState("");
  
  // Closed Accounts Actions
  const [rejectionRequest, setRejectionRequest] = useState<ClosureRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  // Queries
  const { data: allUsers = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["platform-users"],
    queryFn: () => fetchPlatformUsers(),
    refetchOnWindowFocus: false,
  });

  const { data: closureRequests = [], isLoading: isClosuresLoading } = useQuery({
    queryKey: ["platform-closure-requests"],
    queryFn: () => fetchPlatformClosureRequests(),
    refetchOnWindowFocus: false,
  });

  // Mutations
  const inviteMutation = useMutation({
    mutationFn: (payload: { email: string; name: string; role: Role }) =>
      invitePlatformUser({
        data: {
          ...payload,
          adminEmail: session?.email,
          adminName: session?.name,
          adminRole: session?.role
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-users"] });
      toast.success("Invite sent! The user will receive an email to join HomeSure.");
      setInviteOpen(false);
      setName("");
      setEmail("");
      setRole("landlord");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to send invite.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) =>
      updatePlatformUser({
        data: {
          ...payload,
          adminEmail: session?.email,
          adminName: session?.name,
          adminRole: session?.role
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-users"] });
      toast.success("User updated successfully!");
      setEditingUser(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update user.");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (payload: any) =>
      resetPlatformUserPassword({
        data: {
          ...payload,
          adminEmail: session?.email,
          adminName: session?.name,
          adminRole: session?.role
        }
      }),
    onSuccess: () => {
      toast.success("Password reset successfully!");
      setResettingUser(null);
      setResetPasswordVal("");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to reset password.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (user: PlatformUser) =>
      deletePlatformUser({
        data: {
          userId: user.userId,
          authUserId: user.authUserId,
          userEmail: user.email,
          adminEmail: session?.email,
          adminName: session?.name,
          adminRole: session?.role
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-users"] });
      toast.success("User removed successfully.");
      setUserToDelete(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to remove user.");
    },
  });

  const resendInviteMutation = useMutation({
    mutationFn: (user: PlatformUser) =>
      invitePlatformUser({
        data: {
          email: user.email,
          name: user.name,
          role: (user.role as Role) || "landlord",
          adminEmail: session?.email,
          adminName: session?.name,
          adminRole: session?.role
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-users"] });
      toast.success("Invite resent successfully.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to resend invite.");
    },
  });

  const updateClosureMutation = useMutation({
    mutationFn: (payload: any) =>
      updatePlatformClosureRequest({
        data: {
          ...payload,
          adminEmail: session?.email,
          adminName: session?.name,
          adminRole: session?.role
        }
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["platform-closure-requests"] });
      queryClient.invalidateQueries({ queryKey: ["platform-users"] });
      toast.success(`Account closure request ${variables.status.toLowerCase()} successfully!`);
      setRejectionRequest(null);
      setRejectionReason("");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update closure request.");
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate({ email, name, role });
  };

  const handleEditSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      userId: editingUser.userId,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as Role,
      status: formData.get("status") as string,
      region: formData.get("region") as string || null,
    });
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !resettingUser.authUserId) return;
    resetPasswordMutation.mutate({
      authUserId: resettingUser.authUserId,
      userEmail: resettingUser.email,
      newPassword: resetPasswordVal
    });
  };

  const handleDelete = () => {
    if (!userToDelete) return;
    deleteMutation.mutate(userToDelete);
  };

  const handleApproveClosure = (req: ClosureRequest) => {
    updateClosureMutation.mutate({
      id: req.id,
      status: "Approved"
    });
  };

  const handleRejectClosureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionRequest) return;
    updateClosureMutation.mutate({
      id: rejectionRequest.id,
      status: "Rejected",
      rejectionReason
    });
  };

  const handleExportClosureCSV = () => {
    if (closureRequests.length === 0) {
      toast.error("No closure requests to export.");
      return;
    }
    const headers = ["ID", "User Email", "User Name", "Role", "Reason", "Status", "Requested At", "Closed At", "Closed By"];
    const rows = closureRequests.map(r => [
      r.id,
      r.userEmail,
      r.userName || "",
      r.role,
      r.reason.replace(/"/g, '""'),
      r.status,
      r.requestedAt,
      r.closedAt || "",
      r.closedBy || ""
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `homesure_closed_accounts_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats
  const active = allUsers.filter((u) => u.status === "Active").length;
  const pending = allUsers.filter((u) => u.status === "Pending").length;
  const invited = allUsers.filter((u) => u.status === "Invited" || u.status === "Expired").length;
  const deactivated = allUsers.filter((u) => u.status === "Deactivated").length;

  // Filtered list
  const filtered =
    statusFilter === "All" ? allUsers : allUsers.filter((u) => u.status === statusFilter);

  const FILTERS: StatusFilter[] = ["All", "Active", "Pending", "Invited", "Deactivated"];

  return (
    <>
      <PageHeader
        title="User role & accounts"
        description="Manage platform users, roles, region assignments, and account closures."
        actions={
          <div className="flex gap-2">
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button size="sm" id="invite-user-btn">
                  <Plus className="mr-2 h-4 w-4" /> Invite user
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite user</DialogTitle>
                  <DialogDescription>
                    Send an email invitation. They will receive a link to set up their account.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleInvite}>
                  <div className="space-y-1.5">
                    <Label htmlFor="invite-name">Full name</Label>
                    <Input
                      id="invite-name"
                      placeholder="Jane Doe"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="jane@company.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Role</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ROLE_LABELS) as Role[])
                          .filter((r) => r !== "super_admin")
                          .map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={inviteMutation.isPending}>
                      {inviteMutation.isPending ? "Sending..." : "Send invite"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Tabs defaultValue="users">
        <TabsList className="bg-slate-100 p-1 rounded-lg mb-4">
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="closures">Closure Requests & Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          {/* Summary stat cards */}
          <div className="grid gap-4 sm:grid-cols-4 mb-6">
            <StatCard label="Total Users" value={String(allUsers.length)} icon={Users} tone="info" />
            <StatCard label="Active Accounts" value={String(active)} icon={UserCheck} tone="success" />
            <StatCard label="Deactivated Accounts" value={String(deactivated)} icon={X} tone="destructive" />
            <StatCard label="Pending / Invited" value={String(pending + invited)} icon={Mail} tone="warning" />
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-1 mb-4 p-1 bg-slate-100 rounded-lg w-fit">
            {FILTERS.map((f) => (
              <button
                key={f}
                id={`filter-${f.toLowerCase()}`}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 text-sm rounded-md transition-all font-medium cursor-pointer ${
                  statusFilter === f
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {f}
                {f !== "All" && (
                  <span className="ml-1.5 text-xs opacity-60">
                    {allUsers.filter((u) => u.status === f).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {isUsersLoading ? (
            <div className="flex h-64 items-center justify-center rounded-md border border-slate-200 bg-white">
              <p className="animate-pulse text-sm text-slate-400">Loading users...</p>
            </div>
          ) : (
            <DataTable
              rows={filtered}
              filterKeys={["name", "email", "role"] as any}
              columns={[
                {
                  key: "name",
                  header: "User",
                  sortable: true,
                  render: (u) => (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback
                          className={`text-xs font-semibold ${
                            u.status === "Invited" || u.status === "Expired"
                              ? "bg-slate-100 text-slate-400"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {u.name
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium text-slate-800">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "role",
                  header: "Role",
                  sortable: true,
                  render: (u) => {
                    const r = (u.role || "").toLowerCase().replace(/ /g, "_") as Role;
                    return (
                      <span className="text-sm text-slate-600 capitalize">
                        {ROLE_LABELS[r] || u.role}
                      </span>
                    );
                  },
                },
                {
                  key: "region",
                  header: "Region",
                  render: (u) => <span className="text-sm text-slate-600">{u.region || "Global"}</span>,
                },
                {
                  key: "joined",
                  header: "Joined / Invited",
                  sortable: true,
                  render: (u) => <span className="text-sm text-slate-500 font-mono text-xs">{u.joined}</span>,
                },
                {
                  key: "status",
                  header: "Status",
                  sortable: true,
                  render: (u) => statusBadge(u.status),
                },
                {
                  key: "actions",
                  header: "",
                  render: (u) => {
                    const isSelf = session?.email.toLowerCase() === u.email.toLowerCase();
                    const isInvited = u.status === "Invited" || u.status === "Expired";

                    return (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" id={`user-actions-${u.email}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingUser(u)}>
                            <Eye className="mr-2 h-4 w-4 text-slate-500" />
                            View details
                          </DropdownMenuItem>
                          
                          {!isInvited && (
                            <DropdownMenuItem onClick={() => setEditingUser(u)}>
                              <Pencil className="mr-2 h-4 w-4 text-slate-500" />
                              Edit account
                            </DropdownMenuItem>
                          )}
                          
                          {u.authUserId && (
                            <DropdownMenuItem onClick={() => setResettingUser(u)}>
                              <Lock className="mr-2 h-4 w-4 text-slate-500" />
                              Reset password
                            </DropdownMenuItem>
                          )}

                          {isInvited && (
                            <>
                              <DropdownMenuItem
                                onClick={() => resendInviteMutation.mutate(u)}
                                disabled={resendInviteMutation.isPending}
                              >
                                <RefreshCw className="mr-2 h-4 w-4 text-slate-500" />
                                Resend invite
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}

                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            disabled={isSelf}
                            onClick={() => !isSelf && setUserToDelete(u)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isSelf ? "Cannot remove yourself" : "Remove user"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  },
                },
              ]}
            />
          )}
        </TabsContent>

        <TabsContent value="closures">
          <Card className="border border-slate-200 shadow-sm bg-white rounded-xl mb-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-800">Closed Account Reports</CardTitle>
              <Button size="sm" variant="outline" onClick={handleExportClosureCSV}>
                <FileDown className="mr-2 h-4 w-4" /> Export CSV Report
              </Button>
            </CardHeader>
            <CardContent>
              {isClosuresLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <p className="animate-pulse text-sm text-slate-400">Loading closure reports...</p>
                </div>
              ) : (
                <DataTable
                  rows={closureRequests}
                  filterKeys={["userEmail", "userName", "status"]}
                  columns={[
                    { key: "userEmail", header: "User Email", render: (r) => <div><div className="font-medium text-slate-800">{r.userName || "—"}</div><div className="text-xs text-slate-500">{r.userEmail}</div></div> },
                    { key: "role", header: "Role", render: (r) => <span className="capitalize">{r.role}</span> },
                    { key: "reason", header: "Closure Reason", width: "250px", render: (r) => <span className="text-xs text-slate-600 line-clamp-2">{r.reason}</span> },
                    { key: "requestedAt", header: "Requested Date", render: (r) => <span className="font-mono text-xs text-slate-500">{r.requestedAt}</span> },
                    { 
                      key: "status", 
                      header: "Status", 
                      render: (r) => {
                        if (r.status === "Approved") return <Badge className="bg-emerald-100 text-emerald-700 border-0">Closed</Badge>;
                        if (r.status === "Rejected") return <Badge className="bg-red-100 text-red-700 border-0">Rejected</Badge>;
                        return <Badge className="bg-amber-100 text-amber-700 border-0">Pending Review</Badge>;
                      }
                    },
                    {
                      key: "actions",
                      header: "",
                      render: (r) => {
                        if (r.status !== "Pending") return <span className="text-xs text-slate-400 font-mono">By {r.closedBy || "admin"}</span>;
                        return (
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-emerald-50 hover:text-emerald-600 text-slate-500" onClick={() => handleApproveClosure(r)}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-red-50 hover:text-red-600 text-slate-500" onClick={() => setRejectionRequest(r)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      }
                    }
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Modal */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Platform Account</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleEditSave} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Full name</Label>
                <Input id="edit-name" name="name" defaultValue={editingUser.name} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" name="email" defaultValue={editingUser.email} type="email" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select name="role" defaultValue={editingUser.role}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="status" defaultValue={editingUser.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Deactivated">Deactivated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="edit-region">Assigned Region</Label>
                <Input id="edit-region" name="region" placeholder="e.g. California, Region East" defaultValue={editingUser.region || ""} />
                <p className="text-[10px] text-muted-foreground">Specifically maps operational region for Service Admins.</p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewingUser} onOpenChange={(open) => !open && setViewingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account details</DialogTitle>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b pb-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-blue-50 text-blue-600 text-sm font-semibold">
                    {viewingUser.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-slate-800 text-lg">{viewingUser.name}</div>
                  <div className="text-sm text-slate-500">{viewingUser.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-slate-500">Platform ID</span>
                <span className="font-mono text-xs">{viewingUser.userId}</span>
                
                <span className="text-slate-500">Auth User ID</span>
                <span className="font-mono text-xs text-slate-600 break-all">{viewingUser.authUserId || "Not registered yet"}</span>
                
                <span className="text-slate-500">Platform Role</span>
                <span className="font-medium capitalize">{viewingUser.role.replace("_", " ")}</span>
                
                <span className="text-slate-500">Assigned Region</span>
                <span className="font-medium">{viewingUser.region || "Global / Unassigned"}</span>
                
                <span className="text-slate-500">Creation Date</span>
                <span className="font-mono text-xs">{viewingUser.joined}</span>
                
                <span className="text-slate-500">Account Status</span>
                <span>{statusBadge(viewingUser.status)}</span>
              </div>
              <DialogFooter className="pt-2">
                <Button onClick={() => setViewingUser(null)}>Close details</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resettingUser} onOpenChange={(open) => !open && setResettingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Account Password</DialogTitle>
            <DialogDescription>
              Directly set a new login password for user <span className="font-medium text-slate-900">{resettingUser?.email}</span>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reset-pwd">New Temporary Password</Label>
              <Input 
                id="reset-pwd" 
                value={resetPasswordVal} 
                onChange={(e) => setResetPasswordVal(e.target.value)} 
                placeholder="At least 6 characters" 
                required 
                minLength={6}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResettingUser(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={resetPasswordMutation.isPending} className="bg-blue-600 text-white">
                {resetPasswordMutation.isPending ? "Resetting..." : "Reset password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rejection Reason Modal */}
      <Dialog open={!!rejectionRequest} onOpenChange={(open) => !open && setRejectionRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Closure Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRejectClosureSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rej-reason">Rejection Reason</Label>
              <Textarea id="rej-reason" required value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Explain why account closure request is rejected..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRejectionRequest(null)}>Cancel</Button>
              <Button type="submit" disabled={updateClosureMutation.isPending} className="bg-red-600 text-white">Reject Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User AlertDialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" " }
              <span className="font-medium text-foreground">{userToDelete?.name}</span> (
              {userToDelete?.email}) from the platform. They will no longer be able to sign in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Removing..." : "Remove user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
