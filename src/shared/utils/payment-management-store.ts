import { useState, useEffect } from "react";

export interface ContractorPayment {
  id: string;
  serviceRequestId: string;
  serviceTitle: string;
  property: string;
  contractorName: string;
  contractorRole: string;
  serviceAdminName: string;
  landlordName: string;
  amount: number;
  category: "Maintenance" | "Renovation" | "Plumbing" | "Electrical" | "HVAC" | "Inspection";
  status: "Pending Approval" | "Approved" | "Processing" | "Paid" | "Rejected";
  verifiedByAdmin: boolean;
  adminVerificationNote: string;
  adminVerifiedAt: string;
  landlordApprovedAt?: string;
  landlordApprovalNote?: string;
  paidAt?: string;
  paymentMethod: "Bank Transfer" | "UPI" | "Escrow Auto-Release" | "Debit Card";
  transactionRef?: string;
  autoUpdated: boolean;
  invoiceUrl?: string;
  createdAt: string;
}

export const initialPayments: ContractorPayment[] = [
  {
    id: "PAY-2026-001",
    serviceRequestId: "SR-8921",
    serviceTitle: "HVAC Unit Compressor Repair & Servicing",
    property: "Sunset Heights, Apt 4B",
    contractorName: "Contractor",
    contractorRole: "HVAC Specialist",
    serviceAdminName: "Service Admin",
    landlordName: "Landlord",
    amount: 18500,
    category: "HVAC",
    status: "Pending Approval",
    verifiedByAdmin: true,
    adminVerificationNote: "Work inspected on-site by Service Admin. Invoice & parts receipts verified.",
    adminVerifiedAt: "2026-08-02 14:30",
    paymentMethod: "Bank Transfer",
    autoUpdated: true,
    createdAt: "2026-08-02",
  },
  {
    id: "PAY-2026-002",
    serviceRequestId: "SR-8915",
    serviceTitle: "Master Bathroom Plumbing & Pipe Repair",
    property: "Green Valley Villa #12",
    contractorName: "Contractor",
    contractorRole: "Master Plumber",
    serviceAdminName: "Service Admin",
    landlordName: "Landlord",
    amount: 7200,
    category: "Plumbing",
    status: "Paid",
    verifiedByAdmin: true,
    adminVerificationNote: "Pressure leak test passed. Verified by Service Admin.",
    adminVerifiedAt: "2026-07-28 11:15",
    landlordApprovedAt: "2026-07-28 16:00",
    landlordApprovalNote: "Approved payout after tenant confirmation.",
    paidAt: "2026-07-28 16:05",
    paymentMethod: "UPI",
    transactionRef: "UPI/20260728/99812401",
    autoUpdated: true,
    createdAt: "2026-07-27",
  },
  {
    id: "PAY-2026-003",
    serviceRequestId: "SR-8930",
    serviceTitle: "Main Electrical Panel & Circuit Breaker Upgrade",
    property: "Royal Palms Residency, Unit 102",
    contractorName: "Contractor",
    contractorRole: "Licensed Electrician",
    serviceAdminName: "Service Admin",
    landlordName: "Landlord",
    amount: 24000,
    category: "Electrical",
    status: "Pending Approval",
    verifiedByAdmin: true,
    adminVerificationNote: "Safety compliance certificate attached & validated by Service Admin.",
    adminVerifiedAt: "2026-08-03 09:45",
    paymentMethod: "Escrow Auto-Release",
    autoUpdated: true,
    createdAt: "2026-08-03",
  },
  {
    id: "PAY-2026-004",
    serviceRequestId: "SR-8890",
    serviceTitle: "Terrace Waterproofing & Sealant Coating",
    property: "Skyline Towers #801",
    contractorName: "Contractor",
    contractorRole: "Waterproofing Contractor",
    serviceAdminName: "Service Admin",
    landlordName: "Landlord",
    amount: 42000,
    category: "Maintenance",
    status: "Approved",
    verifiedByAdmin: true,
    adminVerificationNote: "Completed 3-layer coating. Verified by Service Admin.",
    adminVerifiedAt: "2026-08-01 16:20",
    landlordApprovedAt: "2026-08-02 10:00",
    landlordApprovalNote: "Approved for payout processing.",
    paymentMethod: "Escrow Auto-Release",
    transactionRef: "ESCROW/20260802/5512",
    autoUpdated: true,
    createdAt: "2026-07-30",
  },
  {
    id: "PAY-2026-005",
    serviceRequestId: "SR-8840",
    serviceTitle: "Modular Kitchen Cabinet Hinge & Lock Repairs",
    property: "Oceanview Apartments #3A",
    contractorName: "Contractor",
    contractorRole: "Carpenter",
    serviceAdminName: "Service Admin",
    landlordName: "Landlord",
    amount: 5600,
    category: "Renovation",
    status: "Paid",
    verifiedByAdmin: true,
    adminVerificationNote: "Work completed satisfactorily. Verified by Service Admin.",
    adminVerifiedAt: "2026-07-20 15:00",
    landlordApprovedAt: "2026-07-21 09:30",
    paidAt: "2026-07-21 09:35",
    paymentMethod: "Bank Transfer",
    transactionRef: "NEFT/20260721/887192",
    autoUpdated: true,
    createdAt: "2026-07-19",
  },
];

let paymentsStore = [...initialPayments];

export const getPayments = () => paymentsStore;

export const approvePayment = (id: string, landlordNote?: string, method?: ContractorPayment["paymentMethod"]) => {
  const now = new Date().toISOString().replace("T", " ").substring(0, 16);
  paymentsStore = paymentsStore.map((p) => {
    if (p.id === id) {
      return {
        ...p,
        status: "Paid" as const,
        landlordApprovedAt: now,
        paidAt: now,
        landlordApprovalNote: landlordNote || "Approved & processed by Landlord.",
        paymentMethod: method || p.paymentMethod,
        transactionRef: p.transactionRef || `PAY-GW/${Date.now().toString().slice(-8)}`,
        autoUpdated: true,
      };
    }
    return p;
  });
  window.dispatchEvent(new Event("payments-updated"));
};

export const rejectPayment = (id: string, reason: string) => {
  const now = new Date().toISOString().replace("T", " ").substring(0, 16);
  paymentsStore = paymentsStore.map((p) => {
    if (p.id === id) {
      return {
        ...p,
        status: "Rejected" as const,
        landlordApprovalNote: `Rejected by Landlord: ${reason}`,
        landlordApprovedAt: now,
        autoUpdated: true,
      };
    }
    return p;
  });
  window.dispatchEvent(new Event("payments-updated"));
};

export const createPayment = (newPayment: Omit<ContractorPayment, "id" | "createdAt" | "autoUpdated">) => {
  const id = `PAY-2026-${String(paymentsStore.length + 1).padStart(3, "0")}`;
  const now = new Date().toISOString().split("T")[0];
  const item: ContractorPayment = {
    ...newPayment,
    id,
    createdAt: now,
    autoUpdated: true,
  };
  paymentsStore = [item, ...paymentsStore];
  window.dispatchEvent(new Event("payments-updated"));
  return item;
};

export const usePayments = () => {
  const [data, setData] = useState(paymentsStore);

  useEffect(() => {
    const listener = () => setData(getPayments());
    window.addEventListener("payments-updated", listener);
    return () => window.removeEventListener("payments-updated", listener);
  }, []);

  return data;
};
