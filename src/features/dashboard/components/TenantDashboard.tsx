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
  getTenantInquiries,
  getTenantVisits,
  createPropertyInquiry,
  createVisitSchedule,
  cancelVisitRequest,
  rescheduleVisitRequest,
  getAllProperties,
  getTenantRentalApplications,
  createRentalApplication,
  updateRentalApplication,
  cancelRentalApplication,
  getTenantLeaseAgreements,
  getFavoriteProperties,
  getReviewRatings,
  updateReviewRating,
  deleteReviewRating
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
  
  const { data: allProperties = [] } = useQuery({
    queryKey: ["properties"],
    queryFn: getAllProperties,
  });

  const { data: dbInquiries = [], isLoading: isLoadingInquiries } = useQuery({
    queryKey: ["tenant-inquiries", tenantContext.tenantId],
    queryFn: () => getTenantInquiries(tenantContext.tenantId!),
    enabled: !!tenantContext.tenantId,
  });

  const { data: dbVisits = [], isLoading: isLoadingVisits } = useQuery({
    queryKey: ["tenant-visits", tenantContext.tenantId],
    queryFn: () => getTenantVisits(tenantContext.tenantId!),
    enabled: !!tenantContext.tenantId,
  });

  const { data: dbApplications = [], isLoading: isLoadingApps } = useQuery({
    queryKey: ["tenant-applications", tenantContext.tenantId],
    queryFn: () => getTenantRentalApplications(tenantContext.tenantId!),
    enabled: !!tenantContext.tenantId,
  });

  const { data: dbLeases = [], isLoading: isLoadingLeases } = useQuery({
    queryKey: ["tenant-leases", tenantContext.tenantId],
    queryFn: () => getTenantLeaseAgreements(tenantContext.tenantId!),
    enabled: !!tenantContext.tenantId,
  });

  const { data: dbFavorites = [], isLoading: isLoadingFavorites } = useQuery({
    queryKey: ["tenant-favorites", tenantContext.tenantId],
    queryFn: () => getFavoriteProperties(tenantContext.tenantId!),
    enabled: !!tenantContext.tenantId,
  });

  const { data: dbReviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ["tenant-reviews", tenantContext.tenantId],
    queryFn: () => getReviewRatings(tenantContext.tenantId!),
    enabled: !!tenantContext.tenantId,
  });

  const queryClient = useQueryClient();
  const [openUpload, setOpenUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("Lease");
  const [docNumber, setDocNumber] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [openInquiry, setOpenInquiry] = useState(false);
  const [inquiryProperty, setInquiryProperty] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");

  const [openVisit, setOpenVisit] = useState(false);
  const [visitProperty, setVisitProperty] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  
  const [reschedulingVisit, setReschedulingVisit] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  const [openApp, setOpenApp] = useState(false);
  const [editingApp, setEditingApp] = useState<any | null>(null);
  const [appProperty, setAppProperty] = useState("");
  const [appMoveIn, setAppMoveIn] = useState("");
  const [appOccupation, setAppOccupation] = useState("");
  const [appIncome, setAppIncome] = useState("");
  const [appRemarks, setAppRemarks] = useState("");

  const [openReview, setOpenReview] = useState(false);
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewDesc, setReviewDesc] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  const updateReviewMutation = useMutation({
    mutationFn: (payload: { id: number, data: any }) => updateReviewRating(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-reviews"] });
      toast.success("Review updated successfully!");
      setOpenReview(false);
      setEditingReview(null);
    },
    onError: (err: any) => {
      toast.error("Failed to update review: " + (err.message || String(err)));
    }
  });

  const deleteReviewMutation = useMutation({
    mutationFn: deleteReviewRating,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-reviews"] });
      toast.success("Review deleted successfully!");
    },
    onError: (err: any) => {
      toast.error("Failed to delete review: " + (err.message || String(err)));
    }
  });

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    updateReviewMutation.mutate({
      id: editingReview.review_id,
      data: {
        review_title: reviewTitle,
        review_description: reviewDesc,
        rating: reviewRating
      }
    });
  };

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

  const inquiryMutation = useMutation({
    mutationFn: createPropertyInquiry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-inquiries"] });
      toast.success("Inquiry submitted successfully!");
      setOpenInquiry(false);
      setInquiryProperty("");
      setInquiryMessage("");
    },
    onError: (err: any) => {
      toast.error("Failed to submit inquiry: " + (err.message || String(err)));
    }
  });

  const visitMutation = useMutation({
    mutationFn: createVisitSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-visits"] });
      toast.success("Visit scheduled successfully!");
      setOpenVisit(false);
      setVisitProperty("");
      setVisitDate("");
      setVisitTime("");
    },
    onError: (err: any) => {
      toast.error("Failed to schedule visit: " + (err.message || String(err)));
    }
  });

  const rescheduleVisitMutation = useMutation({
    mutationFn: (payload: { id: number, date: string, time: string }) => rescheduleVisitRequest(payload.id, payload.date, payload.time),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-visits"] });
      toast.success("Visit rescheduled successfully!");
      setReschedulingVisit(null);
      setRescheduleDate("");
      setRescheduleTime("");
    },
    onError: (err: any) => {
      toast.error("Failed to reschedule visit: " + (err.message || String(err)));
    }
  });

  const cancelVisitMutation = useMutation({
    mutationFn: cancelVisitRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-visits"] });
      toast.success("Visit cancelled successfully!");
    },
    onError: (err: any) => {
      toast.error("Failed to cancel visit: " + (err.message || String(err)));
    }
  });

  const createAppMutation = useMutation({
    mutationFn: createRentalApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-applications"] });
      toast.success("Application submitted successfully!");
      setOpenApp(false);
      resetAppForm();
    },
    onError: (err: any) => {
      toast.error("Failed to submit application: " + (err.message || String(err)));
    }
  });

  const updateAppMutation = useMutation({
    mutationFn: (payload: { id: number, data: any }) => updateRentalApplication(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-applications"] });
      toast.success("Application updated successfully!");
      setEditingApp(null);
      resetAppForm();
    },
    onError: (err: any) => {
      toast.error("Failed to update application: " + (err.message || String(err)));
    }
  });

  const cancelAppMutation = useMutation({
    mutationFn: cancelRentalApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-applications"] });
      toast.success("Application cancelled successfully!");
    },
    onError: (err: any) => {
      toast.error("Failed to cancel application: " + (err.message || String(err)));
    }
  });

  const resetAppForm = () => {
    setAppProperty("");
    setAppMoveIn("");
    setAppOccupation("");
    setAppIncome("");
    setAppRemarks("");
  };

  const handleAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appProperty) {
      toast.error("Please select a property.");
      return;
    }
    const prop = allProperties.find((p: any) => p.property_id === Number(appProperty));
    const payloadData = {
      tenant_id: tenantContext.tenantId || 1,
      property_id: Number(appProperty),
      landlord_id: prop?.landlord_id || null,
      expected_move_in: appMoveIn || null,
      occupation: appOccupation || null,
      monthly_income: appIncome ? Number(appIncome) : null,
      remarks: appRemarks || null,
    };
    
    if (editingApp) {
      updateAppMutation.mutate({ id: editingApp.rawId, data: payloadData });
    } else {
      createAppMutation.mutate(payloadData);
    }
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryProperty || !inquiryMessage) {
      toast.error("Please fill all required fields.");
      return;
    }
    const prop = allProperties.find((p: any) => p.property_id === Number(inquiryProperty));
    inquiryMutation.mutate({
      tenant_id: tenantContext.tenantId || 1,
      property_id: Number(inquiryProperty),
      landlord_id: prop?.landlord_id || null,
      inquiry_message: inquiryMessage,
    });
  };

  const handleVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitProperty || !visitDate || !visitTime) {
      toast.error("Please fill all required fields.");
      return;
    }
    const prop = allProperties.find((p: any) => p.property_id === Number(visitProperty));
    visitMutation.mutate({
      tenant_id: tenantContext.tenantId || 1,
      property_id: Number(visitProperty),
      landlord_id: prop?.landlord_id || null,
      visit_date: visitDate,
      visit_time: visitTime,
      remarks: `Visit to ${prop?.property_name || "property"}`,
    });
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingVisit) return;
    rescheduleVisitMutation.mutate({
      id: reschedulingVisit.rawId,
      date: rescheduleDate,
      time: rescheduleTime
    });
  };

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
        <Card className="border-border/70 shadow-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">My Favorites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoadingFavorites ? (
              <p className="text-xs text-muted-foreground animate-pulse">Loading favorites...</p>
            ) : dbFavorites.length === 0 ? (
              <p className="text-xs text-muted-foreground">No favorite properties found.</p>
            ) : (
              dbFavorites.map((fav: any) => (
                <div key={fav.id} className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{fav.property_name || `Property #${fav.property_id}`}</div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/app/property/$id" params={{ id: String(fav.property_id) }}>View Property</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">My Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoadingReviews ? (
              <p className="text-xs text-muted-foreground animate-pulse">Loading reviews...</p>
            ) : dbReviews.length === 0 ? (
              <p className="text-xs text-muted-foreground">No reviews found.</p>
            ) : (
              dbReviews.map((rev: any) => (
                <div key={rev.review_id} className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{rev.review_title}</div>
                      <div className="text-xs text-muted-foreground">Rating: {rev.rating}/5 · {rev.review_date}</div>
                    </div>
                  </div>
                  {rev.review_description && (
                    <div className="text-xs bg-muted/50 p-2 rounded">
                      {rev.review_description}
                    </div>
                  )}
                  <div className="flex justify-end gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => {
                        setEditingReview(rev);
                        setReviewTitle(rev.review_title || "");
                        setReviewDesc(rev.review_description || "");
                        setReviewRating(rev.rating || 5);
                        setOpenReview(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                      onClick={() => {
                        if (confirm("Delete this review?")) deleteReviewMutation.mutate(rev.review_id);
                      }}
                      disabled={deleteReviewMutation.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">My Property Inquiries</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setOpenInquiry(true)}>
              <Plus className="mr-2 h-3.5 w-3.5" /> New Inquiry
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoadingInquiries ? (
              <p className="text-xs text-muted-foreground animate-pulse">Loading inquiries...</p>
            ) : dbInquiries.length === 0 ? (
              <p className="text-xs text-muted-foreground">No property inquiries found.</p>
            ) : (
              dbInquiries.map((inq: any) => (
                <div key={inq.id} className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{inq.propertyName}</div>
                      <div className="text-xs text-muted-foreground">Sent: {inq.date}</div>
                    </div>
                    <StatusBadge value={inq.status} />
                  </div>
                  <div className="text-xs bg-muted/50 p-2 rounded">
                    <strong>Message:</strong> {inq.message}
                  </div>
                  {inq.reply && (
                    <div className="text-xs bg-primary-soft text-primary-foreground p-2 rounded border border-primary/20">
                      <strong>Landlord Reply:</strong> {inq.reply}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">My Visit Schedules</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setOpenVisit(true)}>
              <Calendar className="mr-2 h-3.5 w-3.5" /> Schedule Visit
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoadingVisits ? (
              <p className="text-xs text-muted-foreground animate-pulse">Loading visits...</p>
            ) : dbVisits.length === 0 ? (
              <p className="text-xs text-muted-foreground">No visits scheduled.</p>
            ) : (
              dbVisits.map((v: any) => (
                <div key={v.id} className="flex items-center gap-3 rounded-md border border-border/60 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-soft text-primary flex-shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{v.propertyName}</div>
                    <div className="text-xs text-muted-foreground">
                      {v.date} at {v.time} · {v.remarks}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge value={v.status} />
                    {v.status === "Pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => {
                            setReschedulingVisit(v);
                            setRescheduleDate(v.date);
                            setRescheduleTime(v.time);
                          }}
                        >
                          Reschedule
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                          onClick={() => {
                            if (confirm("Cancel this visit?")) cancelVisitMutation.mutate(v.rawId);
                          }}
                          disabled={cancelVisitMutation.isPending}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">My Rental Applications</CardTitle>
            <Button size="sm" variant="outline" onClick={() => { setEditingApp(null); resetAppForm(); setOpenApp(true); }}>
              <Plus className="mr-2 h-3.5 w-3.5" /> New Application
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoadingApps ? (
              <p className="text-xs text-muted-foreground animate-pulse">Loading applications...</p>
            ) : dbApplications.length === 0 ? (
              <p className="text-xs text-muted-foreground">No rental applications found.</p>
            ) : (
              dbApplications.map((app: any) => (
                <div key={app.id} className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{app.propertyName}</div>
                      <div className="text-xs text-muted-foreground">Applied: {app.date}</div>
                    </div>
                    <StatusBadge value={app.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs bg-muted/50 p-2 rounded mt-2">
                    <div><strong>Move-in:</strong> {app.expectedMoveIn || "N/A"}</div>
                    <div><strong>Income:</strong> {app.monthlyIncome ? fmt(app.monthlyIncome) : "N/A"}</div>
                    <div><strong>Occupation:</strong> {app.occupation || "N/A"}</div>
                    {app.remarks && <div className="col-span-2"><strong>Remarks:</strong> {app.remarks}</div>}
                  </div>
                  {app.status === "Pending" && (
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => {
                          setEditingApp(app);
                          setAppProperty(String(app.propertyId));
                          setAppMoveIn(app.expectedMoveIn || "");
                          setAppOccupation(app.occupation || "");
                          setAppIncome(app.monthlyIncome ? String(app.monthlyIncome) : "");
                          setAppRemarks(app.remarks || "");
                          setOpenApp(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                        onClick={() => {
                          if (confirm("Cancel this application?")) cancelAppMutation.mutate(app.rawId);
                        }}
                        disabled={cancelAppMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">My Lease Agreements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoadingLeases ? (
              <p className="text-xs text-muted-foreground animate-pulse">Loading leases...</p>
            ) : dbLeases.length === 0 ? (
              <p className="text-xs text-muted-foreground">No active lease agreements found.</p>
            ) : (
              dbLeases.map((lease: any) => (
                <div key={lease.id} className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{lease.property}</div>
                      <div className="text-xs text-muted-foreground">Ref: {lease.agreementNumber}</div>
                    </div>
                    <StatusBadge value={lease.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs bg-muted/50 p-2 rounded mt-2">
                    <div><strong>Start:</strong> {lease.leaseStart || "N/A"}</div>
                    <div><strong>End:</strong> {lease.leaseEnd || "N/A"}</div>
                    <div><strong>Rent:</strong> {fmt(lease.rent)}</div>
                    <div><strong>Deposit:</strong> {fmt(lease.securityDeposit)}</div>
                  </div>
                  {lease.documentUrl && (
                    <div className="flex justify-end mt-2">
                      <Button variant="outline" size="sm" className="h-7 px-3 text-[11px]" asChild>
                        <a href={lease.documentUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-1.5 h-3 w-3" /> Download Agreement
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={openReview} onOpenChange={setOpenReview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
            <DialogDescription>Update your review details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReviewSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input required value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={reviewDesc} onChange={(e) => setReviewDesc(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Rating (1-5)</Label>
              <Input type="number" min="1" max="5" required value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenReview(false)}>Cancel</Button>
              <Button type="submit" disabled={updateReviewMutation.isPending}>
                {updateReviewMutation.isPending ? "Saving..." : "Save Review"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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

      <Dialog open={openInquiry} onOpenChange={setOpenInquiry}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Property Inquiry</DialogTitle>
            <DialogDescription>Submit an inquiry for a property you're interested in.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInquirySubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Property</Label>
              <Select value={inquiryProperty} onValueChange={setInquiryProperty}>
                <SelectTrigger><SelectValue placeholder="Select a property" /></SelectTrigger>
                <SelectContent>
                  {allProperties.map((p: any) => (
                    <SelectItem key={p.property_id} value={String(p.property_id)}>
                      {p.property_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Input value={inquiryMessage} onChange={(e) => setInquiryMessage(e.target.value)} required placeholder="I'm interested in renting this property..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenInquiry(false)}>Cancel</Button>
              <Button type="submit" disabled={inquiryMutation.isPending}>
                {inquiryMutation.isPending ? "Submitting..." : "Submit Inquiry"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openVisit} onOpenChange={setOpenVisit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Visit</DialogTitle>
            <DialogDescription>Schedule a visit to view a property.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVisitSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Property</Label>
              <Select value={visitProperty} onValueChange={setVisitProperty}>
                <SelectTrigger><SelectValue placeholder="Select a property" /></SelectTrigger>
                <SelectContent>
                  {allProperties.map((p: any) => (
                    <SelectItem key={p.property_id} value={String(p.property_id)}>
                      {p.property_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" required value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Time</Label>
                <Input type="time" required value={visitTime} onChange={(e) => setVisitTime(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenVisit(false)}>Cancel</Button>
              <Button type="submit" disabled={visitMutation.isPending}>
                {visitMutation.isPending ? "Scheduling..." : "Schedule Visit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reschedulingVisit} onOpenChange={(open) => !open && setReschedulingVisit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Visit</DialogTitle>
            <DialogDescription>Change the date and time of your scheduled visit.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRescheduleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>New Date</Label>
                <Input type="date" required value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>New Time</Label>
                <Input type="time" required value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReschedulingVisit(null)}>Cancel</Button>
              <Button type="submit" disabled={rescheduleVisitMutation.isPending}>
                {rescheduleVisitMutation.isPending ? "Rescheduling..." : "Reschedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={openApp} onOpenChange={setOpenApp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingApp ? "Edit Rental Application" : "New Rental Application"}</DialogTitle>
            <DialogDescription>Submit or update your rental application details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAppSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Property</Label>
              <Select value={appProperty} onValueChange={setAppProperty} disabled={!!editingApp}>
                <SelectTrigger><SelectValue placeholder="Select a property" /></SelectTrigger>
                <SelectContent>
                  {allProperties.map((p: any) => (
                    <SelectItem key={p.property_id} value={String(p.property_id)}>
                      {p.property_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Expected Move-in</Label>
                <Input type="date" value={appMoveIn} onChange={(e) => setAppMoveIn(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Monthly Income (INR)</Label>
                <Input type="number" placeholder="e.g. 50000" value={appIncome} onChange={(e) => setAppIncome(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Occupation</Label>
              <Input placeholder="e.g. Software Engineer" value={appOccupation} onChange={(e) => setAppOccupation(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Input placeholder="Any additional information..." value={appRemarks} onChange={(e) => setAppRemarks(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenApp(false)}>Cancel</Button>
              <Button type="submit" disabled={createAppMutation.isPending || updateAppMutation.isPending}>
                {createAppMutation.isPending || updateAppMutation.isPending ? "Saving..." : "Save Application"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
