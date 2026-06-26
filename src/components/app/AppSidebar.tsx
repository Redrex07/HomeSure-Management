import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Building2, Users, Wrench, HardHat, Calendar, FileSpreadsheet,
  Receipt, LifeBuoy, Bell, BarChart3, Shield, CreditCard, FileText, ScrollText,
  Megaphone, Settings, Home,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/brand/Logo";
import type { Role } from "@/lib/roles";
import { useSession } from "@/lib/auth-store";
import { ROLE_LABELS } from "@/lib/roles";
import { Badge } from "@/components/ui/badge";

type Item = { title: string; url: string; icon: any };

const COMMON: Item[] = [
  { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard },
];

const NAV_BY_ROLE: Record<Role, { label: string; items: Item[] }[]> = {
  super_admin: [
    { label: "Overview", items: COMMON },
    { label: "Platform", items: [
      { title: "Users", url: "/app/users", icon: Users },
      { title: "Subscriptions", url: "/app/subscriptions", icon: CreditCard },
      { title: "Properties", url: "/app/properties", icon: Building2 },
      { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
      { title: "Audit Logs", url: "/app/audit-logs", icon: ScrollText },
    ]},
    { label: "Operations", items: [
      { title: "Service Requests", url: "/app/service-requests", icon: Wrench },
      { title: "Support Tickets", url: "/app/support", icon: LifeBuoy },
    ]},
  ],
  service_admin: [
    { label: "Overview", items: COMMON },
    { label: "Operations", items: [
      { title: "Service Requests", url: "/app/service-requests", icon: Wrench },
      { title: "Contractors", url: "/app/contractors", icon: HardHat },
      { title: "Appointments", url: "/app/appointments", icon: Calendar },
      { title: "Estimates", url: "/app/estimates", icon: FileSpreadsheet },
      { title: "Invoices", url: "/app/invoices", icon: Receipt },
      { title: "Support Tickets", url: "/app/support", icon: LifeBuoy },
    ]},
  ],
  landlord: [
    { label: "Overview", items: COMMON },
    { label: "Portfolio", items: [
      { title: "Properties", url: "/app/properties", icon: Building2 },
      { title: "Tenants", url: "/app/tenants", icon: Users },
      { title: "Leases", url: "/app/leases", icon: FileText },
      { title: "Rent Collection", url: "/app/invoices", icon: Receipt },
    ]},
    { label: "Services", items: [
      { title: "Maintenance", url: "/app/service-requests", icon: Wrench },
      { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
      { title: "Subscription", url: "/app/subscriptions", icon: CreditCard },
    ]},
  ],
  tenant: [
    { label: "My Home", items: COMMON },
    { label: "Activity", items: [
      { title: "Rent Payments", url: "/app/invoices", icon: Receipt },
      { title: "Maintenance", url: "/app/service-requests", icon: Wrench },
      { title: "Appointments", url: "/app/appointments", icon: Calendar },
      { title: "Lease Documents", url: "/app/leases", icon: FileText },
      { title: "Notifications", url: "/app/notifications", icon: Bell },
    ]},
  ],
  contractor: [
    { label: "Workspace", items: COMMON },
    { label: "Jobs", items: [
      { title: "Assigned Jobs", url: "/app/service-requests", icon: Wrench },
      { title: "Appointments", url: "/app/appointments", icon: Calendar },
      { title: "Estimates", url: "/app/estimates", icon: FileSpreadsheet },
      { title: "Invoices", url: "/app/invoices", icon: Receipt },
    ]},
  ],
  realtor: [
    { label: "Overview", items: COMMON },
    { label: "Listings", items: [
      { title: "Properties", url: "/app/properties", icon: Building2 },
      { title: "Listing Analytics", url: "/app/analytics", icon: BarChart3 },
      { title: "Tenant Onboarding", url: "/app/tenants", icon: Users },
    ]},
  ],
};

export function AppSidebar() {
  const session = useSession();
  const role: Role = session?.role ?? "landlord";
  const groups = NAV_BY_ROLE[role];
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const isActive = (url: string) => path === url || path.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <Link to="/app/dashboard" className="flex items-center">
          <Logo showText={!collapsed} />
        </Link>
        {!collapsed && (
          <Badge variant="outline" className="mt-2 w-fit border-primary/30 bg-primary-soft text-[10px] font-medium uppercase tracking-wider text-primary">
            {ROLE_LABELS[role]}
          </Badge>
        )}
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link to="/app/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to site">
              <Link to="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span>Back to site</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
