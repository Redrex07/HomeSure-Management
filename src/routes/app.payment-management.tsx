import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  HardHat,
  Download,
  Plus,
  Search,
  Receipt,
  Sparkles,
  RefreshCw,
  XCircle,
  Building2,
  Check,
  Info,
  Wallet,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/shared/utils/utils";
import {
  usePayments,
  approvePayment,
  rejectPayment,
  createPayment,
  ContractorPayment,
} from "@/shared/utils/payment-management-store";

export const Route = createFileRoute("/app/payment-management")({
  head: () => ({ meta: [{ title: "Payment Management — HomeSure Landlord" }] }),
  component: PaymentManagementPage,
});

function PaymentManagementPage() {
  const payments = usePayments();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Modals state
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<ContractorPayment | null>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<ContractorPayment["paymentMethod"]>("Bank Transfer");

  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [voucherPayment, setVoucherPayment] = useState<ContractorPayment | null>(null);

  const [newPayoutModalOpen, setNewPayoutModalOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    serviceTitle: "",
    property: "",
    contractorName: "Contractor",
    contractorRole: "Master Contractor",
    amount: "",
    category: "Maintenance" as ContractorPayment["category"],
    adminVerificationNote: "Verified by Service Admin. Work completed satisfactorily.",
    paymentMethod: "Bank Transfer" as ContractorPayment["paymentMethod"],
  });

  // Derived metrics
  const totalPaid = payments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingCount = payments.filter((p) => p.status === "Pending Approval").length;
  const pendingAmount = payments
    .filter((p) => p.status === "Pending Approval")
    .reduce((sum, p) => sum + p.amount, 0);

  const verifiedCount = payments.filter((p) => p.verifiedByAdmin).length;

  // Filtered payments
  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.serviceTitle.toLowerCase().includes(search.toLowerCase()) ||
      p.property.toLowerCase().includes(search.toLowerCase()) ||
      p.contractorName.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || p.category.toLowerCase() === selectedCategory.toLowerCase();

    if (!matchesSearch || !matchesCategory) return false;

    if (activeTab === "pending") return p.status === "Pending Approval";
    if (activeTab === "verified") return p.verifiedByAdmin;
    if (activeTab === "paid") return p.status === "Paid";
    if (activeTab === "rejected") return p.status === "Rejected";
    return true;
  });

  const handleOpenApproveModal = (p: ContractorPayment) => {
    setSelectedPayment(p);
    setApprovalNote("");
    setPaymentMethod(p.paymentMethod);
    setApproveModalOpen(true);
  };

  const handleConfirmApproval = () => {
    if (!selectedPayment) return;
    approvePayment(selectedPayment.id, approvalNote, paymentMethod);
    toast.success(`Payment ${selectedPayment.id} approved and marked as Paid!`);
    setApproveModalOpen(false);
    setSelectedPayment(null);
  };

  const handleReject = (p: ContractorPayment) => {
    const reason = prompt("Reason for rejecting payout:");
    if (reason) {
      rejectPayment(p.id, reason);
      toast.error(`Payment ${p.id} rejected.`);
    }
  };

  const handleOpenVoucher = (p: ContractorPayment) => {
    setVoucherPayment(p);
    setVoucherModalOpen(true);
  };

  const handleDownloadReceipt = (voucher: ContractorPayment) => {
    const formattedContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt Voucher ${voucher.id}</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 40px; display: flex; justify-content: center; }
    .receipt-container { background: #ffffff; width: 100%; max-width: 800px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #0f172a; color: #ffffff; padding: 32px 40px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
    .header p { margin: 4px 0 0; font-size: 14px; color: #94a3b8; }
    .header-right { text-align: right; }
    .header-right .ref { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600; margin-top: 8px; display: inline-block; }
    .content { padding: 40px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 40px; }
    .grid-item { background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9; }
    .grid-item span { display: block; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; margin-bottom: 4px; }
    .grid-item strong { display: block; font-size: 15px; color: #0f172a; }
    .details { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
    .details th, .details td { padding: 16px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .details th { font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; background: #f8fafc; }
    .details td { font-size: 15px; color: #334155; }
    .details .amount { font-weight: 700; color: #0f172a; text-align: right; }
    .details th.text-right { text-align: right; }
    .total-section { display: flex; justify-content: flex-end; margin-bottom: 40px; }
    .total-box { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 24px 32px; border-radius: 12px; text-align: right; min-width: 300px; }
    .total-box .label { font-size: 14px; color: #047857; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; display: block; }
    .total-box .value { font-size: 32px; font-weight: 800; color: #065f46; letter-spacing: -0.025em; }
    .footer { border-top: 2px dashed #e2e8f0; padding-top: 32px; font-size: 13px; color: #64748b; line-height: 1.6; }
    .footer strong { color: #334155; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; margin-top: 8px; }
    @media print {
      body { background: white; padding: 0; }
      .receipt-container { box-shadow: none; border: none; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <div>
        <h1>HomeSure Management</h1>
        <p>Contractor Payout Receipt Voucher</p>
      </div>
      <div class="header-right">
        <div>Receipt Code: <strong>${voucher.id}</strong></div>
        <div class="ref">${voucher.transactionRef || "TXN-AUTO-9981"}</div>
      </div>
    </div>
    <div class="content">
      <div class="grid">
        <div class="grid-item">
          <span>Payer (Landlord)</span>
          <strong>${voucher.landlordName}</strong>
        </div>
        <div class="grid-item">
          <span>Verified By</span>
          <strong>${voucher.serviceAdminName}</strong>
        </div>
        <div class="grid-item">
          <span>Payee (Contractor)</span>
          <strong>${voucher.contractorName}</strong>
          <span style="margin-top: 4px; text-transform: none; font-weight: 400; font-size: 13px;">${voucher.contractorRole}</span>
        </div>
      </div>

      <table class="details">
        <thead>
          <tr>
            <th>Description</th>
            <th>Property</th>
            <th>Service Request ID</th>
            <th class="text-right">Payment Method</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">${voucher.serviceTitle}</div>
              <div style="font-size: 13px; color: #64748b;">Category: ${voucher.category}</div>
            </td>
            <td>${voucher.property}</td>
            <td>${voucher.serviceRequestId}</td>
            <td class="amount">${voucher.paymentMethod}</td>
          </tr>
        </tbody>
      </table>

      <div class="total-section">
        <div class="total-box">
          <span class="label">Total Amount Paid</span>
          <span class="value">₹${voucher.amount.toLocaleString("en-IN")}</span>
          <div class="status-badge">${voucher.status} (Auto-updated)</div>
        </div>
      </div>

      <div class="footer">
        <div style="margin-bottom: 16px;">
          <strong>Service Admin Note:</strong> ${voucher.adminVerificationNote}<br>
          <strong>Admin Verified At:</strong> ${voucher.adminVerifiedAt}<br>
          <strong>Landlord Approved At:</strong> ${voucher.landlordApprovedAt || voucher.createdAt}
        </div>
        <div>
          This is an automatically generated receipt voucher by the HomeSure Management System.<br>
          Generated Date: ${new Date().toLocaleString()}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([formattedContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = \`Receipt-Voucher-\${voucher.id}.html\`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(\`Professional receipt \${voucher.id} downloaded!\`);
    setVoucherModalOpen(false);
  };

  const handleCreatePayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.serviceTitle || !newForm.property || !newForm.amount) {
      toast.error("Please fill in required fields (Title, Property, Amount)");
      return;
    }

    const created = createPayment({
      serviceRequestId: `SR-${Math.floor(1000 + Math.random() * 9000)}`,
      serviceTitle: newForm.serviceTitle,
      property: newForm.property,
      contractorName: newForm.contractorName,
      contractorRole: newForm.contractorRole,
      serviceAdminName: "Service Admin",
      landlordName: "Landlord",
      amount: Number(newForm.amount),
      category: newForm.category,
      status: "Pending Approval",
      verifiedByAdmin: true,
      adminVerificationNote: newForm.adminVerificationNote,
      adminVerifiedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      paymentMethod: newForm.paymentMethod,
    });

    toast.success(`New payout request ${created.id} created!`);
    setNewPayoutModalOpen(false);
    setNewForm({
      serviceTitle: "",
      property: "",
      contractorName: "Contractor",
      contractorRole: "Master Contractor",
      amount: "",
      category: "Maintenance",
      adminVerificationNote: "Verified by Service Admin. Work completed satisfactorily.",
      paymentMethod: "Bank Transfer",
    });
  };

  const getStatusBadge = (status: ContractorPayment["status"]) => {
    switch (status) {
      case "Pending Approval":
        return (
          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1.5 py-1 px-3">
            <Clock className="h-3.5 w-3.5 animate-pulse" />
            Pending Approval
          </Badge>
        );
      case "Approved":
        return (
          <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 gap-1.5 py-1 px-3">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approved
          </Badge>
        );
      case "Processing":
        return (
          <Badge variant="outline" className="border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400 gap-1.5 py-1 px-3">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Processing
          </Badge>
        );
      case "Paid":
        return (
          <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1.5 py-1 px-3">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Paid
          </Badge>
        );
      case "Rejected":
        return (
          <Badge variant="outline" className="border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 gap-1.5 py-1 px-3">
            <XCircle className="h-3.5 w-3.5" />
            Rejected
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Wallet className="h-8 w-8 text-primary" />
              Payment Management
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Approve contractor payouts, review verified service details, and manage property maintenance disbursements seamlessly.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setNewPayoutModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-6 gap-2 shadow-md rounded-xl font-medium"
            >
              <Plus className="h-4 w-4" />
              Create Contractor Payout
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 shadow-sm border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Paid Out</span>
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight">{formatINR(totalPaid)}</div>
            <p className="text-xs text-muted-foreground mt-1">Settled payouts to Contractors</p>
          </div>
        </Card>

        <Card className="p-6 shadow-sm border-l-4 border-l-amber-500 bg-amber-500/5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Pending Approval</span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-amber-800 dark:text-amber-300">{pendingCount}</div>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">Value: {formatINR(pendingAmount)}</p>
          </div>
        </Card>

        <Card className="p-6 shadow-sm border-l-4 border-l-cyan-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Service Admin Verified</span>
            <div className="h-9 w-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight">{verifiedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Verified work & invoice details</p>
          </div>
        </Card>

        <Card className="p-6 shadow-sm border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recipient Role</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <HardHat className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">Contractor</div>
            <p className="text-xs text-muted-foreground mt-1">Primary service payee</p>
          </div>
        </Card>
      </div>

      {/* Main Content Table & Filters */}
      <Card className="shadow-sm border rounded-2xl overflow-hidden">
        <CardHeader className="border-b bg-card p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full lg:w-auto">
              <TabsList className="h-11 p-1 bg-muted/60 rounded-xl grid grid-cols-2 sm:grid-cols-5 w-full lg:w-auto">
                <TabsTrigger value="all" className="rounded-lg text-xs font-medium px-4">All ({payments.length})</TabsTrigger>
                <TabsTrigger value="pending" className="rounded-lg text-xs font-medium px-4 relative">
                  Pending ({pendingCount})
                  {pendingCount > 0 && <span className="ml-1.5 h-2 w-2 rounded-full bg-amber-500 inline-block" />}
                </TabsTrigger>
                <TabsTrigger value="verified" className="rounded-lg text-xs font-medium px-4">Admin Verified</TabsTrigger>
                <TabsTrigger value="paid" className="rounded-lg text-xs font-medium px-4">Paid</TabsTrigger>
                <TabsTrigger value="rejected" className="rounded-lg text-xs font-medium px-4">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payout ID, property..."
                  className="pl-10 h-10 text-sm rounded-xl border-muted"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[140px] h-10 text-xs rounded-xl border-muted">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="renovation">Renovation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/30 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Payment ID & Service</th>
                  <th className="px-6 py-4">Property</th>
                  <th className="px-6 py-4">Contractor</th>
                  <th className="px-6 py-4">Service Admin</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground">
                      <Receipt className="h-10 w-10 mx-auto mb-3 opacity-40" />
                      <p className="font-medium text-base">No contractor payouts found.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-5">
                        <div className="font-mono text-xs font-bold text-primary mb-1">
                          {p.id}
                        </div>
                        <div className="font-medium text-foreground max-w-xs truncate" title={p.serviceTitle}>
                          {p.serviceTitle}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px] py-0 px-2 font-normal">
                            {p.category}
                          </Badge>
                          <span>SR: {p.serviceRequestId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>{p.property}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <HardHat className="h-4 w-4 text-amber-500 shrink-0" />
                          <div>
                            <div className="font-semibold text-xs text-foreground">
                              Contractor
                            </div>
                            <div className="text-[11px] text-muted-foreground">{p.contractorRole}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-cyan-500 shrink-0" />
                          <div>
                            <div className="font-semibold text-xs text-foreground">
                              Service Admin
                            </div>
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Check className="h-3 w-3" /> Verified Details
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-base text-foreground">
                          {formatINR(p.amount)}
                        </div>
                        <div className="text-xs text-muted-foreground">{p.paymentMethod}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          {getStatusBadge(p.status)}
                          {p.status === "Pending Approval" && (
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3 text-amber-500" />
                              Action Required: Landlord
                            </div>
                          )}
                          {p.status === "Processing" && (
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                              <RefreshCw className="h-3 w-3 text-primary" />
                              Action: System Processing
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {p.status === "Pending Approval" ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleOpenApproveModal(p)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 px-3.5 gap-1.5 rounded-lg shadow-sm font-medium"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Approve & Pay
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReject(p)}
                                className="text-xs h-9 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                              >
                                Reject
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenVoucher(p)}
                              className="text-xs h-9 px-3 gap-1.5 rounded-lg border-muted"
                            >
                              <Receipt className="h-4 w-4 text-primary" />
                              Receipt Voucher
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL 1: APPROVE PAYMENT */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent className="sm:max-w-lg p-6 sm:p-8 rounded-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Approve Contractor Payout
            </DialogTitle>
            <DialogDescription className="text-sm">
              Confirm payout approval for {selectedPayment?.id}. Payment status will automatically update upon approval.
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-5 py-3 text-sm">
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                <div className="flex justify-between items-center border-b pb-2.5">
                  <span className="text-xs text-muted-foreground font-medium">Service Work</span>
                  <span className="font-semibold text-xs text-right max-w-[220px] truncate">{selectedPayment.serviceTitle}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-medium">Contractor</span>
                  <span className="font-semibold text-xs text-amber-600 dark:text-amber-400">Contractor</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-medium">Verified By</span>
                  <span className="font-semibold text-xs text-cyan-600 dark:text-cyan-400">Service Admin</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t font-bold">
                  <span className="text-sm">Payout Amount</span>
                  <span className="text-lg text-emerald-600 dark:text-emerald-400">{formatINR(selectedPayment.amount)}</span>
                </div>
              </div>

              {/* Service Admin Note */}
              <div className="bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800 rounded-xl p-4 text-xs text-cyan-900 dark:text-cyan-200 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-sm text-cyan-800 dark:text-cyan-300">
                  <Info className="h-4 w-4 text-cyan-600" />
                  Service Admin Verification Note:
                </div>
                <p className="leading-relaxed">{selectedPayment.adminVerificationNote}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Select Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer (IMPS / NEFT)</SelectItem>
                    <SelectItem value="UPI">Instant UPI Direct Payout</SelectItem>
                    <SelectItem value="Escrow Auto-Release">Escrow Auto-Release System</SelectItem>
                    <SelectItem value="Debit Card">Landlord Direct Debit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Landlord Approval Note (Optional)</Label>
                <Textarea
                  placeholder="e.g. Approved after physical inspection & tenant signoff."
                  className="text-xs h-24 rounded-xl"
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>Status will automatically update to <strong>Paid</strong> upon execution.</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3 pt-2">
            <Button variant="outline" onClick={() => setApproveModalOpen(false)} className="rounded-xl h-10 px-4">
              Cancel
            </Button>
            <Button onClick={handleConfirmApproval} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 rounded-xl h-10 px-5 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Approve & Release Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: RECEIPT / VOUCHER VIEW */}
      <Dialog open={voucherModalOpen} onOpenChange={setVoucherModalOpen}>
        <DialogContent className="sm:max-w-lg p-6 sm:p-8 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <Receipt className="h-6 w-6 text-primary" />
                Payment Voucher Receipt
              </span>
              <Badge variant="outline" className="font-mono text-xs px-3 py-1">
                {voucherPayment?.id}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {voucherPayment && (
            <div className="space-y-5 py-2 text-xs border rounded-xl p-5 bg-card shadow-sm">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h4 className="font-bold text-base text-primary">HomeSure Management</h4>
                  <p className="text-muted-foreground text-xs">Landlord Contractor Payout Voucher</p>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground block text-[11px]">Transaction Ref</span>
                  <span className="font-mono text-xs font-bold text-foreground">
                    {voucherPayment.transactionRef || "TXN-AUTO-9981"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-muted/40 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-muted-foreground block mb-0.5">Landlord:</span>
                  <strong className="text-foreground">Landlord</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Service Admin:</span>
                  <strong className="text-cyan-700 dark:text-cyan-300">Service Admin</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Contractor:</span>
                  <strong className="text-amber-700 dark:text-amber-300">Contractor</strong>
                </div>
              </div>

              <div className="space-y-2 border-b pb-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property:</span>
                  <span className="font-medium text-foreground">{voucherPayment.property}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Work Description:</span>
                  <span className="font-medium text-foreground">{voucherPayment.serviceTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-medium text-foreground">{voucherPayment.paymentMethod}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-base font-bold pt-1">
                <span>Total Amount Disbursed:</span>
                <span className="text-xl text-emerald-600 dark:text-emerald-400">
                  {formatINR(voucherPayment.amount)}
                </span>
              </div>

              <div className="pt-4 border-t text-xs space-y-1.5 text-muted-foreground">
                <div className="flex justify-between items-center">
                  <span>Service Admin Verification:</span>
                  <span className="text-cyan-600 font-semibold">Verified ({voucherPayment.adminVerifiedAt})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Landlord Approval:</span>
                  <span className="text-emerald-600 font-semibold">
                    Approved ({voucherPayment.landlordApprovedAt || voucherPayment.createdAt})
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3 pt-2">
            <Button variant="outline" onClick={() => setVoucherModalOpen(false)} className="rounded-xl h-10 px-4">
              Close
            </Button>
            <Button
              onClick={() => voucherPayment && handleDownloadReceipt(voucherPayment)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl h-10 px-5 font-medium"
            >
              <Download className="h-4 w-4" />
              Download Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: CREATE NEW PAYOUT */}
      <Dialog open={newPayoutModalOpen} onOpenChange={setNewPayoutModalOpen}>
        <DialogContent className="sm:max-w-lg p-6 sm:p-8 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
              <Plus className="h-6 w-6 text-primary" />
              Create Contractor Payout Request
            </DialogTitle>
            <DialogDescription className="text-sm">
              Log a new contractor payout request for Landlord approval.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePayout} className="space-y-4 pt-2 text-xs">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Service Work Title *</Label>
              <Input
                placeholder="e.g. Living Room AC Duct Cleaning & Replacement"
                value={newForm.serviceTitle}
                onChange={(e) => setNewForm({ ...newForm, serviceTitle: e.target.value })}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Property *</Label>
                <Input
                  placeholder="e.g. Sunset Heights #4B"
                  value={newForm.property}
                  onChange={(e) => setNewForm({ ...newForm, property: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Payout Amount (₹) *</Label>
                <Input
                  type="number"
                  placeholder="12500"
                  value={newForm.amount}
                  onChange={(e) => setNewForm({ ...newForm, amount: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Contractor Recipient</Label>
                <Input
                  value={newForm.contractorName}
                  onChange={(e) => setNewForm({ ...newForm, contractorName: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Service Category</Label>
                <Select
                  value={newForm.category}
                  onValueChange={(val: any) => setNewForm({ ...newForm, category: val })}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="HVAC">HVAC</SelectItem>
                    <SelectItem value="Renovation">Renovation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Service Admin Verification Note</Label>
              <Textarea
                value={newForm.adminVerificationNote}
                onChange={(e) => setNewForm({ ...newForm, adminVerificationNote: e.target.value })}
                className="h-20 text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="pt-4 gap-3">
              <Button type="button" variant="outline" onClick={() => setNewPayoutModalOpen(false)} className="rounded-xl h-10 px-4">
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-10 px-5 font-medium">
                Create Payout Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
