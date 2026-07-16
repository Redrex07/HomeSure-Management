import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { notifications as seed } from "@/shared/utils/mock-data";
import { Check, Bell, Filter } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenantContext } from "@/features/tenant/hooks/useTenantContext";
import { getTenantNotifications, markAllTenantNotificationsRead } from "@/core/db/supabase-queries";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — HomeSure" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const [notes, setNotes] = useState(seed);
  const [filter, setFilter] = useState("all");
  const [hideExpired, setHideExpired] = useState(false);

  const queryClient = useQueryClient();
  const tenantContext = useTenantContext();
  const { data: tenantNotes = [] } = useQuery({
    queryKey: ["tenant-notifications", tenantContext.tenantId],
    queryFn: () => getTenantNotifications(tenantContext.tenantId!),
    enabled: tenantContext.isTenant && !!tenantContext.tenantId,
  });

  const baseNotes = tenantContext.isTenant && tenantNotes.length > 0 ? tenantNotes : notes;
  
  const unreadCount = baseNotes.filter((n) => !n.read).length;

  const visibleNotes = baseNotes.filter((n) => {
    if (filter === "unread" && n.read) return false;
    if (filter === "read" && !n.read) return false;
    
    // Mock hide expired
    if (hideExpired) {
      // If there's an actual expires_at, compare. Otherwise mock it by filtering out older than some threshold, or we just randomly filter for demo.
      // We will pretend anything with an id < 5 is expired for demo if no expires_at exists.
      const isExpired = (n as any).expires_at ? new Date((n as any).expires_at) < new Date() : (Number(n.id) < 3);
      if (isExpired) return false;
    }
    
    return true;
  });

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
        description={`All recent activity in your workspace. You have ${unreadCount} unread.`}
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            <Check className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        }
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>All</Button>
          <Button variant={filter === "unread" ? "default" : "outline"} size="sm" onClick={() => setFilter("unread")}>
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </Button>
          <Button variant={filter === "read" ? "default" : "outline"} size="sm" onClick={() => setFilter("read")}>Read</Button>
        </div>
        <div className="flex items-center space-x-2 bg-card p-2 rounded-md border border-border/70 shadow-sm w-full sm:w-auto">
          <Switch id="hide-expired" checked={hideExpired} onCheckedChange={setHideExpired} />
          <Label htmlFor="hide-expired" className="text-sm">Hide Expired</Label>
        </div>
      </div>

      <Card className="border-border/70 shadow-card">
        <CardContent className="divide-y divide-border p-0">
          {visibleNotes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No notifications found matching your filters.
            </div>
          ) : (
            visibleNotes.map((n) => (
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
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
