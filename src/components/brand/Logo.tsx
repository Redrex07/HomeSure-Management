import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-elegant">
        <Home className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
      </div>
      {showText && (
        <div className="leading-none">
          <div className="text-sm font-semibold tracking-tight text-foreground">HomeSure</div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Management</div>
        </div>
      )}
    </div>
  );
}
