import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { DataTable } from "@/shared/components/common/DataTable";
import { useQuery } from "@tanstack/react-query";
import { fetchPlatformAuditLogs } from "@/core/api/users.functions";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { FileDown, Search, Filter, RefreshCw } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/audit-logs")({
  head: () => ({ meta: [{ title: "Audit Logs — HomeSure" }] }),
  component: AuditPage,
});

function AuditPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ["platform-audit-logs"],
    queryFn: () => fetchPlatformAuditLogs(),
    refetchOnWindowFocus: false,
  });

  // Filter logs locally based on search query, role, and action type
  const filteredLogs = useMemo(() => {
    return logs.filter((log: any) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        log.actor.toLowerCase().includes(q) || 
        log.action.toLowerCase().includes(q) || 
        (log.description || "").toLowerCase().includes(q);

      // 2. Role Filter
      const matchesRole = roleFilter === "all" || log.role?.toLowerCase() === roleFilter.toLowerCase();

      // 3. Action Filter
      let matchesAction = true;
      if (actionFilter !== "all") {
        const act = actionFilter.toLowerCase();
        if (act === "auth") {
          matchesAction = log.action.toLowerCase().includes("login") || log.action.toLowerCase().includes("logout") || log.action.toLowerCase().includes("password");
        } else if (act === "user") {
          matchesAction = log.action.toLowerCase().includes("user") || log.action.toLowerCase().includes("invite");
        } else if (act === "subscription") {
          matchesAction = log.action.toLowerCase().includes("subscription") || log.action.toLowerCase().includes("plan") || log.action.toLowerCase().includes("payment");
        } else if (act === "property") {
          matchesAction = log.action.toLowerCase().includes("property") || log.action.toLowerCase().includes("lease");
        } else if (act === "service") {
          matchesAction = log.action.toLowerCase().includes("service") || log.action.toLowerCase().includes("request") || log.action.toLowerCase().includes("estimate");
        }
      }

      return matchesSearch && matchesRole && matchesAction;
    });
  }, [logs, searchQuery, roleFilter, actionFilter]);

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error("No log entries to export.");
      return;
    }
    const headers = ["Timestamp", "Actor/Recipient", "Role", "Action", "Description", "IP Address", "Browser", "Device"];
    const rows = filteredLogs.map(l => [
      l.time,
      l.actor,
      l.role || "system",
      l.action,
      (l.description || "").replace(/"/g, '""'),
      l.ip || "—",
      l.browser || "—",
      l.device || "—"
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `homesure_activity_audit_logs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <PageHeader 
        title="Audit logs" 
        description="A complete record of platform actions, security events, and user activity." 
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex items-center gap-1 cursor-pointer" onClick={() => { refetch(); toast.success("Logs reloaded."); }}><RefreshCw className="h-3.5 w-3.5" /> Refresh</Button>
            <Button size="sm" className="cursor-pointer" onClick={handleExportCSV}>
              <FileDown className="mr-2 h-4 w-4" /> Export logs
            </Button>
          </div>
        }
      />

      {/* Search and Filters Toolbar */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-xl p-4 mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end justify-between">
          <div className="grid gap-3 sm:grid-cols-3 flex-1 max-w-4xl">
            <div className="space-y-1.5">
              <Label htmlFor="search-log" className="text-xs font-semibold text-slate-500">Search Logs</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input id="search-log" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search actor, action..." className="pl-9 h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role-filter" className="text-xs font-semibold text-slate-500">Filter by Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger id="role-filter" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="service_admin">Service Admin</SelectItem>
                  <SelectItem value="landlord">Landlord</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="realtor">Realtor</SelectItem>
                  <SelectItem value="system">System/Email Log</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="action-filter" className="text-xs font-semibold text-slate-500">Filter by Action</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger id="action-filter" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="auth">Auth (Login/Logout/Pwd)</SelectItem>
                  <SelectItem value="user">User management</SelectItem>
                  <SelectItem value="subscription">Subscriptions</SelectItem>
                  <SelectItem value="property">Properties & leases</SelectItem>
                  <SelectItem value="service">Service operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-md border border-slate-200 bg-white">
          <p className="animate-pulse text-sm text-slate-400">Loading audit logs...</p>
        </div>
      ) : (
        <DataTable
          rows={filteredLogs}
          filterKeys={["action", "actor", "description"]}
          columns={[
            {
              key: "time",
              header: "Time",
              sortable: true,
              render: (l) => <span className="font-mono text-xs text-slate-500">{l.time}</span>,
            },
            { 
              key: "actor", 
              header: "Actor", 
              sortable: true,
              render: (l) => (
                <div>
                  <div className="font-medium text-slate-800">{l.actor}</div>
                  {l.role && <Badge variant="outline" className="text-[10px] py-0 px-1 capitalize mt-0.5">{l.role.replace("_", " ")}</Badge>}
                </div>
              )
            },
            {
              key: "action",
              header: "Action / Description",
              sortable: true,
              render: (l) => (
                <div>
                  <span className="text-sm font-semibold text-slate-800">{l.action}</span>
                  <div className="text-xs text-slate-500 mt-0.5">{l.description}</div>
                </div>
              ),
            },
            { key: "ip", header: "IP Address" },
            { 
              key: "browser", 
              header: "User Agent", 
              render: (l) => (
                <div className="text-xs text-slate-600">
                  <span className="font-medium">{l.browser}</span>
                  <span className="text-slate-400 block text-[10px]">{l.device}</span>
                </div>
              ) 
            }
          ]}
        />
      )}
    </>
  );
}
