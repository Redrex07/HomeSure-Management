import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatCard } from "@/shared/components/common/StatCard";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataTable } from "@/shared/components/common/DataTable";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getServiceDocuments,
  createServiceDocument,
  updateServiceDocument,
  deleteServiceDocument,
  getServiceRequests,
  getContractors,
} from "@/core/db/supabase-queries";
import { supabase } from "@/core/db/supabase";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Edit2,
  Eye,
  FileCheck,
  HardHat,
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/shared/components/ui/progress";

export const Route = createFileRoute("/app/service-documents")({
  head: () => ({ meta: [{ title: "Service Documents — HomeSure" }] }),
  component: ServiceDocumentsPage,
});

function ServiceDocumentsPage() {
  const queryClient = useQueryClient();

  const [openUpload, setOpenUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("Other");
  const [selectedRequest, setSelectedRequest] = useState("none");
  const [selectedContractor, setSelectedContractor] = useState("none");

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [renamingDoc, setRenamingDoc] = useState<any | null>(null);
  const [newName, setNewName] = useState("");

  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  // Queries
  const { data: documents = [], isLoading, isError, error } = useQuery({
    queryKey: ["service-documents"],
    queryFn: getServiceDocuments,
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["service-requests"],
    queryFn: getServiceRequests,
  });

  const { data: contractors = [] } = useQuery({
    queryKey: ["contractors"],
    queryFn: getContractors,
  });

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: createServiceDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-documents"] });
      toast.success("Document registered successfully!");
      setOpenUpload(false);
      setUploadFile(null);
      setDocName("");
      setDocType("Other");
      setSelectedRequest("none");
      setSelectedContractor("none");
      setUploadProgress(0);
    },
    onError: (err: any) => {
      toast.error("Failed to register document metadata: " + (err.message || String(err)));
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      updateServiceDocument(id, { document_name: name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-documents"] });
      toast.success("Document renamed successfully!");
      setRenamingDoc(null);
      setNewName("");
    },
    onError: (err: any) => {
      toast.error("Failed to rename document: " + (err.message || String(err)));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (doc: any) => deleteServiceDocument(doc.id),
    onSuccess: (_, doc) => {
      queryClient.invalidateQueries({ queryKey: ["service-documents"] });
      toast.success("Document deleted successfully!");
      const storagePath = doc.url.split("/storage/v1/object/public/service-documents/")[1];
      if (storagePath) {
        supabase.storage
          .from("service-documents")
          .remove([storagePath])
          .then(({ error }) => {
            if (error) console.error("Error removing file from storage:", error);
          });
      }
    },
    onError: (err: any) => {
      toast.error("Failed to delete document: " + (err.message || String(err)));
    },
  });

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!docName) {
        setDocName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error("Please choose a file to upload.");
      return;
    }

    if (uploadFile.size > 10 * 1024 * 1024) {
      toast.error("File size cannot exceed 10MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const fileName = `${Date.now()}-${uploadFile.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
      
      const interval = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 100);

      const { data, error: uploadErr } = await supabase.storage
        .from("service-documents")
        .upload(`documents/${fileName}`, uploadFile, {
          cacheControl: "3600",
          upsert: false,
        });

      clearInterval(interval);

      if (uploadErr) throw uploadErr;

      setUploadProgress(100);

      const { data: publicUrlData } = supabase.storage
        .from("service-documents")
        .getPublicUrl(data.path);

      const reqId = selectedRequest !== "none" ? parseInt(selectedRequest, 10) : null;
      const contractorId = selectedContractor !== "none" ? parseInt(selectedContractor, 10) : null;
      
      let propertyId = null;
      if (reqId) {
        const associatedReq = requests.find((r: any) => r.requestId === reqId);
        if (associatedReq) {
          propertyId = associatedReq.propertyId || null;
        }
      }

      uploadMutation.mutate({
        service_request_id: reqId,
        property_id: propertyId,
        contractor_id: contractorId,
        uploaded_by: 1,
        document_name: docName || uploadFile.name,
        document_type: docType,
        document_url: publicUrlData.publicUrl,
        document_size: uploadFile.size,
      });
    } catch (err: any) {
      console.error(err);
      toast.error(`Upload failed: ${err.message || String(err)}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingDoc || !newName.trim()) return;
    renameMutation.mutate({ id: renamingDoc.id, name: newName.trim() });
  };

  // Metrics
  const totalCount = documents.length;
  const imageOrPdfCount = documents.filter(
    (d: any) => d.type === "Image" || d.type === "PDF" || d.name.toLowerCase().endsWith(".pdf") || d.name.toLowerCase().match(/\.(jpg|jpeg|png)$/)
  ).length;
  const totalSizeBytes = documents.reduce((s: number, d: any) => s + (d.size || 0), 0);
  const totalSizeMB = (totalSizeBytes / 1024 / 1024).toFixed(2);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <>
      <PageHeader
        title="Service Documents"
        description="Manage service admin files, estimate quotes, invoices, and warranties."
        actions={
          <Button size="sm" onClick={() => setOpenUpload(true)}>
            <Upload className="mr-2 h-4 w-4" /> Upload document
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total documents"
          value={String(totalCount)}
          icon={FileText}
        />
        <StatCard
          label="Images & PDFs"
          value={String(imageOrPdfCount)}
          icon={FileCheck}
          tone="success"
        />
        <StatCard
          label="Total storage used"
          value={`${totalSizeMB} MB`}
          icon={HardHat}
          tone="info"
        />
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center border border-border/60 rounded-md bg-background/50">
          <p className="text-sm text-muted-foreground animate-pulse">Loading documents...</p>
        </div>
      ) : isError ? (
        <div className="flex h-64 flex-col items-center justify-center border border-destructive/30 rounded-md bg-destructive-soft p-6 text-center">
          <p className="text-sm font-semibold text-destructive mb-2">Failed to load documents</p>
          <p className="text-xs text-muted-foreground max-w-md">
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      ) : (
        <DataTable
          rows={documents}
          filterKeys={["name", "propertyName", "contractorName"]}
          empty="No Service Documents Found"
          columns={[
            {
              key: "name",
              header: "Name",
              render: (d) => (
                <div className="flex items-center gap-2 max-w-[240px]">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate font-medium" title={d.name}>
                    {d.name}
                  </span>
                </div>
              ),
            },
            {
              key: "type",
              header: "Type",
              render: (d) => <StatusBadge value={d.type} />,
            },
            {
              key: "requestId",
              header: "Request ID",
              render: (d) => (
                <span className="font-mono text-xs text-muted-foreground">
                  {d.requestId ? `SR-${d.requestId}` : "—"}
                </span>
              ),
            },
            {
              key: "propertyName",
              header: "Property",
              render: (d) => <span className="text-xs text-muted-foreground">{d.propertyName}</span>,
            },
            {
              key: "contractorName",
              header: "Contractor",
              render: (d) => <span className="text-xs text-muted-foreground">{d.contractorName}</span>,
            },
            {
              key: "size",
              header: "Size",
              render: (d) => <span className="text-xs text-muted-foreground">{formatSize(d.size)}</span>,
            },
            {
              key: "uploadedAt",
              header: "Uploaded At",
              render: (d) => (
                <span className="text-xs text-muted-foreground">
                  {d.uploadedAt ? d.uploadedAt.split("T")[0] : "—"}
                </span>
              ),
            },
            {
              key: "actions",
              header: "",
              render: (d) => (
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      setPreviewDoc(d);
                    }}
                    title="Preview"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      setRenamingDoc(d);
                      setNewName(d.name);
                    }}
                    title="Rename"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    asChild
                    title="Download"
                  >
                    <a href={d.url} download target="_blank" rel="noopener noreferrer">
                      <Download className="h-3.5 w-3.5 text-slate-500 hover:text-slate-900" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this document?")) {
                        deleteMutation.mutate(d);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}

      {/* Upload Dialog */}
      <Dialog open={openUpload} onOpenChange={(open) => !open && !isUploading && setOpenUpload(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload a file to Supabase storage and link it to service requests or contractors.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Choose File</Label>
              <Input
                type="file"
                required
                accept=".pdf,image/*,.doc,.docx"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <p className="text-[10px] text-muted-foreground">Supported files: PDF, PNG, JPG, JPEG, Word (Max 10MB)</p>
            </div>

            <div className="space-y-2">
              <Label>Document Name</Label>
              <Input
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="e.g. Roof Repair Invoice"
                required
                disabled={isUploading}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select value={docType} onValueChange={setDocType} disabled={isUploading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="Image">Image</SelectItem>
                    <SelectItem value="Invoice">Invoice</SelectItem>
                    <SelectItem value="Warranty">Warranty</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Linked Service Request</Label>
                <Select value={selectedRequest} onValueChange={setSelectedRequest} disabled={isUploading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select request" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (General)</SelectItem>
                    {requests.map((r: any) => (
                      <SelectItem key={r.requestId} value={String(r.requestId)}>
                        SR-{r.requestId} · {r.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Linked Contractor</Label>
              <Select value={selectedContractor} onValueChange={setSelectedContractor} disabled={isUploading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contractor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {contractors.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id.replace("C-", ""))}>
                      {c.name} ({c.trade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isUploading && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Uploading file...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1.5" />
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenUpload(false)} disabled={isUploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading || uploadMutation.isPending}>
                {isUploading ? "Uploading..." : uploadMutation.isPending ? "Saving..." : "Upload File"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!renamingDoc} onOpenChange={(open) => !open && setRenamingDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
            <DialogDescription>Enter a new name for the document.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Document Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. New Invoice Name"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenamingDoc(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={renameMutation.isPending}>
                {renameMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewDoc?.name}</DialogTitle>
            <DialogDescription>Uploaded by {previewDoc?.uploaderName} on {previewDoc?.uploadedAt?.split("T")[0]}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-slate-50 min-h-[300px]">
            {previewDoc?.url && (previewDoc.type === "Image" || previewDoc.name.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) ? (
              <img
                src={previewDoc.url}
                alt={previewDoc.name}
                className="max-h-[400px] w-auto object-contain rounded-md shadow-sm"
              />
            ) : previewDoc?.url && (previewDoc.type === "PDF" || previewDoc.name.toLowerCase().endsWith(".pdf")) ? (
              <div className="flex flex-col items-center gap-3">
                <FileText className="h-16 w-16 text-primary stroke-1" />
                <p className="text-sm font-semibold text-slate-800">PDF Document</p>
                <p className="text-xs text-muted-foreground">PDF preview is supported on external viewer.</p>
                <Button asChild size="sm">
                  <a href={previewDoc.url} target="_blank" rel="noopener noreferrer">
                    Open PDF in New Tab
                  </a>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <FileText className="h-16 w-16 text-slate-400 stroke-1" />
                <p className="text-sm font-semibold text-slate-800">Document File</p>
                <p className="text-xs text-muted-foreground">{formatSize(previewDoc?.size || 0)} · {previewDoc?.type || "Other"}</p>
                <Button asChild size="sm" variant="outline">
                  <a href={previewDoc?.url} download target="_blank" rel="noopener noreferrer">
                    Download File
                  </a>
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setPreviewDoc(null)}>Close Preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
