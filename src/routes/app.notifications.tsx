import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { notifications as seed } from "@/shared/utils/mock-data";
import { Check, Bell } from "lucide-react";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — HomeSure" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const [notes, setNotes] = useState(seed);
  return (
    <>
      <PageHeader
        title="Notifications"
        description="All recent activity in your workspace."
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() => setNotes(notes.map((n) => ({ ...n, read: true })))}
          >
            <Check className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        }
      />
      <Card className="border-border/70 shadow-card">
        <CardContent className="divide-y divide-border p-0">
          {notes.map((n) => (
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
