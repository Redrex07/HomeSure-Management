import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataTable } from "@/shared/components/common/DataTable";
import { Plus, MoreHorizontal, Trash2 } from "lucide-react";
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

function UsersPage() {
  const session = useSession();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("landlord");
  const [userToDelete, setUserToDelete] = useState<PlatformUser | null>(null);

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ["platform-users"],
    queryFn: getPlatformUsers,
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

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate({ email, name, role });
  };

  const handleDelete = () => {
    if (!userToDelete) return;
    deleteMutation.mutate(userToDelete);
  };

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage platform users and roles."
        actions={
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
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
                      {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
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

      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-md border border-border/60 bg-background/50">
          <p className="animate-pulse text-sm text-muted-foreground">Loading users...</p>
        </div>
      ) : (
        <DataTable
          rows={allUsers}
          filterKeys={["name", "email", "role"] as any}
          columns={[
            {
              key: "name",
              header: "User",
              sortable: true,
              render: (u) => (
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary">
                      {u.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
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
                const r = (u.role || "").toLowerCase().replace(" ", "_") as Role;
                return ROLE_LABELS[r] || u.role;
              },
            },
            { key: "joined", header: "Joined" },
            {
              key: "status",
              header: "Status",
              render: (u) => <StatusBadge value={u.status} />,
            },
            {
              key: "actions",
              header: "",
              render: (u) => {
                const isSelf =
                  session?.email.toLowerCase() === u.email.toLowerCase();

                return (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        disabled={isSelf}
                        onClick={() => setUserToDelete(u)}
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
