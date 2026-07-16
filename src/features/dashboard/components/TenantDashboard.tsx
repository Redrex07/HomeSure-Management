import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Progress } from "@/shared/components/ui/progress";
import { StatCard } from "@/shared/components/common/StatCard";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { PageHeader } from "@/shared/components/common/PageHeader";
import {
  ChartCard,
  RevenueArea,
  RequestsBar,
  CategoryPie,
} from "@/shared/components/charts/Charts";
import {
  Users,
  Building2,
  CreditCard,
  DollarSign,
  Wrench,
  ClipboardCheck,
  HardHat,
  Clock,
  LifeBuoy,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Receipt,
  Eye,
  Plus,
  TrendingUp,
  FileSpreadsheet,
  Sparkles,
  Home,
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
} from "@/shared/utils/mock-data";
import { Link } from "@tanstack/react-router";
import { useSession } from "@/features/auth/store/auth-store";
import { formatINR } from "@/shared/utils/utils";
import { useQuery } from "@tanstack/react-query";
import {
  getTenantAppointments,
  getTenantInvoices,
  getTenantServiceRequests,
  getTenantDocuments,
  uploadTenantDocument,
  deleteTenantDocument,
} from "@/core/db/supabase-queries";
import { supabase } from "@/core/db/supabase";
import { toast } from "sonner";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Trash2, Upload, Download } from "lucide-react";
import { useTenantContext } from "@/features/tenant/hooks/useTenantContext";

const fmt = (n: number) => formatINR(n);

