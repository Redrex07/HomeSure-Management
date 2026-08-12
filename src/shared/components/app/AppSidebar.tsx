import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard,
  Building2,
  Users,
  Wrench,
  HardHat,
  Calendar,
  FileSpreadsheet,
  Receipt,
  LifeBuoy,
  Bell,
  BarChart3,
  Shield,
  CreditCard,
  FileText,
  ClipboardCheck,
  ScrollText,
  Megaphone,
  Settings,
  Home, Heart, MessageSquare, FileCheck, Star } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared/components/ui/sidebar";
import { Logo } from "@/shared/components/brand/Logo";
import type { Role } from "@/features/auth/utils/roles";
import { useSession } from "@/features/auth/store/auth-store";
import { ROLE_LABELS } from "@/features/auth/utils/roles";
import { Badge } from "@/shared/components/ui/badge";

type Item = { title: string; url: string; icon: React.ComponentType<{ className?: string }>; hidden?: boolean };

export const COMMON: Item[] = [{ title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard }];

export const NAV_BY_ROLE: Record<Role, { label: string; items: Item[] }[]> = {
  super_admin: [
    { label: "Overview", items: COMMON },
    {
      label: "Platform",
      items: [
        { title: "Users", url: "/app/users", icon: Users },
        { title: "Subscriptions", url: "/app/subscriptions", icon: CreditCard },
        { title: "Properties", url: "/app/properties", icon: Building2 },
        { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
        { title: "Audit Logs", url: "/app/audit-logs", icon: ScrollText },
      ],
    },
    {
      label: "Operations",
      items: [
        { title: "Service Requests", url: "/app/service-requests", icon: Wrench },
        { title: "Support Tickets", url: "/app/support", icon: LifeBuoy },
      ],
    },
  ],
  service_admin: [
    { label: "Overview", items: COMMON },
    {
      label: "Operations",
      items: [
        { title: "Service Requests", url: "/app/service-requests", icon: Wrench },
        { title: "Contractors", url: "/app/contractors", icon: HardHat },
        { title: "Realtors", url: "/app/realtors", icon: Megaphone },
        { title: "Appointments", url: "/app/appointments", icon: Calendar },
        { title: "Estimates", url: "/app/estimates", icon: FileSpreadsheet },
        { title: "Invoices", url: "/app/invoices", icon: Receipt },
        { title: "Support Tickets", url: "/app/support", icon: LifeBuoy },
        { title: "Service Documents", url: "/app/service-documents", icon: FileText },
        { title: "Service Communications", url: "/app/service-communications", icon: Megaphone },
      ],
    },
  ],
  landlord: [
    { label: "Overview", items: COMMON },
    {
      label: "Portfolio",
      items: [
        { title: "Properties", url: "/app/properties", icon: Building2 },
        { title: "Tenants", url: "/app/tenants", icon: Users, hidden: true },
        { title: "Leases", url: "/app/leases", icon: FileText, hidden: true },
        { title: "Rent Collection", url: "/app/invoices", icon: Receipt },
        { title: "Payment Management", url: "/app/payment-management", icon: CreditCard },
      ],
    },
    {
      label: "Services",
      items: [
        { title: "Maintenance", url: "/app/service-requests", icon: Wrench },
        { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
        { title: "Subscription", url: "/app/subscriptions", icon: CreditCard },
      ],
    },
  ],
  tenant: [
    { label: "My Home", items: COMMON },
    {
      label: "Activity",
      items: [
        { title: "Browse Properties", url: "/app/properties", icon: Building2 },
        { title: "Rent Payments", url: "/app/invoices", icon: Receipt },
        { title: "Maintenance", url: "/app/service-requests", icon: Wrench },
        { title: "Appointments", url: "/app/appointments", icon: Calendar },
        { title: "Lease Documents", url: "/app/leases", icon: FileText },
        { title: "Notifications", url: "/app/notifications", icon: Bell },
      ],
    },
  ],
contractor: [
  {
    label: "Workspace",
    items: COMMON,
  },
   {
  label: "Jobs",
  items: [
    { title: "Assigned Jobs", url: "/app/service-requests", icon: Wrench },

    { title: "Appointments", url: "/app/appointments", icon: Calendar },

    {
      title: "Availability",
      url: "/app/contractor-availability",
      icon: Calendar,
    },

    { title: "Estimates", url: "/app/estimates", icon: FileSpreadsheet },

    {
      title: "Quotations",
      url: "/app/contractor-quotations",
      icon: FileText,
    },

    {
      title: "Invoices",
      url: "/app/contractor-invoices",
      icon: Receipt,
    },
  ],
},
  {
    label: "Profile",
    items: [
      { title: "My Profile", url: "/app/contractor-profile", icon: Users },
    ],
  },
],
  realtor: [
    { label: "Overview", items: COMMON },
    {
      label: "Listings",
      items: [
        { title: "Properties", url: "/app/properties", icon: Building2 },
        { title: "Realtor Workspace", url: "/app/realtor-workspace", icon: ClipboardCheck },
        { title: "Listing Analytics", url: "/app/analytics", icon: BarChart3 },
        { title: "Tenant Onboarding", url: "/app/tenants", icon: Users },
      ],
    },
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
      <SidebarHeader className="border-b border-sidebar-border px-3 h-14 flex flex-row items-center">
        <Link to="/app/dashboard" className="flex items-center">
          <Logo showText={!collapsed} />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => (
                  <SidebarMenuItem key={item.url} className={item.hidden ? "hidden" : undefined}>
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
             <Link to="/app/dashboard" params={{}}>
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
