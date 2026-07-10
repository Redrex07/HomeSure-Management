import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { DataTable } from "@/shared/components/common/DataTable";
import { useQuery } from "@tanstack/react-query";
import { fetchPlatformAuditLogs } from "@/core/api/users.functions";
import { Badge } from "@/shared/components/ui/badge";

export const Route = createFileRoute("/app/audit-logs")({
  head: () => ({ meta: [{ title: "Audit Logs — HomeSure" }] }),
  component: AuditPage,
});

function AuditPage() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["platform-audit-logs"],
    queryFn: () => fetchPlatformAuditLogs(),
    refetchOnWindowFocus: false,
  });

  return (
    <>
      <PageHeader title="Audit logs" description="A complete record of platform email dispatch activity." />
      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-md border border-border/60 bg-background/50">
          <p className="animate-pulse text-sm text-muted-foreground">Loading audit logs...</p>
        </div>
      ) : (
        <DataTable
          rows={logs}
          filterKeys={["action", "actor"]}
          columns={[
            {
              key: "time",
              header: "Time",
              render: (l) => <span className="font-mono text-xs text-muted-foreground">{l.time}</span>,
            },
            { key: "actor", header: "Recipient" },
            {
              key: "action",
              header: "Action / Description",
              render: (l) => <span className="text-sm font-medium">{l.action}</span>,
            },
            {
              key: "status",
              header: "Status",
              render: (l) => {
                const isSent = l.status === "sent";
                return (
                  <Badge 
                    className={
                      isSent 
                        ? "bg-emerald-100 text-emerald-700 border-0" 
                        : "bg-red-100 text-red-700 border-0"
                    }
                  >
                    {l.status}
                  </Badge>
                );
              }
            },
          ]}
        />
      )}
    </>
  );
}