/* ---------------- TENANT ---------------- */
export function TenantDashboard() {
  const session = useSession();
  const tenantContext = useTenantContext();
  const tenantName = session?.name?.split(" ")[0] || "Sarah";
  const { data: dbRequests = [] } = useQuery({
    queryKey: ["service-requests", tenantContext.tenantId, tenantContext.serviceTenantId],
    queryFn: () => getTenantServiceRequests(tenantContext.tenantId!, tenantContext.serviceTenantId),
    enabled: !!tenantContext.tenantId && !!tenantContext.serviceTenantId,
  });
  const { data: dbAppointments = [] } = useQuery({
    queryKey: ["appointments", tenantContext.tenantId, tenantContext.serviceTenantId],
    queryFn: () => getTenantAppointments(tenantContext.tenantId!, tenantContext.serviceTenantId),
    enabled: !!tenantContext.tenantId && !!tenantContext.serviceTenantId,
  });
  const { data: dbInvoices = [] } = useQuery({
    queryKey: ["invoices", tenantContext.tenantId],
    queryFn: () => getTenantInvoices(tenantContext.tenantId!, tenantContext.serviceTenantId),
    enabled: !!tenantContext.tenantId,
  });

  const { data: dbDocuments = [], isLoading: isLoadingDocs } = useQuery({
    queryKey: ["tenant-documents", tenantContext.tenantId],
    queryFn: () => getTenantDocuments(tenantContext.tenantId!),
    enabled: !!tenantContext.tenantId,
  });

  const queryClient = useQueryClient();
  const [openUpload, setOpenUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("Lease");
  const [docNumber, setDocNumber] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: uploadTenantDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-documents"] });
      toast.success("Document uploaded successfully");
      setOpenUpload(false);
      setUploadFile(null);
      setDocNumber("");
      setDocType("Lease");
    },
    onError: (err: any) => {
      toast.error("Upload failed: " + (err.message || String(err)));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTenantDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-documents"] });
      toast.success("Document deleted");
    },
    onError: (err: any) => {
      toast.error("Failed to delete: " + (err.message || String(err)));
    }
  });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !tenantContext.tenantId) return;

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}-${uploadFile.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
      const { data, error: uploadErr } = await supabase.storage
        .from("tenant-documents")
        .upload(`documents/${fileName}`, uploadFile, { upsert: false });

      if (uploadErr) {
        // Fallback to service-documents if tenant-documents bucket doesn't exist
        const { data: fbData, error: fbErr } = await supabase.storage
          .from("service-documents")
          .upload(`documents/${fileName}`, uploadFile, { upsert: false });
        if (fbErr) throw fbErr;
        
        const { data: publicUrlData } = supabase.storage.from("service-documents").getPublicUrl(fbData.path);
        
        await uploadMutation.mutateAsync({
          tenant_id: tenantContext.tenantId,
          document_type: docType,
          document_number: docNumber,
          document_file: publicUrlData.publicUrl,
        });
      } else {
        const { data: publicUrlData } = supabase.storage.from("tenant-documents").getPublicUrl(data.path);
        
        await uploadMutation.mutateAsync({
          tenant_id: tenantContext.tenantId,
          document_type: docType,
          document_number: docNumber,
          document_file: publicUrlData.publicUrl,
        });
      }
    } catch (err: any) {
      toast.error("Upload error: " + (err.message || String(err)));
    } finally {
      setIsUploading(false);
    }
  };

  const visibleRequests = dbRequests.length > 0 ? dbRequests : serviceRequests;
  const visibleAppointments = dbAppointments.length > 0 ? dbAppointments : appointments;
  const visibleInvoices = dbInvoices.length > 0 ? dbInvoices : invoices;
  const myUnit = properties[0];
  const next = visibleInvoices.find((i) => i.status === "Pending") ?? visibleInvoices[0];
  const openRequests = visibleRequests.filter((r) => r.status !== "Completed");
  const upcomingAppointments = visibleAppointments.filter((a) => {
    if (!a.date) return true;
    return new Date(`${a.date}T23:59:59`) >= new Date();
  });
  return (
    <>
      <PageHeader
        title={`Hello, ${tenantName}`}
        description="Your home, payments and requests in one place."
        actions={
          <Link to="/app/service-requests">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> New request
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70 shadow-card lg:col-span-2">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <img
              src={myUnit.image}
              alt=""
              className="h-32 w-full rounded-lg object-cover sm:w-48"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Home className="h-3.5 w-3.5" /> Your residence
              </div>
              <h3 className="mt-1 text-lg font-semibold">{myUnit.name}</h3>
              <p className="text-sm text-muted-foreground">{myUnit.address}</p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Monthly rent</div>
                  <div className="font-semibold">{fmt(myUnit.rent)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Lease ends</div>
                  <div className="font-semibold">Feb 28, 2026</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Landlord</div>
                  <div className="font-semibold">{myUnit.landlord}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary-soft shadow-card">
          <CardContent className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">
              Next rent
            </div>
            <div className="mt-2 text-3xl font-bold text-foreground">
              {fmt(next?.amount ?? myUnit.rent)}
            </div>
            <div className="text-sm text-muted-foreground">Due {next?.due ?? "This month"}</div>
            <Button asChild className="mt-4 w-full">
              <Link to="/app/invoices">Pay rent</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/app/service-requests" className="block">
          <StatCard
            label="Open requests"
            value={String(openRequests.length)}
            icon={Wrench}
            tone="info"
          />
        </Link>
        <Link to="/app/appointments" className="block">
          <StatCard
            label="Upcoming appointments"
            value={String(upcomingAppointments.length)}
            icon={Calendar}
          />
        </Link>
        <div className="block cursor-pointer">
          <StatCard
            label="Documents on file"
            value={String(dbDocuments.length)}
            icon={FileText}
            tone="success"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">My maintenance requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {visibleRequests.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.category} · {r.contractor ?? "Awaiting assignment"}
                  </div>
                </div>
                <StatusBadge value={r.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">My Documents</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setOpenUpload(true)}>
              <Upload className="mr-2 h-3.5 w-3.5" /> Upload
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoadingDocs ? (
              <p className="text-xs text-muted-foreground animate-pulse">Loading documents...</p>
            ) : dbDocuments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No documents found.</p>
            ) : (
              dbDocuments.map((d: any) => (
                <div
                  key={d.id}
                  className="flex items-center gap-3 rounded-md border border-border/60 p-2.5"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-soft text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{d.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Status: {d.status} · Uploaded {d.updated}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {d.fileUrl && (
                      <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0" title="Preview/Download">
                        <a href={d.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        if(confirm("Delete this document?")) deleteMutation.mutate(d.id);
                      }}
                      title="Delete"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Dialog */}
      <Dialog open={openUpload} onOpenChange={(open) => !open && !isUploading && setOpenUpload(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload ID proofs, leases, or other documents.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>File</Label>
              <Input type="file" required onChange={(e) => setUploadFile(e.target.files?.[0] || null)} disabled={isUploading} />
            </div>
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={docType} onValueChange={setDocType} disabled={isUploading}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lease">Lease Agreement</SelectItem>
                  <SelectItem value="ID Proof">ID Proof</SelectItem>
                  <SelectItem value="Income Proof">Income Proof</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Document Number (Optional)</Label>
              <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} disabled={isUploading} placeholder="e.g. Passport number" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenUpload(false)} disabled={isUploading}>Cancel</Button>
              <Button type="submit" disabled={isUploading || uploadMutation.isPending}>
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
