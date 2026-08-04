import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { FileText, Upload, Download, Trash2, CheckCircle2, Clock, XCircle, File } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/features/auth/store/auth-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

export const Route = createFileRoute("/app/tenant-documents")({
  head: () => ({ meta: [{ title: "My Documents — HomeSure" }] }),
  component: TenantDocumentsPage,
});

// Mock Data
type Document = {
  id: string;
  name: string;
  type: string;
  status: "Verified" | "Pending" | "Rejected";
  uploadedAt: string;
  url: string;
};

const mockDocuments: Document[] = [
  { id: "1", name: "Government ID.pdf", type: "ID Proof", status: "Verified", uploadedAt: "2024-05-12", url: "#" },
  { id: "2", name: "Employment_Letter.pdf", type: "Income Proof", status: "Pending", uploadedAt: "2024-08-01", url: "#" },
];

function TenantDocumentsPage() {
  const session = useSession();
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [openUpload, setOpenUpload] = useState(false);
  const [uploadType, setUploadType] = useState("ID Proof");
  const [isUploading, setIsUploading] = useState(false);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      setDocuments(documents.filter(d => d.id !== id));
      toast.success("Document deleted successfully");
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setTimeout(() => {
      const newDoc: Document = {
        id: Math.random().toString(),
        name: `Uploaded_${uploadType.replace(" ", "_")}.pdf`,
        type: uploadType,
        status: "Pending",
        uploadedAt: new Date().toISOString().split("T")[0],
        url: "#",
      };
      setDocuments([newDoc, ...documents]);
      setIsUploading(false);
      setOpenUpload(false);
      toast.success("Document uploaded successfully");
    }, 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Verified": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "Pending": return <Clock className="h-4 w-4 text-amber-500" />;
      case "Rejected": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 pb-12 overflow-x-hidden">
      <PageHeader
        title="My Documents"
        description="Upload and manage your verification documents."
        actions={
          <Dialog open={openUpload} onOpenChange={setOpenUpload}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Upload className="mr-2 h-4 w-4" /> Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select value={uploadType} onValueChange={setUploadType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ID Proof">ID Proof (Passport, Driving License)</SelectItem>
                      <SelectItem value="Income Proof">Income Proof (Payslips, Bank Statement)</SelectItem>
                      <SelectItem value="Address Proof">Address Proof</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>File</Label>
                  <div className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center flex flex-col items-center justify-center bg-muted/30">
                    <FileText className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                    <p className="text-sm font-medium">Click or drag file to upload</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 10MB</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenUpload(false)}>Cancel</Button>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? "Uploading..." : "Upload"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map(doc => (
          <Card key={doc.id} className="relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-1 h-full ${
              doc.status === "Verified" ? "bg-green-500" :
              doc.status === "Pending" ? "bg-amber-500" : "bg-red-500"
            }`} />
            <CardContent className="p-5 flex items-start gap-4">
              <div className="h-10 w-10 shrink-0 bg-primary/10 rounded-full flex items-center justify-center">
                <File className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate" title={doc.name}>{doc.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{doc.type} • {doc.uploadedAt}</p>
                <div className="flex items-center gap-1.5 mt-2 text-xs font-medium">
                  {getStatusIcon(doc.status)}
                  <span className={
                    doc.status === "Verified" ? "text-green-600 dark:text-green-400" :
                    doc.status === "Pending" ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                  }>{doc.status}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" asChild>
                  <a href={doc.url} download title="Download">
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(doc.id)} title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {documents.length === 0 && (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-border/60 rounded-xl">
            <p className="text-muted-foreground">No documents uploaded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
