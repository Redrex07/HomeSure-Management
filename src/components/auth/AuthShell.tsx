import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { CheckCircle2 } from "lucide-react";

export function AuthShell({ title, subtitle, children, footer }: {
  title: string; subtitle?: string; children: ReactNode; footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link to="/"><Logo /></Link>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
            <div className="mt-7">{children}</div>
            {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
          </div>
        </div>
        <div className="text-center text-xs text-muted-foreground">© 2026 HomeSure Management</div>
      </div>
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-info p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_top_right,oklch(1_0_0_/_0.18),transparent_50%)]" />
        <div className="relative">
          <div className="text-xs font-semibold uppercase tracking-widest opacity-80">The HomeSure platform</div>
          <h2 className="mt-3 text-3xl font-bold leading-tight">
            One workspace for properties, tenants, contractors and warranty.
          </h2>
        </div>
        <ul className="relative space-y-3 text-sm">
          {[
            "Six tailored role-based dashboards",
            "Real-time service request workflow",
            "Built-in invoicing & rent collection",
            "Audit logs and SOC-2 ready controls",
          ].map((b) => (
            <li key={b} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> {b}
            </li>
          ))}
        </ul>
        <div className="relative rounded-xl border border-primary-foreground/20 bg-primary-foreground/5 p-4 backdrop-blur">
          <p className="text-sm italic">"HomeSure replaced four different tools for our team. Onboarding tenants takes minutes."</p>
          <div className="mt-3 text-xs opacity-80">— Priya Raman, Landlord with 22 units</div>
        </div>
      </div>
    </div>
  );
}
