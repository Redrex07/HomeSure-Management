import { useState, useEffect } from "react";
import { useSession } from "@/features/auth/store/auth-store";
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
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatCard } from "@/shared/components/common/StatCard";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataTable } from "@/shared/components/common/DataTable";
import { useTenantContext } from "@/features/tenant/hooks/useTenantContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getInvoices,
  recordRentPaymentSuccess,
  updateInvoiceStatus as updateSupabaseInvoice,
  getServiceRequests,
  getContractors,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getTenantInvoices,
} from "@/core/db/supabase-queries";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/core/api/razorpay.functions";
import { Download, Receipt, DollarSign, AlertTriangle, Clock, Printer, Pencil, CreditCard, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/shared/utils/utils";
const formatUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const Route = createFileRoute("/app/invoices")({
  head: () => ({ meta: [{ title: "Invoices — HomeSure" }] }),
  component: InvoicesPage,
});

export type UnifiedInvoice = any & { isLocal?: boolean };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, callback: (response: any) => void) => void;
    };
  }
}

function loadRazorpayCheckout() {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("Payments are only available in the browser."));
    if (window.Razorpay) return resolve();

    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load Razorpay Checkout.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay Checkout."));
    document.body.appendChild(script);
  });
}

function InvoicesPage() {
  const session = useSession();
  const isContractor = session?.role === "contractor";
  const formatCurrency = (amount: number) =>
    isContractor ? formatUsd.format(amount) : formatINR(amount);

  const queryClient = useQueryClient();

  const [openCreate, setOpenCreate] = useState(false);
  const [createRequestId, setCreateRequestId] = useState("");
  const [createContractorId, setCreateContractorId] = useState("");
  const [createAmount, setCreateAmount] = useState("");
  const [createMethod, setCreateMethod] = useState("Bank Transfer");
  const [createReference, setCreateReference] = useState("");

  const tenantContext = useTenantContext();
  
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", session?.role, tenantContext.tenantId],
    queryFn: () => {
      if (session?.role === "tenant" && tenantContext.tenantId) {
        return getTenantInvoices(tenantContext.tenantId, tenantContext.serviceTenantId);
      }
      return getInvoices();
    },
  });

  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  const { data: serviceRequests = [] } = useQuery({
    queryKey: ["service-requests"],
    queryFn: getServiceRequests,
  });

  const { data: contractors = [] } = useQuery({
    queryKey: ["contractors"],
    queryFn: getContractors,
  });

  const createMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Payment created successfully!");
      setOpenCreate(false);
      setCreateRequestId("");
      setCreateContractorId("");
      setCreateAmount("");
      setCreateReference("");
    },
    onError: (err: any) => {
      toast.error("Error creating payment: " + (err.message || String(err)));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ 
      id, 
      amount, 
      status, 
      payment_method, 
      payment_reference, 
      payment_date, 
      receipt_document 
    }: { 
      id: string; 
      amount?: number;
      status?: string; 
      payment_method?: string;
      payment_reference?: string;
      payment_date?: string;
      receipt_document?: string;
    }) =>
      updateInvoice(id, { 
        amount, 
        status, 
        payment_method, 
        payment_reference, 
        payment_date, 
        receipt_document 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Payment details updated successfully!");
      setEditingInvoice(null);
    },
    onError: (err: any) => {
      toast.error("Error updating payment: " + (err.message || String(err)));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Payment deleted successfully!");
    },
    onError: (err: any) => {
      toast.error("Error deleting payment: " + (err.message || String(err)));
    },
  });

  const paid = invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const pending = invoices.filter((i) => i.status === "Pending").reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === "Overdue").reduce((s, i) => s + i.amount, 0);

  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createRequestId || !createContractorId || !createAmount) {
      toast.error("Please fill in all fields");
      return;
    }
    createMutation.mutate({
      service_request_id: parseInt(createRequestId.replace("SR-", ""), 10),
      contractor_id: parseInt(createContractorId.replace("C-", ""), 10),
      amount: parseFloat(createAmount),
      payment_method: createMethod,
      payment_reference: createReference,
    });
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingInvoice) return;
    const formData = new FormData(e.currentTarget);
    
    updateMutation.mutate({
      id: editingInvoice.id,
      amount: parseFloat(formData.get("amount") as string),
      status: formData.get("status") as string,
      payment_method: formData.get("payment_method") as string,
      payment_reference: formData.get("payment_reference") as string,
      payment_date: formData.get("payment_date") as string,
      receipt_document: formData.get("receipt_document") as string,
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
                    <td class="price">${formatCurrency(invoice.amount)}</td>
                    <td class="total">${formatCurrency(invoice.amount)}</td>
                </tr>
            </tbody>
        </table>

        <div class="summary">
            <div class="summary-row">
                <span>Subtotal</span>
                <span>${formatCurrency(invoice.amount)}</span>
            </div>
            <div class="summary-row">
                <span>Tax (0%)</span>
                <span>${formatCurrency(0)}</span>
            </div>
            <div class="summary-row summary-total">
                <span>Total Due</span>
                <span>${formatCurrency(invoice.amount)}</span>
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

  const handlePayInvoice = async (invoice: any) => {
    if (!invoice?.amount || Number(invoice.amount) <= 0) {
      toast.error("This invoice does not have a payable amount.");
      return;
    }

    setPayingInvoiceId(invoice.id);
    try {
      await loadRazorpayCheckout();
      const amountInPaise = Math.round(Number(invoice.amount) * 100);
      const order = await createRazorpayOrder({
        data: {
          amount: amountInPaise,
          currency: "INR",
          receipt: String(invoice.id).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40),
          notes: {
            invoice_id: String(invoice.id),
            user_email: session?.email || "",
          },
        },
      });

      await new Promise<void>((resolve, reject) => {
        const RazorpayCheckout = window.Razorpay;
        if (!RazorpayCheckout) {
          reject(new Error("Razorpay Checkout did not load."));
          return;
        }

        const checkout = new RazorpayCheckout({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "HomeSure",
          description: `Rent payment ${invoice.id}`,
          order_id: order.orderId,
          prefill: {
            name: session?.name || "",
            email: session?.email || "",
          },
          theme: { color: "#4f46e5" },
          handler: async (response: any) => {
            try {
              await verifyRazorpayPayment({ data: response });
              await recordRentPaymentSuccess(invoice, {
                payment_method: "Razorpay",
                payment_reference: response.razorpay_payment_id,
                receipt_url: `https://dashboard.razorpay.com/app/payments/${response.razorpay_payment_id}`,
              });
              queryClient.invalidateQueries({ queryKey: ["invoices"] });
              toast.success("Rent payment completed successfully.");
              resolve();
            } catch (error) {
              reject(error);
            }
          },
        });

        checkout.on("payment.failed", (response: any) => {
          reject(new Error(response?.error?.description || "Razorpay payment failed."));
        });
        checkout.open();
      });
    } catch (err: any) {
      toast.error("Payment failed: " + (err.message || String(err)));
    } finally {
      setPayingInvoiceId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Track billing, payments and overdue accounts."
        actions={
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            {!(session?.role === "tenant") && (<DialogTrigger asChild><Button size="sm"><Receipt className="mr-2 h-4 w-4" /> Create payment</Button></DialogTrigger>)}
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Payment</DialogTitle>
                <DialogDescription>
                  Generate a billing record for a completed request.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Service Request</Label>
                  <Select value={createRequestId} onValueChange={setCreateRequestId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service request" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceRequests.map((sr: any) => (
                        <SelectItem key={sr.id} value={sr.id}>
                          {sr.id}: {sr.title} ({sr.property})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Contractor</Label>
                  <Select value={createContractorId} onValueChange={setCreateContractorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select contractor" />
                    </SelectTrigger>
                    <SelectContent>
                      {contractors.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.trade})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Amount (INR)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 7500"
                    required
                    value={createAmount}
                    onChange={(e) => setCreateAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Payment Method</Label>
                  <Select value={createMethod} onValueChange={setCreateMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Reference</Label>
                  <Input
                    placeholder="e.g. TXN-129038, Check #402"
                    value={createReference}
                    onChange={(e) => setCreateReference(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Paid (mo)"
          value={formatCurrency(paid)}
          icon={DollarSign}
          tone="success"
        />
        <StatCard
          label="Pending"
          value={formatCurrency(pending)}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Overdue"
          value={formatCurrency(overdue)}
          icon={AlertTriangle}
          tone="destructive"
        />
      </div>
      {isLoading ? (
        <div className="flex h-64 items-center justify-center border border-border/60 rounded-md bg-background/50">
          <p className="text-sm text-muted-foreground animate-pulse">Loading invoices...</p>
        </div>
      ) : (
        <DataTable
          rows={invoices}
          filterKeys={["id", "request", "propertyName", "tenantName", "landlordName", "contractorName", "reference"]}
          empty="No Invoices Found"
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
              render: (i) => <span className="font-medium">{formatCurrency(i.amount)}</span>,
            },
            {
              key: "method",
              header: "Method",
              render: (i: any) => <span className="text-xs text-muted-foreground">{i.method || i.payment_method || "-"}</span>,
            },
            {
              key: "reference",
              header: "Ref",
              render: (i: any) => <span className="text-xs text-muted-foreground">{i.reference || i.payment_reference || "-"}</span>,
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
                  {!(session?.role === "tenant") && (<Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-primary-soft hover:text-primary"
                    onClick={() => setEditingInvoice(i)}
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>)}
                  {session?.role === "tenant" && i.status !== "Paid" && i.status !== "Successful" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-primary-soft hover:text-primary"
                      onClick={() => handlePayInvoice(i)}
                      disabled={payingInvoiceId === i.id}
                      title="Pay rent"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                    </Button>
                  )}
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
                    onClick={() => {
                      if (i.receipt) {
                        window.open(i.receipt, "_blank");
                      } else {
                        handleDownloadInvoice(i);
                      }
                    }}
                    title={i.receipt ? "Download Receipt" : "Download Invoice"}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  {!(session?.role === "tenant") && (<Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this payment?")) {
                        deleteMutation.mutate(i.id);
                      }
                    }}
                    title="Delete payment"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>)}
                </div>
              ),
            },
          ]}
        />
      )}


      <Dialog open={!!editingInvoice} onOpenChange={(open) => !open && setEditingInvoice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment {editingInvoice?.id}</DialogTitle>
            <DialogDescription>Update payment status, amount, reference, method, date, or receipt document.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={editingInvoice?.amount || ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Date</Label>
                <Input
                  name="payment_date"
                  type="date"
                  required
                  defaultValue={editingInvoice?.issued || ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select name="status" defaultValue={editingInvoice?.status || "Pending"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                    <SelectItem value="Refunded">Refunded</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select name="payment_method" defaultValue={editingInvoice?.method || "Bank Transfer"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Reference</Label>
              <Input
                name="payment_reference"
                placeholder="e.g. TXN-129038, Check #402"
                defaultValue={editingInvoice?.reference || ""}
              />
            </div>

            <div className="space-y-2">
              <Label>Receipt Document Path</Label>
              <Input
                name="receipt_document"
                placeholder="e.g. receipts/invoice-101.pdf"
                defaultValue={editingInvoice?.receipt || ""}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setEditingInvoice(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
