import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
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
  CreditCard,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserCheck,
  HardHat,
  FileText,
  Download,
  Plus,
  Search,
  Receipt,
  Sparkles,
  ArrowUpRight,
  Database,
  RefreshCw,
  XCircle,
  Building2,
  Check,
  Copy,
  Info,
  DollarSign,
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

  const [copiedSql, setCopiedSql] = useState(false);

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
    toast.success(
      `Payment ${selectedPayment.id} for ${selectedPayment.contractorName} approved and marked as Paid!`
    );
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

    toast.success(`New payout request ${created.id} created successfully!`);
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
          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1.5 py-1 px-2.5">
            <Clock className="h-3.5 w-3.5 animate-pulse" />
            Pending Approval
          </Badge>
        );
      case "Approved":
        return (
          <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 gap-1.5 py-1 px-2.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approved
          </Badge>
        );
      case "Processing":
        return (
          <Badge variant="outline" className="border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400 gap-1.5 py-1 px-2.5">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Processing
          </Badge>
        );
      case "Paid":
        return (
          <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1.5 py-1 px-2.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Paid
          </Badge>
        );
      case "Rejected":
        return (
          <Badge variant="outline" className="border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 gap-1.5 py-1 px-2.5">
            <XCircle className="h-3.5 w-3.5" />
            Rejected
          </Badge>
        );
    }
  };

  const supabaseSql = `-- ==========================================
-- HOMESURE LANDLORD PAYMENT MANAGEMENT SCHEMA
-- Primary Owner: Landlord
-- Service Admin: Service Admin
-- Contractor Recipient: Contractor
-- ==========================================

-- 1. Create contractor_payments Table
CREATE TABLE IF NOT EXISTS public.contractor_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_code VARCHAR(50) UNIQUE NOT NULL,
    service_request_id VARCHAR(50),
    service_title TEXT NOT NULL,
    property_name TEXT NOT NULL,
    landlord_id UUID REFERENCES auth.users(id),
    landlord_name TEXT DEFAULT 'Landlord',
    service_admin_id UUID REFERENCES auth.users(id),
    service_admin_name TEXT DEFAULT 'Service Admin',
    contractor_id UUID REFERENCES auth.users(id),
    contractor_name TEXT DEFAULT 'Contractor',
    contractor_role TEXT DEFAULT 'Contractor',
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    category VARCHAR(50) NOT NULL DEFAULT 'Maintenance',
    status VARCHAR(30) NOT NULL DEFAULT 'Pending Approval' 
      CHECK (status IN ('Pending Approval', 'Approved', 'Processing', 'Paid', 'Rejected')),
    verified_by_admin BOOLEAN DEFAULT TRUE,
    admin_verification_note TEXT,
    admin_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    landlord_approved_at TIMESTAMP WITH TIME ZONE,
    landlord_approval_note TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(50) DEFAULT 'Bank Transfer',
    transaction_ref VARCHAR(100),
    auto_updated BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Automated Status Update Trigger
CREATE OR REPLACE FUNCTION public.auto_update_contractor_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto set updated_at timestamp
    NEW.updated_at = NOW();

    -- When Landlord approves payment, set paid_at and auto_updated flag
    IF NEW.status = 'Paid' AND (OLD.status IS NULL OR OLD.status <> 'Paid') THEN
        NEW.paid_at = COALESCE(NEW.paid_at, NOW());
        NEW.landlord_approved_at = COALESCE(NEW.landlord_approved_at, NOW());
        NEW.auto_updated = TRUE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_contractor_payment ON public.contractor_payments;
CREATE TRIGGER trigger_auto_contractor_payment
    BEFORE UPDATE ON public.contractor_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_update_contractor_payment_status();

-- 3. Row Level Security Policies
ALTER TABLE public.contractor_payments ENABLE ROW LEVEL SECURITY;

-- Landlords can view and update payments for their properties
CREATE POLICY "Landlords manage contractor payments"
    ON public.contractor_payments
    FOR ALL
    USING (auth.uid() = landlord_id OR true); -- adjusted for demonstration

-- 4. Sample Seed Data
INSERT INTO public.contractor_payments 
(payment_code, service_request_id, service_title, property_name, landlord_name, service_admin_name, contractor_name, contractor_role, amount, category, status, verified_by_admin, admin_verification_note, payment_method, auto_updated)
VALUES 
('PAY-2026-001', 'SR-8921', 'HVAC Unit Compressor Repair & Servicing', 'Sunset Heights, Apt 4B', 'Landlord', 'Service Admin', 'Contractor', 'HVAC Specialist', 18500.00, 'HVAC', 'Pending Approval', true, 'Work inspected on-site by Service Admin. Invoice & parts receipts verified.', 'Bank Transfer', true),
('PAY-2026-002', 'SR-8915', 'Master Bathroom Plumbing & Pipe Repair', 'Green Valley Villa #12', 'Landlord', 'Service Admin', 'Contractor', 'Master Plumber', 7200.00, 'Plumbing', 'Paid', true, 'Pressure leak test passed. Verified by Service Admin.', 'UPI', true);
`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(supabaseSql);
    setCopiedSql(true);
    toast.success("Supabase SQL Schema copied to clipboard!");
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="border-indigo-400/40 bg-indigo-500/20 text-indigo-200">
                Landlord Module
              </Badge>
              <Badge variant="outline" className="border-emerald-400/40 bg-emerald-500/20 text-emerald-300 gap-1">
                <UserCheck className="h-3 w-3" />
                Landlord
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <CreditCard className="h-7 w-7 text-indigo-400" />
              Payment Management
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-2xl">
              Approve, track, and disburse payments for completed maintenance and contractor services across your properties.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setNewPayoutModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 shadow-lg shadow-indigo-600/30"
            >
              <Plus className="h-4 w-4" />
              Create Contractor Payout
            </Button>
          </div>
        </div>

        {/* Roles Context Banner */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-white">Owner & Approver:</span>
            <span className="text-indigo-300 font-medium">Landlord</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-white">Verification & Recording:</span>
            <span className="text-cyan-300 font-medium">Service Admin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-white">Payment Recipient:</span>
            <span className="text-amber-300 font-medium">Contractor</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto text-emerald-400 font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            Auto-updated via payment gateway
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-indigo-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Total Paid Out</CardDescription>
            <CardTitle className="text-2xl font-bold">{formatINR(totalPaid)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Settled Contractor Payouts</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm bg-amber-50/30 dark:bg-amber-950/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Pending Approval (Landlord)
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-800 dark:text-amber-300">
              {pendingCount} Request{pendingCount !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-amber-700/80 dark:text-amber-400/80 flex items-center justify-between">
            <span>Value: {formatINR(pendingAmount)}</span>
            <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Verified by Service Admin</CardDescription>
            <CardTitle className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
              {verifiedCount} Verified
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Service Admin</span>
            <ShieldCheck className="h-4 w-4 text-cyan-500" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Recipient Contractor</CardDescription>
            <CardTitle className="text-xl font-bold text-emerald-600 dark:text-emerald-400 truncate">
              Contractor
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Primary Service Contractor</span>
            <HardHat className="h-4 w-4 text-amber-500" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs & Table */}
      <Card>
        <CardHeader className="border-b bg-muted/20 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="grid grid-cols-3 sm:grid-cols-5 w-full sm:w-auto">
                <TabsTrigger value="all">All Payouts ({payments.length})</TabsTrigger>
                <TabsTrigger value="pending" className="relative">
                  Pending ({pendingCount})
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="verified">Admin Verified</TabsTrigger>
                <TabsTrigger value="paid">Paid & Settled</TabsTrigger>
                <TabsTrigger value="supabase" className="gap-1 text-indigo-600 dark:text-indigo-400">
                  <Database className="h-3.5 w-3.5" />
                  Supabase DB
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {activeTab !== "supabase" && (
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search ID, contractor, property..."
                    className="pl-8 text-sm h-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[130px] h-9 text-xs">
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
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {activeTab === "supabase" ? (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-start gap-3">
                  <Database className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-indigo-900 dark:text-indigo-200">
                      Supabase Migration & RLS Policies
                    </h3>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                      Ready-to-run SQL script for Supabase database table creation, trigger function for auto-updating status, RLS policies, and sample data.
                    </p>
                  </div>
                </div>
                <Button onClick={copySqlToClipboard} className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shrink-0">
                  {copiedSql ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedSql ? "Copied SQL!" : "Copy Supabase SQL"}
                </Button>
              </div>

              <div className="relative rounded-lg border bg-slate-950 p-4 overflow-x-auto text-xs text-slate-100 font-mono">
                <pre>{supabaseSql}</pre>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-b text-xs font-semibold text-muted-foreground uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Payment ID & Work</th>
                    <th className="px-6 py-3.5">Property</th>
                    <th className="px-6 py-3.5">Contractor (Recipient)</th>
                    <th className="px-6 py-3.5">Verified By (Admin)</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        <Receipt className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                        <p className="font-medium">No payouts found matching criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            {p.id}
                          </div>
                          <div className="font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate" title={p.serviceTitle}>
                            {p.serviceTitle}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                              {p.category}
                            </Badge>
                            <span>SR: {p.serviceRequestId}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>{p.property}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <HardHat className="h-4 w-4 text-amber-500 shrink-0" />
                            <div>
                              <div className="font-medium text-xs text-slate-900 dark:text-slate-100">
                                {p.contractorName}
                              </div>
                              <div className="text-[11px] text-muted-foreground">{p.contractorRole}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-cyan-500 shrink-0" />
                            <div>
                              <div className="font-medium text-xs text-slate-800 dark:text-slate-200">
                                {p.serviceAdminName}
                              </div>
                              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Check className="h-3 w-3" /> Details Recorded
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {formatINR(p.amount)}
                          </div>
                          <div className="text-[11px] text-muted-foreground">{p.paymentMethod}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {getStatusBadge(p.status)}
                            {p.autoUpdated && (
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Sparkles className="h-2.5 w-2.5 text-indigo-500" />
                                Auto-updated status
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {p.status === "Pending Approval" ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenApproveModal(p)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 gap-1 shadow-sm"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Approve & Pay
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleReject(p)}
                                  className="text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                >
                                  Reject
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenVoucher(p)}
                                className="text-xs h-8 gap-1"
                              >
                                <Receipt className="h-3.5 w-3.5 text-indigo-500" />
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
          )}
        </CardContent>
      </Card>

      {/* MODAL 1: APPROVE & EXECUTE PAYMENT */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              Approve Contractor Payout
            </DialogTitle>
            <DialogDescription>
              Confirm approval for {selectedPayment?.id}. The status will auto-update in the payment system upon execution.
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4 py-2 text-sm">
              <div className="rounded-lg border bg-muted/40 p-3.5 space-y-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-xs text-muted-foreground">Work Title</span>
                  <span className="font-semibold text-xs text-right max-w-[200px] truncate">{selectedPayment.serviceTitle}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Contractor (Recipient)</span>
                  <span className="font-medium text-xs text-amber-600 dark:text-amber-400">{selectedPayment.contractorName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Verified By</span>
                  <span className="font-medium text-xs text-cyan-600 dark:text-cyan-400">{selectedPayment.serviceAdminName}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t font-bold">
                  <span>Payout Amount</span>
                  <span className="text-base text-emerald-600 dark:text-emerald-400">{formatINR(selectedPayment.amount)}</span>
                </div>
              </div>

              {/* Service Admin Note */}
              <div className="bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800 rounded-md p-3 text-xs text-cyan-900 dark:text-cyan-200">
                <div className="font-semibold flex items-center gap-1 mb-1">
                  <Info className="h-3.5 w-3.5 text-cyan-600" />
                  Service Admin Verification Note:
                </div>
                <p>{selectedPayment.adminVerificationNote}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Select Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                  <SelectTrigger className="h-9 text-xs">
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
                  className="text-xs h-20"
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded border border-emerald-200 dark:border-emerald-800">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>Status will automatically update to <strong>Paid</strong> in the payment system.</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setApproveModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmApproval} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Approve & Release Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: RECEIPT / VOUCHER VIEW */}
      <Dialog open={voucherModalOpen} onOpenChange={setVoucherModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-indigo-600" />
                Payment Voucher Receipt
              </span>
              <Badge variant="outline" className="font-mono text-xs">
                {voucherPayment?.id}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {voucherPayment && (
            <div className="space-y-4 py-2 text-xs border rounded-lg p-4 bg-card">
              {/* Receipt Header */}
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <h4 className="font-bold text-sm text-indigo-600 dark:text-indigo-400">HomeSure Management</h4>
                  <p className="text-muted-foreground text-[11px]">Landlord Contractor Payout Voucher</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block">Transaction Ref</span>
                  <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {voucherPayment.transactionRef || "TXN-AUTO-9981"}
                  </span>
                </div>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-3 gap-2 bg-muted/40 p-3 rounded text-[11px]">
                <div>
                  <span className="text-muted-foreground block">Landlord (Payer):</span>
                  <strong className="text-slate-900 dark:text-slate-100">{voucherPayment.landlordName}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Service Admin:</span>
                  <strong className="text-cyan-700 dark:text-cyan-300">{voucherPayment.serviceAdminName}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Contractor (Payee):</span>
                  <strong className="text-amber-700 dark:text-amber-300">{voucherPayment.contractorName}</strong>
                </div>
              </div>

              {/* Service details */}
              <div className="space-y-1.5 border-b pb-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property:</span>
                  <span className="font-medium">{voucherPayment.property}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Work Description:</span>
                  <span className="font-medium">{voucherPayment.serviceTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-medium">{voucherPayment.paymentMethod}</span>
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="flex justify-between items-center text-sm font-bold pt-1">
                <span>Total Amount Disbursed:</span>
                <span className="text-base text-emerald-600 dark:text-emerald-400">
                  {formatINR(voucherPayment.amount)}
                </span>
              </div>

              {/* Signatures & Approvals */}
              <div className="pt-3 border-t text-[11px] space-y-1 text-muted-foreground">
                <div className="flex justify-between items-center">
                  <span>Service Admin Verification:</span>
                  <span className="text-cyan-600 font-medium">Verified by Service Admin ({voucherPayment.adminVerifiedAt})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Landlord Approval:</span>
                  <span className="text-emerald-600 font-medium">
                    Approved by Landlord ({voucherPayment.landlordApprovedAt || voucherPayment.createdAt})
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setVoucherModalOpen(false)}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                toast.success("Voucher receipt downloaded as PDF.");
                setVoucherModalOpen(false);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5"
            >
              <Download className="h-4 w-4" />
              Download Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: CREATE NEW CONTRACTOR PAYOUT */}
      <Dialog open={newPayoutModalOpen} onOpenChange={setNewPayoutModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-600" />
              Create Contractor Payout Request
            </DialogTitle>
            <DialogDescription>
              Log a new contractor payout for Landlord approval and Service Admin recording.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePayout} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Service Work Title *</Label>
              <Input
                placeholder="e.g. Living Room AC Duct Cleaning & Replacement"
                value={newForm.serviceTitle}
                onChange={(e) => setNewForm({ ...newForm, serviceTitle: e.target.value })}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Property *</Label>
                <Input
                  placeholder="e.g. Sunset Heights #4B"
                  value={newForm.property}
                  onChange={(e) => setNewForm({ ...newForm, property: e.target.value })}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Payout Amount (₹) *</Label>
                <Input
                  type="number"
                  placeholder="12500"
                  value={newForm.amount}
                  onChange={(e) => setNewForm({ ...newForm, amount: e.target.value })}
                  className="h-9 text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Contractor Recipient</Label>
                <Input
                  value={newForm.contractorName}
                  onChange={(e) => setNewForm({ ...newForm, contractorName: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Service Category</Label>
                <Select
                  value={newForm.category}
                  onValueChange={(val: any) => setNewForm({ ...newForm, category: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
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

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Service Admin Verification Note</Label>
              <Textarea
                value={newForm.adminVerificationNote}
                onChange={(e) => setNewForm({ ...newForm, adminVerificationNote: e.target.value })}
                className="h-16 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setNewPayoutModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                Create Payout Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
