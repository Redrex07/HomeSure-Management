import { cn } from "@/shared/utils/utils";
import { Badge } from "@/shared/components/ui/badge";

const map: Record<string, string> = {
  Active: "bg-green-50 text-green-700 border-green-200/65",
  Paid: "bg-green-50 text-green-700 border-green-200/65",
  Approved: "bg-green-50 text-green-700 border-green-200/65",
  Completed: "bg-green-50 text-green-700 border-green-200/65",
  Resolved: "bg-green-50 text-green-700 border-green-200/65",
  Occupied: "bg-green-50 text-green-700 border-green-200/65",

  Pending: "bg-amber-50 text-amber-700 border-amber-200/65",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200/65",
  Assigned: "bg-blue-50 text-blue-700 border-blue-200/65",
  Scheduled: "bg-blue-50 text-blue-700 border-blue-200/65",
  Trial: "bg-blue-50 text-blue-700 border-blue-200/65",
  Onboarding: "bg-blue-50 text-blue-700 border-blue-200/65",
  Listed: "bg-blue-50 text-blue-700 border-blue-200/65",
  Open: "bg-blue-50 text-blue-700 border-blue-200/65",
  Draft: "bg-slate-100 text-slate-600 border-slate-200",

  Vacant: "bg-slate-100 text-slate-600 border-slate-200",
  Maintenance: "bg-amber-50 text-amber-700 border-amber-200/65",
  Invited: "bg-amber-50 text-amber-700 border-amber-200/65",

  Overdue: "bg-red-50 text-red-700 border-red-200/65",
  "Past Due": "bg-red-50 text-red-700 border-red-200/65",
  Urgent: "bg-red-50 text-red-700 border-red-200/65",
  High: "bg-red-50 text-red-700 border-red-200/65",
  Medium: "bg-amber-50 text-amber-700 border-amber-200/65",
  Low: "bg-slate-100 text-slate-600 border-slate-200",
};

export function StatusBadge({ value, className }: { value: string; className?: string }) {
  const cls = map[value] ?? "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <Badge variant="outline" className={cn("font-semibold rounded-full text-xs px-2.5 py-0.5 border shadow-sm", cls, className)}>
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-90" />
      {value}
    </Badge>
  );
}
