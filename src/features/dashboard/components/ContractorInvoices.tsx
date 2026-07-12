import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/shared/components/common/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { getContractorInvoices } from "@/core/db/supabase-queries";

export function ContractorInvoices() {
  const contractorId = 1;

  const { data: invoices = [] } = useQuery({
    queryKey: ["contractor-invoices"],
    queryFn: () => getContractorInvoices(contractorId),
  });

  return (
    <>
      <PageHeader
        title="My Invoices"
        description="Invoices uploaded for your completed jobs."
      />

      <Card>
        

        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Invoice ID</th>
                <th className="text-left py-2">Quotation ID</th>
                <th className="text-left py-2">Amount </th>
                <th className="text-left py-2">Tax</th>
                  <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Completion Notes</th>
                      <th className="text-left py-2">Uploaded Date</th>
                        <th className="text-left py-2">Invoice File</th>
              </tr>
            </thead>

            <tbody>
  {invoices.map((invoice: any) => (
    <tr key={invoice.invoice_id} className="border-b">

      <td className="py-2">{invoice.invoice_number}</td>

      <td className="py-2">{invoice.quotation_id}</td>

      <td className="py-2">₹{invoice.invoice_amount}</td>

      <td className="py-2">₹{invoice.tax_amount}</td>

      <td className="py-2">{invoice.invoice_status}</td>

      <td className="py-2">
        {invoice.completion_notes || "-"}
      </td>

      <td className="py-2">
        {new Date(invoice.uploaded_at).toLocaleDateString()}
      </td>

      <td className="py-2">
        {invoice.invoice_file ? (
          <a
            href={invoice.invoice_file}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            View File
          </a>
        ) : (
          "-"
        )}
      </td>

    </tr>
  ))}

  {invoices.length === 0 && (
    <tr>
      <td colSpan={8} className="text-center py-6">
        No invoices found.
      </td>
    </tr>
  )}
</tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}