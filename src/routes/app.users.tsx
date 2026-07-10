import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { DataTable } from "@/shared/components/common/DataTable";
import { StatCard } from "@/shared/components/common/StatCard";
import { Plus, MoreHorizontal, Trash2, RefreshCw, Users, UserCheck, Clock, Mail } from "lucide-react";
import { ROLE_LABELS, type Role } from "@/features/auth/utils/roles";
import { getPlatformUsers, type PlatformUser } from "@/core/db/supabase-queries";
import { invitePlatformUser, deletePlatformUser } from "@/core/api/users.functions";
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
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
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

type StatusFilter = "All" | "Active" | "Pending" | "Invited" | "Expired";

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
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

function UsersPage() {
  const session = useSession();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("landlord");
  const [userToDelete, setUserToDelete] = useState<PlatformUser | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ["platform-users"],
    queryFn: getPlatformUsers,
    refetchOnWindowFocus: false,
  });

  const inviteMutation = useMutation({
    mutationFn: (payload: { email: string; name: string; role: Role }) =>
      invitePlatformUser({ data: payload }),
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

  const deleteMutation = useMutation({
    mutationFn: (user: PlatformUser) =>
      deletePlatformUser({
        data: { userId: user.userId, authUserId: user.authUserId },
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
        data: { email: user.email, name: user.name, role: (user.role as Role) || "landlord" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-users"] });
      toast.success("Invite resent successfully.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to resend invite.");
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate({ email, name, role });
  };

  const handleDelete = () => {
    if (!userToDelete) return;
    deleteMutation.mutate(userToDelete);
  };

  // Stats
  const active = allUsers.filter((u) => u.status === "Active").length;
  const pending = allUsers.filter((u) => u.status === "Pending").length;
  const invited = allUsers.filter((u) => u.status === "Invited" || u.status === "Expired").length;

  // Filtered list
  const filtered =
    statusFilter === "All" ? allUsers : allUsers.filter((u) => u.status === statusFilter);

  const FILTERS: StatusFilter[] = ["All", "Active", "Pending", "Invited", "Expired"];

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage platform users, invitations and roles."
        actions={
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
        }
      />

      {/* Summary stat cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard
          label="Total users"
          value={String(allUsers.length)}
          icon={Users}
          tone="info"
        />
        <StatCard
          label="Active"
          value={String(active)}
          icon={UserCheck}
          tone="success"
        />
        <StatCard
          label="Pending / Invited"
          value={String(pending + invited)}
          icon={Mail}
          tone="warning"
        />
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-muted rounded-lg w-fit">
        {FILTERS.map((f) => (
          <button
            key={f}
            id={`filter-${f.toLowerCase()}`}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-md transition-all font-medium ${
              statusFilter === f
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
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

      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-md border border-border/60 bg-background/50">
          <p className="animate-pulse text-sm text-muted-foreground">Loading users...</p>
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
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/10 text-primary"
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
                    <div className="text-sm font-medium text-foreground">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                </div>
              ),
            },
            {
              key: "role",
              header: "Role",
              render: (u) => {
                const r = (u.role || "").toLowerCase().replace(/ /g, "_") as Role;
                return (
                  <span className="text-sm text-muted-foreground">
                    {ROLE_LABELS[r] || u.role}
                  </span>
                );
              },
            },
            {
              key: "joined",
              header: "Joined / Invited",
              render: (u) => <span className="text-sm text-muted-foreground">{u.joined}</span>,
            },
            {
              key: "status",
              header: "Status",
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
                      {isInvited && (
                        <>
                          <DropdownMenuItem
                            onClick={() => resendInviteMutation.mutate(u)}
                            disabled={resendInviteMutation.isPending}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
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

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
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
