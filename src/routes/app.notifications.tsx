import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { notifications as seed } from "@/shared/utils/mock-data";
import { Check, Bell } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenantContext } from "@/features/tenant/hooks/useTenantContext";
import { getTenantNotifications, markAllTenantNotificationsRead } from "@/core/db/supabase-queries";
import { toast } from "sonner";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — HomeSure" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const [notes, setNotes] = useState(seed);
  const queryClient = useQueryClient();
  const tenantContext = useTenantContext();
  const { data: tenantNotes = [] } = useQuery({
    queryKey: ["tenant-notifications", tenantContext.tenantId],
    queryFn: () => getTenantNotifications(tenantContext.tenantId!),
    enabled: tenantContext.isTenant && !!tenantContext.tenantId,
  });
  const visibleNotes = tenantContext.isTenant && tenantNotes.length > 0 ? tenantNotes : notes;
  const markAllMutation = useMutation({
    mutationFn: () => markAllTenantNotificationsRead(tenantContext.tenantId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-notifications", tenantContext.tenantId] });
      toast.success("Notifications marked read");
    },
    onError: (err: any) => toast.error("Could not update notifications: " + (err.message || String(err))),
  });
  const markAllRead = () => {
    if (tenantContext.isTenant && tenantContext.tenantId) {
      markAllMutation.mutate();
      return;
    }
    setNotes(notes.map((n) => ({ ...n, read: true })));
  };
  return (
    <>
      <PageHeader
        title="Notifications"
        description="All recent activity in your workspace."
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={markAllRead}
          >
            <Check className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        }
      />
      <Card className="border-border/70 shadow-card">
        <CardContent className="divide-y divide-border p-0">
          {visibleNotes.map((n) => (
            <div key={n.id} className={`flex gap-4 p-4 ${!n.read ? "bg-primary-soft/30" : ""}`}>
              <div
                className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${!n.read ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{n.title}</div>
                  <div className="text-xs text-muted-foreground">{n.time}</div>
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">{n.body}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
