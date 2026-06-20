import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DataTable } from "@/components/common/DataTable";
import { Plus, MoreHorizontal, Check, X, ShieldAlert } from "lucide-react";
import { useUsers, approveUser, declineUser } from "@/lib/users-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import { toast } from "sonner";

export const Route = createFileRoute("/app/users")({
  head: () => ({ meta: [{ title: "Users — HomeSure" }] }),
  component: UsersPage,
});

function UsersPage() {
  const allUsers = useUsers();

  // Split users into active and pending
  const pendingUsers = allUsers.filter((u) => u.status === "Pending");
  const activeUsers = allUsers.filter((u) => u.status !== "Pending");

  const handleApprove = (id: string, name: string) => {
    approveUser(id);
    toast.success(`Approved registration for ${name}`);
  };

  const handleDecline = (id: string, name: string) => {
    declineUser(id);
    toast.error(`Declined registration for ${name}`);
  };

  return (
    <>
      <PageHeader 
        title="Users" 
        description="Manage platform users, roles and registration approvals." 
        actions={<Button size="sm"><Plus className="mr-2 h-4 w-4" /> Invite user</Button>} 
      />

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="active" className="text-sm">
            Active Users
            <span className="ml-2 rounded-full bg-muted-foreground/15 px-2 py-0.5 text-xs text-muted-foreground">
              {activeUsers.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-sm relative">
            Pending Approvals
            {pendingUsers.length > 0 ? (
              <span className="ml-2 rounded-full bg-destructive text-destructive-foreground px-2 py-0.5 text-xs animate-pulse">
                {pendingUsers.length}
              </span>
            ) : (
              <span className="ml-2 rounded-full bg-muted-foreground/15 px-2 py-0.5 text-xs text-muted-foreground">
                0
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <DataTable
            rows={activeUsers}
            filterKeys={["name", "email", "role"] as any}
            columns={[
              { key: "name", header: "User", sortable: true, render: (u) => (
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary-soft text-xs text-primary font-semibold">
                      {u.name.split(" ").map(w=>w[0]).slice(0,2).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium text-foreground">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                </div>
              )},
              { key: "role", header: "Role", render: (u) => {
                const r = (u.role || "").toLowerCase().replace(" ", "_") as Role;
                return ROLE_LABELS[r] || u.role;
              }},
              { key: "joined", header: "Joined" },
              { key: "status", header: "Status", render: (u) => <StatusBadge value={u.status} /> },
              { key: "actions", header: "", render: () => (
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              )},
            ]}
          />
        </TabsContent>

        <TabsContent value="pending">
          {pendingUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-xl p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary mb-4">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">All caught up!</h3>
              <p className="mt-1 text-sm text-muted-foreground">There are no pending user registration approval requests at this time.</p>
            </div>
          ) : (
            <DataTable
              rows={pendingUsers}
              filterKeys={["name", "email", "role"] as any}
              columns={[
                { key: "name", header: "Requested By", sortable: true, render: (u) => (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-warning/10 text-xs text-warning font-semibold">
                        {u.name.split(" ").map(w=>w[0]).slice(0,2).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium text-foreground">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                  </div>
                )},
                { key: "role", header: "Requested Role", render: (u) => {
                  const r = (u.role || "").toLowerCase().replace(" ", "_") as Role;
                  return (
                    <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground">
                      {ROLE_LABELS[r] || u.role}
                    </span>
                  );
                }},
                { key: "joined", header: "Request Date" },
                { key: "status", header: "Status", render: (u) => (
                  <div className="flex items-center gap-1.5 text-xs text-warning font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-warning animate-ping" />
                    Awaiting Verification
                  </div>
                )},
                { key: "actions", header: "Actions", render: (u) => (
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 border-success/30 bg-success/5 text-success hover:bg-success hover:text-success-foreground transition-all gap-1.5"
                      onClick={() => handleApprove(u.id, u.name)}
                    >
                      <Check className="h-3.5 w-3.5" /> Allow
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all gap-1.5"
                      onClick={() => handleDecline(u.id, u.name)}
                    >
                      <X className="h-3.5 w-3.5" /> Decline
                    </Button>
                  </div>
                )},
              ]}
            />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
