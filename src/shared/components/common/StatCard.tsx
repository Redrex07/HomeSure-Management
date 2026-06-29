import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/utils";
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
  default: "bg-blue-50 text-blue-600 border border-blue-100",
  success: "bg-green-50 text-green-600 border border-green-100",
  warning: "bg-amber-50 text-amber-600 border border-amber-100",
  destructive: "bg-red-50 text-red-600 border border-red-100",
  info: "bg-sky-50 text-sky-600 border border-sky-100",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  hint,
  tone = "default",
}: StatCardProps) {
  const up = (delta ?? 0) >= 0;
  return (
    <Card className="border border-slate-200 bg-white rounded-xl shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </div>
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shadow-sm", toneMap[tone])}>
            <Icon className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
          {(delta !== undefined || hint) && (
            <div className="mt-3 flex items-center gap-2 text-xs font-medium">
              {delta !== undefined && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 border",
                    up ? "bg-green-50 text-green-700 border-green-200/50" : "bg-red-50 text-red-700 border-red-200/50",
                  )}
                >
                  {up ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(delta)}%
                </span>
              )}
              {hint && <span className="text-slate-400 font-normal">{hint}</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
