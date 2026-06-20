import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataTable } from "@/shared/components/common/DataTable";
import { useQuery } from "@tanstack/react-query";
import { getSupportTickets } from "@/core/db/supabase-queries";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/app/support")({
  head: () => ({ meta: [{ title: "Support — HomeSure" }] }),
  component: SupportPage,
});

function SupportPage() {
  const { data: ticketList = [], isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: getSupportTickets,
  });

  return (
    <>
      <PageHeader
        title="Support tickets"
        description="Customer support queue and resolutions."
        actions={
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" /> New ticket
          </Button>
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
          ]}
        />
      )}
    </>
  );
}

