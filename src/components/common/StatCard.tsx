import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: number;
  hint?: string;
  tone?: "default" | "success" | "warning" | "destructive" | "info";
}

const toneMap: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
};

export function StatCard({ label, value, icon: Icon, delta, hint, tone = "default" }: StatCardProps) {
  const up = (delta ?? 0) >= 0;
  return (
    <Card className="border-border/70 shadow-card transition-shadow hover:shadow-elegant">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
            {(delta !== undefined || hint) && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                {delta !== undefined && (
                  <span className={cn("inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
                    up ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                    {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(delta)}%
                  </span>
                )}
                {hint && <span className="text-muted-foreground">{hint}</span>}
              </div>
            )}
          </div>
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", toneMap[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
