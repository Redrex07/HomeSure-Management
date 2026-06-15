import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { appointments } from "@/shared/utils/mock-data";
import { Plus, Calendar as CalIcon, Clock, MapPin } from "lucide-react";

export const Route = createFileRoute("/app/appointments")({
  head: () => ({ meta: [{ title: "Appointments — HomeSure" }] }),
  component: AppointmentsPage,
});

function AppointmentsPage() {
  // Mock calendar: week strip
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const dates = [1,2,3,4,5,6,7];

  return (
    <>
      <PageHeader title="Appointments" description="Schedule and manage service visits." actions={<Button size="sm"><Plus className="mr-2 h-4 w-4" /> New appointment</Button>} />

      <Card className="border-border/70 shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">June 2026 · This week</CardTitle>
          <div className="flex gap-1">
            <Button variant="outline" size="sm">Today</Button>
            <Button variant="outline" size="sm">Week</Button>
            <Button variant="outline" size="sm">Month</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {days.map((d, i) => (
              <div key={d} className="rounded-lg border border-border bg-background p-3">
                <div className="text-xs font-medium text-muted-foreground">{d}</div>
                <div className="mt-1 text-2xl font-bold tracking-tight">{dates[i]}</div>
                <div className="mt-3 space-y-1">
                  {appointments.filter((_, idx) => idx % 7 === i % appointments.length).slice(0, 2).map(a => (
                    <div key={a.id + i} className="rounded-md border border-primary/30 bg-primary-soft px-1.5 py-1 text-[10px] text-primary">
                      <div className="truncate font-medium">{a.time}</div>
                      <div className="truncate">{a.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {appointments.map((a) => (
          <Card key={a.id} className="border-border/70 shadow-card">
            <CardContent className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <CalIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">{a.title}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><CalIcon className="h-3 w-3" />{a.date}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{a.time}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{a.property}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={a.status} />
                <Button variant="outline" size="sm">Reschedule</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
