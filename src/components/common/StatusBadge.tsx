import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const map: Record<string, string> = {
  Active: "bg-success/10 text-success border-success/20",
  Paid: "bg-success/10 text-success border-success/20",
  Approved: "bg-success/10 text-success border-success/20",
  Completed: "bg-success/10 text-success border-success/20",
  Resolved: "bg-success/10 text-success border-success/20",
  Occupied: "bg-success/10 text-success border-success/20",

  Pending: "bg-warning/15 text-warning-foreground border-warning/30",
  "In Progress": "bg-info/10 text-info border-info/20",
  Assigned: "bg-info/10 text-info border-info/20",
  Scheduled: "bg-info/10 text-info border-info/20",
  Trial: "bg-info/10 text-info border-info/20",
  Onboarding: "bg-info/10 text-info border-info/20",
  Listed: "bg-info/10 text-info border-info/20",
  Open: "bg-info/10 text-info border-info/20",
  Draft: "bg-muted text-muted-foreground border-border",

  Vacant: "bg-muted text-muted-foreground border-border",
  Maintenance: "bg-warning/15 text-warning-foreground border-warning/30",
  Invited: "bg-warning/15 text-warning-foreground border-warning/30",

  Overdue: "bg-destructive/10 text-destructive border-destructive/20",
  "Past Due": "bg-destructive/10 text-destructive border-destructive/20",
  Urgent: "bg-destructive/10 text-destructive border-destructive/20",
  High: "bg-destructive/10 text-destructive border-destructive/20",
  Medium: "bg-warning/15 text-warning-foreground border-warning/30",
  Low: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ value, className }: { value: string; className?: string }) {
  const cls = map[value] ?? "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={cn("font-medium", cls, className)}>
      <span className={cn("mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80")} />
      {value}
    </Badge>
  );
}
