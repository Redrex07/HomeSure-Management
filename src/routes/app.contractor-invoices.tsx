import { createFileRoute } from "@tanstack/react-router";
import { ContractorInvoices } from "@/features/dashboard/components/ContractorInvoices";

export const Route = createFileRoute("/app/contractor-invoices")({
  component: ContractorInvoices,
});
