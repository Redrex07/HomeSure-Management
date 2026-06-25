import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataTable } from "@/shared/components/common/DataTable";
import { Plus, MoreHorizontal } from "lucide-react";
import { useUsers } from "@/features/auth/store/users-store";
import { ROLE_LABELS, type Role } from "@/features/auth/utils/roles";

export const Route = createFileRoute("/app/users")({
  head: () => ({ meta: [{ title: "Users — HomeSure" }] }),
  component: UsersPage,
});

function UsersPage() {
  const allUsers = useUsers();

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage platform users and roles."
        actions={
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" /> Invite user
          </Button>
        }
      />

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
                  <AvatarFallback className="bg-primary-soft text-xs text-primary font-semibold">
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
            render: () => (
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            ),
          },
        ]}
      />
    </>
  );
}
