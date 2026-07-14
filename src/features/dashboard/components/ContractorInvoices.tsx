import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { DataTable } from "@/shared/components/common/DataTable";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { getContractorInvoices } from "@/core/db/supabase-queries";

type ContractorInvoice = {
  invoice_id: number;
  quotation_id: number;
  contractor_id: number;
  invoice_number: string;
  invoice_amount: number;
  tax_amount: number;
  invoice_file: string | null;
  completion_notes: string | null;
  invoice_status: "Pending" | "Paid" | "Cancelled";
  uploaded_at: string | null;
};

const CONTRACTOR_ID = 3001;
const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
}

export function ContractorInvoices() {
  const { data: invoices = [], isLoading, isError } = useQuery<ContractorInvoice[]>({
    queryKey: ["contractor-invoices", CONTRACTOR_ID],
    queryFn: () => getContractorInvoices(CONTRACTOR_ID),
  });

  return (
    <>
      <PageHeader
        title="My Invoices"
        description="Invoices uploaded for your completed jobs."
      />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <p className="animate-pulse text-sm text-slate-500">Loading invoices...</p>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load invoices. Please try again.
        </div>
      ) : (
        <DataTable
          rows={invoices}
          filterKeys={["invoice_id", "quotation_id", "invoice_number", "completion_notes", "invoice_status"]}
          empty="No invoices have been uploaded yet."
          columns={[
            {
              key: "invoice_id",
              header: "Invoice ID",
              sortable: true,
              render: (invoice) => <span className="font-mono text-xs">#{invoice.invoice_id}</span>,
            },
            { key: "quotation_id", header: "Quotation ID", render: (invoice) => `#${invoice.quotation_id}` },
            { key: "contractor_id", header: "Contractor ID", render: (invoice) => `#${invoice.contractor_id}` },
            { key: "invoice_number", header: "Invoice number", sortable: true },
            { key: "invoice_amount", header: "Amount", render: (invoice) => currency.format(invoice.invoice_amount) },
            { key: "tax_amount", header: "Tax", render: (invoice) => currency.format(invoice.tax_amount) },
            {
              key: "invoice_file",
              header: "Invoice file",
              render: (invoice) =>
                invoice.invoice_file ? (
                  <a
                    href={invoice.invoice_file}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    View file
                  </a>
                ) : (
                  "—"
                ),
            },
            {
              key: "completion_notes",
              header: "Completion notes",
              render: (invoice) => (
                <span className="block max-w-56 truncate" title={invoice.completion_notes || undefined}>
                  {invoice.completion_notes || "—"}
                </span>
              ),
            },
            { key: "invoice_status", header: "Status", render: (invoice) => <StatusBadge value={invoice.invoice_status} /> },
            { key: "uploaded_at", header: "Uploaded", render: (invoice) => formatDate(invoice.uploaded_at) },
          ]}
        />
      )}
    </>
  );
}
