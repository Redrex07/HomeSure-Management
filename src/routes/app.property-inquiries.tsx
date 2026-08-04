import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { Card, CardContent } from "@/shared/components/ui/card";
import { MessageSquare, Clock, CheckCircle, Search, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getTenantInquiries } from "@/core/db/supabase-queries";
import { useTenantContext } from "@/features/tenant/hooks/useTenantContext";
import { Input } from "@/shared/components/ui/input";

export const Route = createFileRoute("/app/property-inquiries")({
  head: () => ({ meta: [{ title: "Property Inquiries — HomeSure" }] }),
  component: PropertyInquiriesPage,
});

function PropertyInquiriesPage() {
  const tenantContext = useTenantContext();
  const tenantId = tenantContext.tenantId;

  const [search, setSearch] = useState("");

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ["tenant-inquiries", tenantId],
    queryFn: () => getTenantInquiries(tenantId!),
    enabled: !!tenantId,
  });

  const filteredInquiries = inquiries.filter((inq: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (inq.propertyName || "").toLowerCase().includes(q) ||
      (inq.message || "").toLowerCase().includes(q)
    );
  });

  if (!tenantId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Please complete your tenant profile to view inquiries.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 overflow-x-hidden">
      <PageHeader
        title="Property Inquiries"
        description="Track your communication with landlords regarding properties."
      />

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search inquiries..." 
            className="pl-9 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <span className="text-muted-foreground">Loading inquiries...</span>
        </div>
      ) : filteredInquiries.length === 0 ? (
        <div className="text-center p-12 bg-card rounded-xl border border-dashed border-border/60">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-3" />
          <h3 className="text-lg font-medium text-foreground">No inquiries found</h3>
          <p className="text-muted-foreground mt-1 max-w-md mx-auto">
            {search ? "No inquiries match your search." : "You haven't made any property inquiries yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInquiries.map((inq: any) => (
            <Card key={inq.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="border-b border-border/40 bg-muted/20 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{inq.propertyName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">{inq.date}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                      inq.status === "Pending" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                      inq.status === "Responded" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {inq.status === "Pending" && <Clock className="mr-1 h-3 w-3" />}
                      {inq.status === "Responded" && <CheckCircle className="mr-1 h-3 w-3" />}
                      {inq.status}
                    </span>
                  </div>
                </div>
                
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Your Message</p>
                    <p className="text-sm bg-muted/40 p-3 rounded-md border border-border/40 text-foreground/90 whitespace-pre-wrap">
                      {inq.message}
                    </p>
                  </div>
                  
                  {inq.landlord_reply && (
                    <div className="pl-6 border-l-2 border-primary/40">
                      <p className="text-xs font-medium text-primary mb-1 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="h-3 w-3" /> Landlord Reply
                      </p>
                      <p className="text-sm bg-primary/5 p-3 rounded-md border border-primary/10 text-foreground/90 whitespace-pre-wrap">
                        {inq.landlord_reply}
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
