import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { Card, CardContent } from "@/shared/components/ui/card";
import { FileText, Clock, CheckCircle, XCircle, Search, Home, DollarSign, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getTenantRentalApplications } from "@/core/db/supabase-queries";
import { useTenantContext } from "@/features/tenant/hooks/useTenantContext";
import { Input } from "@/shared/components/ui/input";

export const Route = createFileRoute("/app/rental-applications")({
  head: () => ({ meta: [{ title: "Rental Applications — HomeSure" }] }),
  component: RentalApplicationsPage,
});

function RentalApplicationsPage() {
  const tenantContext = useTenantContext();
  const tenantId = tenantContext.tenantId;

  const [search, setSearch] = useState("");

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["tenant-applications", tenantId],
    queryFn: () => getTenantRentalApplications(tenantId!),
    enabled: !!tenantId,
  });

  const filteredApps = applications.filter((app: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (app.propertyName || "").toLowerCase().includes(q) ||
      (app.occupation || "").toLowerCase().includes(q)
    );
  });

  if (!tenantId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Please complete your tenant profile to view rental applications.
      </div>
    );
  }

  const formatUsd = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  return (
    <div className="space-y-6 pb-12 overflow-x-hidden">
      <PageHeader
        title="Rental Applications"
        description="Track the status of properties you've applied to rent."
      />

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by property name..." 
            className="pl-9 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <span className="text-muted-foreground">Loading applications...</span>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center p-12 bg-card rounded-xl border border-dashed border-border/60">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-3" />
          <h3 className="text-lg font-medium text-foreground">No applications found</h3>
          <p className="text-muted-foreground mt-1 max-w-md mx-auto">
            {search ? "No applications match your search." : "You haven't submitted any rental applications yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredApps.map((app: any) => (
            <Card key={app.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="border-b border-border/40 bg-muted/20 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-base">{app.propertyName}</span>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                    app.status === "Pending" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                    app.status === "Approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {app.status === "Pending" && <Clock className="mr-1.5 h-3.5 w-3.5" />}
                    {app.status === "Approved" && <CheckCircle className="mr-1.5 h-3.5 w-3.5" />}
                    {app.status === "Rejected" && <XCircle className="mr-1.5 h-3.5 w-3.5" />}
                    {app.status}
                  </span>
                </div>
                
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Applied On
                      </p>
                      <p className="text-sm font-medium">{app.date}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Move In
                      </p>
                      <p className="text-sm font-medium">{app.expectedMoveIn || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Occupation
                      </p>
                      <p className="text-sm font-medium">{app.occupation || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> Income
                      </p>
                      <p className="text-sm font-medium">{formatUsd.format(app.monthlyIncome)}/mo</p>
                    </div>
                  </div>

                  {app.remarks && (
                    <div className="pt-4 border-t border-border/40">
                      <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Remarks</p>
                      <p className="text-sm text-foreground/90 bg-muted/30 p-2 rounded-md">
                        {app.remarks}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
