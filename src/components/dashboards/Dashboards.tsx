import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PageHeader } from "@/components/common/PageHeader";
import { ChartCard, RevenueArea, RequestsBar, CategoryPie } from "@/components/charts/Charts";
import {
  Users, Building2, CreditCard, DollarSign, Wrench, ClipboardCheck, HardHat, Clock,
  LifeBuoy, CheckCircle2, AlertTriangle, FileText, Calendar, Receipt, Eye, Plus,
  TrendingUp, FileSpreadsheet, Sparkles, Home,
} from "lucide-react";
import {
  properties,
  tenants,
  serviceRequests,
  contractors,
  appointments,
  estimates,
  invoices,
  tickets,
  users,
  subscriptions,
  auditLogs,
  revenueSeries,
  requestsSeries,
  categoryBreakdown,
  listings,
  leaseDocs,
  propertyReadiness,
  tenantOnboarding,
  aiListings,
  followUps,
  realtorNotifications,
} from "@/lib/mock-data";
import { Link } from "@tanstack/react-router";
import { useSession } from "@/lib/auth-store";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/shared/components/ui/select";

import { Label } from "@/shared/components/ui/label";

import { Badge } from "@/shared/components/ui/badge";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

/* ---------------- SUPER ADMIN ---------------- */
export function SuperAdminDashboard() {
  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Health, revenue and activity across the entire HomeSure network."
        actions={<Button variant="outline" size="sm"><FileSpreadsheet className="mr-2 h-4 w-4" /> Export report</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value="4,218" icon={Users} delta={12} hint="vs last month" />
        <StatCard label="Active properties" value="1,847" icon={Building2} delta={8} tone="info" hint="across 14 regions" />
        <StatCard label="Active subscriptions" value="612" icon={CreditCard} delta={5} tone="success" />
        <StatCard label="Monthly revenue" value="$71,900" icon={DollarSign} delta={18} tone="success" hint="MRR" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Revenue & expenses" className="lg:col-span-2">
          <RevenueArea data={revenueSeries} />
        </ChartCard>
        <ChartCard title="Requests by category">
          <CategoryPie data={categoryBreakdown} />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70 shadow-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Recent audit logs</CardTitle>
            <Link to="/app/audit-logs"><Button variant="ghost" size="sm">View all</Button></Link>
          </CardHeader>
          <CardContent className="px-0">
            <div className="divide-y divide-border">
              {auditLogs.map((l) => (
                <div key={l.id} className="flex items-center gap-3 px-6 py-2.5 text-sm">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <ClipboardCheck className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-foreground">{l.action}</div>
                    <div className="text-xs text-muted-foreground">{l.actor} · {l.ip}</div>
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">{l.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader><CardTitle className="text-sm font-semibold">Subscription health</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {subscriptions.slice(0, 4).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{s.customer}</div>
                  <div className="text-xs text-muted-foreground">{s.plan} · {s.seats} seats</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-sm font-semibold">{fmt(s.mrr)}</div>
                  <StatusBadge value={s.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

/* ---------------- SERVICE ADMIN ---------------- */
export function ServiceAdminDashboard() {
  const pending = serviceRequests.filter((r) => r.status === "Pending").length;
  const assigned = serviceRequests.filter((r) => r.status === "Assigned" || r.status === "In Progress").length;
  const completed = serviceRequests.filter((r) => r.status === "Completed").length;

  return (
    <>
      <PageHeader
        title="Service operations"
        description="Triage requests, manage contractors and track delivery."
        actions={<Link to="/app/service-requests"><Button size="sm"><Plus className="mr-2 h-4 w-4" /> New request</Button></Link>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total requests" value={String(serviceRequests.length * 24)} icon={Wrench} delta={6} />
        <StatCard label="Pending" value={String(pending)} icon={Clock} tone="warning" delta={-3} />
        <StatCard label="Assigned / in-progress" value={String(assigned)} icon={HardHat} tone="info" delta={9} />
        <StatCard label="Completed (mo)" value={String(completed * 18)} icon={CheckCircle2} tone="success" delta={14} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Requests · last 7 days" className="lg:col-span-2"><RequestsBar data={requestsSeries} /></ChartCard>
        <Card className="border-border/70 shadow-card">
          <CardHeader><CardTitle className="text-sm font-semibold">Top contractors</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {contractors.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary-soft text-xs text-primary">{c.contractorName.split(" ").map((w: string) => w[0]).slice(0,2).join("")}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{c.contractorName}</div>
                  <div className="text-xs text-muted-foreground">{c.trade} · ★ {c.rating}</div>
                </div>
                <span className={`h-2 w-2 rounded-full ${c.available ? "bg-success" : "bg-muted-foreground/40"}`} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70 shadow-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Active service requests</CardTitle>
            <Link to="/app/service-requests"><Button variant="ghost" size="sm">View all</Button></Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {serviceRequests.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2.5 hover:bg-muted/40">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{r.id}</span>
                    <StatusBadge value={r.priority} />
                  </div>
                  <div className="mt-0.5 truncate text-sm font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.property} · {r.contractor ?? "Unassigned"}</div>
                </div>
                <StatusBadge value={r.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Today's appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            {appointments.map((a) => (
              <div key={a.id} className="rounded-md border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{a.title}</div>
                  <StatusBadge value={a.status} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{a.date} · {a.time} · {a.property}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

/* ---------------- LANDLORD ---------------- */
export function LandlordDashboard() {
  const occupied = properties.filter((p) => p.status === "Occupied").length;
  const occupancy = Math.round((occupied / properties.length) * 100);
  const collected = invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const outstanding = invoices.filter((i) => i.status !== "Paid").reduce((s, i) => s + i.amount, 0);

  return (
    <>
      <PageHeader
        title="Welcome back, Alex"
        description="Here's how your portfolio is performing today."
        actions={<Link to="/app/properties"><Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add property</Button></Link>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Properties" value={String(properties.length)} icon={Building2} delta={4} />
        <StatCard label="Active tenants" value={String(tenants.filter(t => t.status === "Active").length)} icon={Users} tone="info" delta={2} />
        <StatCard label="Rent collected" value={fmt(collected)} icon={DollarSign} tone="success" delta={11} />
        <StatCard label="Open requests" value={String(serviceRequests.filter(r => r.status !== "Completed").length)} icon={Wrench} tone="warning" delta={-3} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Rent revenue trend" className="lg:col-span-2"><RevenueArea data={revenueSeries} /></ChartCard>
        <Card className="border-border/70 shadow-card">
          <CardHeader><CardTitle className="text-sm font-semibold">Portfolio occupancy</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-bold">{occupancy}%</div>
              <div className="text-sm text-muted-foreground">{occupied} of {properties.length}</div>
            </div>
            <Progress value={occupancy} className="mt-4" />
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Outstanding rent</span><span className="font-semibold">{fmt(outstanding)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Avg. days to fill</span><span className="font-semibold">12 days</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Renewals (90d)</span><span className="font-semibold">3</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Recent properties</CardTitle>
            <Link to="/app/properties"><Button variant="ghost" size="sm">View all</Button></Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {properties.slice(0, 4).map((p) => (
              <Link key={p.id} to="/app/properties" className="flex items-center gap-3 rounded-md border border-border/60 p-2.5 hover:bg-muted/40">
                <img src={p.image} alt="" className="h-12 w-16 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{p.address}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{fmt(p.rent)}</div>
                  <StatusBadge value={p.status} />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Maintenance requests</CardTitle>
            <Link to="/app/service-requests"><Button variant="ghost" size="sm">View all</Button></Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {serviceRequests.slice(0, 4).map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.property} · {r.category}</div>
                </div>
                <StatusBadge value={r.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

/* ---------------- TENANT ---------------- */
export function TenantDashboard() {
  const myUnit = properties[0];
  const next = invoices.find((i) => i.status === "Pending") ?? invoices[0];
  const myTenantId = "T-2201";
  return (
    <>
      <PageHeader
        title="Hello, Sarah"
        description="Your home, payments and requests in one place."
        actions={<Link to="/app/service-requests"><Button size="sm"><Plus className="mr-2 h-4 w-4" /> New request</Button></Link>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70 shadow-card lg:col-span-2">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <img src={myUnit.image} alt="" className="h-32 w-full rounded-lg object-cover sm:w-48" />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Home className="h-3.5 w-3.5" /> Your residence
              </div>
              <h3 className="mt-1 text-lg font-semibold">{myUnit.name}</h3>
              <p className="text-sm text-muted-foreground">{myUnit.address}</p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <div><div className="text-muted-foreground text-xs">Monthly rent</div><div className="font-semibold">{fmt(myUnit.rent)}</div></div>
                <div><div className="text-muted-foreground text-xs">Lease ends</div><div className="font-semibold">Feb 28, 2026</div></div>
                <div><div className="text-muted-foreground text-xs">Landlord</div><div className="font-semibold">{myUnit.landlord}</div></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary-soft shadow-card">
          <CardContent className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">Next rent</div>
            <div className="mt-2 text-3xl font-bold text-foreground">{fmt(next.amount)}</div>
            <div className="text-sm text-muted-foreground">Due {next.due}</div>
            <Button className="mt-4 w-full">Pay rent</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open requests" value="2" icon={Wrench} tone="info" />
        <StatCard label="Upcoming appointments" value="1" icon={Calendar} />
        <StatCard label="Documents on file" value={String(leaseDocs.length)} icon={FileText} tone="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 shadow-card">
          <CardHeader><CardTitle className="text-sm font-semibold">My maintenance requests</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {serviceRequests.filter((r) => r.tenantId ? r.tenantId === myTenantId : r.tenant === "Sarah Chen").map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.category} · {r.contractor ?? "Awaiting assignment"}</div>
                </div>
                <StatusBadge value={r.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader><CardTitle className="text-sm font-semibold">Lease documents</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {leaseDocs.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-md border border-border/60 p-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-soft text-primary"><FileText className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.size} · Updated {d.updated}</div>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

/* ---------------- CONTRACTOR ---------------- */
export function ContractorDashboard() {
  const contractorId = "C-301";
  const assigned = serviceRequests.filter((r) => r.contractorId ? r.contractorId === contractorId : r.contractor === "BlueLine Plumbing" || r.status === "Assigned");
  const totalInv = invoices.reduce((s, i) => s + i.amount, 0);
  return (
    <>
      <PageHeader
        title="Today's workspace"
        description="Jobs, schedule and invoices for BlueLine Plumbing."
        actions={<Button size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" /> Submit estimate</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assigned jobs" value={String(assigned.length)} icon={Wrench} tone="info" />
        <StatCard label="Upcoming visits" value={String(appointments.length)} icon={Calendar} />
        <StatCard label="Estimates pending" value={String(estimates.filter(e => e.status === "Pending").length)} icon={FileSpreadsheet} tone="warning" />
        <StatCard label="Invoiced (mo)" value={fmt(totalInv)} icon={Receipt} tone="success" delta={9} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70 shadow-card lg:col-span-2">
          <CardHeader><CardTitle className="text-sm font-semibold">Active jobs</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {assigned.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{r.id}</span>
                    <StatusBadge value={r.priority} />
                  </div>
                  <div className="mt-0.5 truncate text-sm font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.property} · ETA {r.eta}</div>
                </div>
                <StatusBadge value={r.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader><CardTitle className="text-sm font-semibold">Upcoming appointments</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {appointments.map((a) => (
              <div key={a.id} className="rounded-md border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{a.title}</div>
                  <span className="text-xs text-muted-foreground">{a.time}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{a.date} · {a.property}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

/* ---------------- REALTOR ---------------- */
export function RealtorDashboard() {
  const propertyById = new Map(properties.map((property) => [property.id, property]));
  const tenantById = new Map(tenants.map((tenant) => [tenant.id, tenant]));
  const activeListings = listings.filter((listing) => listing.status === "Active");
  const onboarding = tenantOnboarding.filter((item) => item.onboardingStatus !== "Complete");
  return (
    <>
      <PageHeader
        title="Listing performance"
        description="Track properties on the market and onboarding pipeline."
        actions={<Link to="/app/properties"><Button size="sm"><Plus className="mr-2 h-4 w-4" /> New listing</Button></Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active listings" value={String(activeListings.length)} icon={Building2} delta={2} />
        <StatCard label="Total views (30d)" value="4,218" icon={Eye} tone="info" delta={26} />
        <StatCard label="Leads generated" value="44" icon={TrendingUp} tone="success" delta={12} />
        <StatCard label="Onboarding tenants" value={String(onboarding.length)} icon={Users} tone="warning" />
      </div>

      <Card className="border-border/70 shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Listings</CardTitle>
          <Link to="/app/properties"><Button variant="ghost" size="sm">View all</Button></Link>
        </CardHeader>
        <CardContent className="px-0">
          <div className="divide-y divide-border">
            {listings.map((l) => (
              <div key={l.id} className="grid grid-cols-2 items-center gap-3 px-6 py-3 sm:grid-cols-6">
                <div className="sm:col-span-2">
                  <div className="text-sm font-medium">{l.name}</div>
                  <div className="text-xs text-muted-foreground">{l.id} · {fmt(l.price)}/mo</div>
                </div>
                <div><div className="text-xs text-muted-foreground">Views</div><div className="text-sm font-semibold">{l.views.toLocaleString()}</div></div>
                <div><div className="text-xs text-muted-foreground">Leads</div><div className="text-sm font-semibold">{l.leads}</div></div>
                <div><div className="text-xs text-muted-foreground">Days listed</div><div className="text-sm font-semibold">{l.days}</div></div>
                <div className="text-right"><StatusBadge value={l.status} /></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 shadow-card">
          <CardHeader><CardTitle className="text-sm font-semibold">Property readiness</CardTitle></CardHeader>
          <CardContent className="space-y-3">
              {propertyReadiness.map((item) => {
                const property = propertyById.get(item.propertyId);
                const progress = item.status === "Ready" ? 92 : item.status === "In Review" ? 78 : item.status === "Draft" ? 35 : 60;

                return (
                <div key={item.readinessId}>
                  <div className="flex justify-between text-sm"><span className="font-medium">{property?.name ?? item.propertyId}</span><span className="text-muted-foreground">{progress}%</span></div>
                  <Progress value={progress} className="mt-1.5" />
                </div>
                );
              })}
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-card">
          <CardHeader><CardTitle className="text-sm font-semibold">Tenant onboarding</CardTitle></CardHeader>
          <CardContent className="space-y-2">
              {tenantOnboarding.map((item) => {
                const tenant = tenantById.get(item.tenantId);

                return (
                <div key={item.onboardingId} className="flex items-center gap-3 rounded-md border border-border/60 p-2.5">
                  <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary-soft text-xs text-primary">{tenant?.name.split(" ").map(w=>w[0]).join("") ?? "TO"}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{tenant?.name ?? item.tenantId}</div>
                    <div className="text-xs text-muted-foreground">{tenant?.email ?? item.onboardingStatus}</div>
                </div>
                  <StatusBadge value={item.onboardingStatus} />
              </div>
                );
              })}
          </CardContent>
        </Card>
      </div>
      
    </>
  );
}
