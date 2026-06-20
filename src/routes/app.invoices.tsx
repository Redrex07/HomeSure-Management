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
import { getInvoices, updateInvoiceStatus } from "@/core/db/supabase-queries";
import { Download, Receipt, DollarSign, AlertTriangle, Clock, Printer, Pencil } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/shared/utils/utils";

export const Route = createFileRoute("/app/invoices")({
  head: () => ({ meta: [{ title: "Invoices — HomeSure" }] }),
  component: InvoicesPage,
});

function InvoicesPage() {
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: getInvoices,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; status: string; reason?: string }) =>
      updateInvoiceStatus(payload.id, { status: payload.status, reason: payload.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice updated successfully!");
      setEditingInvoice(null);
    },
    onError: (err: any) => {
      toast.error("Error updating invoice: " + (err.message || String(err)));
    },
  });

  const paid = invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const pending = invoices.filter((i) => i.status === "Pending").reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === "Overdue").reduce((s, i) => s + i.amount, 0);

  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingInvoice) return;
    const formData = new FormData(e.currentTarget);
    const newStatus = formData.get("status") as string;
    const newReason = formData.get("reason") as string;
    
    updateMutation.mutate({
      id: editingInvoice.id,
      status: newStatus,
      reason: newReason,
    });
  };

  const getInvoiceHTML = (invoice: any) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.id}</title>
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px; color: #1e293b; }
        .document { background-color: #ffffff; max-width: 800px; margin: 0 auto; padding: 50px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border-top: 8px solid #4f46e5; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 30px; margin-bottom: 40px; }
        .logo-section .logo { font-size: 28px; font-weight: 800; color: #4f46e5; letter-spacing: -1px; margin-bottom: 5px; }
        .logo-section .company-details { font-size: 14px; color: #64748b; line-height: 1.5; }
        .invoice-details { text-align: right; }
        .invoice-title { font-size: 32px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0; letter-spacing: 1px; }
        .info-grid { display: grid; grid-template-columns: auto 1fr; gap: 8px 20px; font-size: 14px; }
        .info-label { color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 12px; text-align: right; }
        .info-val { color: #0f172a; font-weight: 500; text-align: left; }
        .bill-to { margin-bottom: 40px; }
        .bill-to-title { font-size: 14px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 10px; }
        .bill-to-address { font-size: 15px; color: #0f172a; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
        th { text-align: left; padding: 12px 15px; background: #f1f5f9; color: #475569; font-size: 13px; text-transform: uppercase; font-weight: 600; border-radius: 4px; }
        td { padding: 15px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 15px; }
        .qty, .price, .total { text-align: right; }
        .summary { width: 300px; margin-left: auto; }
        .summary-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 15px; color: #475569; }
        .summary-total { border-top: 2px solid #e2e8f0; margin-top: 10px; padding-top: 15px; font-size: 20px; font-weight: 700; color: #0f172a; }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .status-Paid { background: #dcfce7; color: #166534; }
        .status-Pending { background: #fef08a; color: #854d0e; }
        .status-Overdue { background: #fee2e2; color: #991b1b; }
        .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 13px; line-height: 1.5; }
        @media print { body { background-color: #fff; padding: 0; } .document { box-shadow: none; border-top: none; padding: 0; max-width: 100%; } }
    </style>
</head>
<body>
    <div class="document">
        <div class="header">
            <div class="logo-section">
                <div class="logo">HomeSure</div>
                <div class="company-details">
                    HomeSure Management LLC<br>
                    123 Property Ave, Suite 100<br>
                    Austin, TX 78701<br>
                    billing@homesure.app
                </div>
            </div>
            <div class="invoice-details">
                <div class="invoice-title">INVOICE</div>
                <div class="info-grid">
                    <div class="info-label">Invoice #</div>
                    <div class="info-val">${invoice.id}</div>
                    <div class="info-label">Date Issued</div>
                    <div class="info-val">${invoice.issued}</div>
                    <div class="info-label">Due Date</div>
                    <div class="info-val">${invoice.due}</div>
                    <div class="info-label">Status</div>
                    <div class="info-val"><span class="status-badge status-${invoice.status}">${invoice.status}</span></div>
                </div>
            </div>
        </div>

        <div class="bill-to">
            <div class="bill-to-title">Bill To</div>
            <div class="bill-to-address">
                <strong>Tenant / Property Client</strong><br>
                For Service Request: ${invoice.request}<br>
                Payment Due: ${invoice.due}
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="qty">Qty</th>
                    <th class="price">Price</th>
                    <th class="total">Total</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>Maintenance Service</strong><br>
                        <span style="color: #64748b; font-size: 13px;">Labor and materials for ${invoice.request}</span>
                    </td>
                    <td class="qty">1</td>
                    <td class="price">${formatINR(invoice.amount)}</td>
                    <td class="total">${formatINR(invoice.amount)}</td>
                </tr>
            </tbody>
        </table>

        <div class="summary">
            <div class="summary-row">
                <span>Subtotal</span>
                <span>${formatINR(invoice.amount)}</span>
            </div>
            <div class="summary-row">
                <span>Tax (0%)</span>
                <span>₹0</span>
            </div>
            <div class="summary-row summary-total">
                <span>Total Due</span>
                <span>${formatINR(invoice.amount)}</span>
            </div>
        </div>

        <div class="footer">
            Thank you for your business. Please make payments payable to HomeSure Management LLC.<br>
            If you have any questions concerning this invoice, contact billing@homesure.app.
        </div>
    </div>
</body>
</html>
    `;
  };

  const handleDownloadInvoice = (invoice: any) => {
    const htmlContent = getInvoiceHTML(invoice);
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice_${invoice.id}.html`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded invoice ${invoice.id}`);
  };

  const handlePrintInvoice = (invoice: any) => {
    const htmlContent = getInvoiceHTML(invoice);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      toast.error("Please allow popups to print the invoice.");
    }
  };

  return (
    <>
      <PageHeader title="Invoices" description="Track billing, payments and overdue accounts." />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center border border-border/60 rounded-md bg-background/50">
          <p className="text-sm text-muted-foreground animate-pulse">Loading invoices...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Paid (mo)"
              value={formatINR(paid)}
              icon={DollarSign}
              tone="success"
            />
            <StatCard
              label="Pending"
              value={formatINR(pending)}
              icon={Clock}
              tone="warning"
            />
            <StatCard
              label="Overdue"
              value={formatINR(overdue)}
              icon={AlertTriangle}
              tone="destructive"
            />
          </div>
          <DataTable
            rows={invoices}
            filterKeys={["id", "request"]}
            columns={[
              {
                key: "id",
                header: "Invoice",
                render: (i) => <span className="font-mono text-xs">{i.id}</span>,
              },
              {
                key: "request",
                header: "Request",
                render: (i) => (
                  <span className="font-mono text-xs text-muted-foreground">{i.request}</span>
                ),
              },
              { key: "issued", header: "Issued" },
              { key: "due", header: "Due" },
              {
                key: "amount",
                header: "Amount",
                sortable: true,
                render: (i) => <span className="font-medium">{formatINR(i.amount)}</span>,
              },
              { 
                key: "status", 
                header: "Status", 
                render: (i) => (
                  <div className="flex flex-col items-start gap-1">
                    <StatusBadge value={i.status} />
                    {i.reason && (
                      <span className="text-[10px] text-muted-foreground max-w-[120px] truncate" title={i.reason}>
                        {i.reason}
                      </span>
                    )}
                  </div>
                )
              },
              {
                key: "actions",
                header: "",
                render: (i) => (
                  <div className="flex items-center gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-primary-soft hover:text-primary"
                      disabled={updateMutation.isPending}
                      onClick={() => setEditingInvoice(i)}
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-primary-soft hover:text-primary"
                      onClick={() => handlePrintInvoice(i)}
                      title="Print"
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-primary-soft hover:text-primary"
                      onClick={() => handleDownloadInvoice(i)}
                      title="Download"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </>
      )}


      <Dialog open={!!editingInvoice} onOpenChange={(open) => !open && setEditingInvoice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Invoice {editingInvoice?.id}</DialogTitle>
            <DialogDescription>Update the invoice status or add a reason note.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select name="status" defaultValue={editingInvoice?.status || "Pending"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Reason / Note</Label>
              <Input
                name="reason"
                placeholder="e.g. Paid in cash, Late due to bank holiday"
                defaultValue={editingInvoice?.reason || ""}
              />
              <p className="text-xs text-muted-foreground">Optional reason or note regarding this invoice.</p>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setEditingInvoice(null)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
