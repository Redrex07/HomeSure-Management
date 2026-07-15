import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getContractorQuotations } from "@/core/db/supabase-queries";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/app/contractor-quotations")({
  component: ContractorQuotationPage,
});

function ContractorQuotationPage() {
  const contractorId = 1;

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["contractor-quotations"],
    queryFn: () => getContractorQuotations(contractorId),
  });

  return (
  <div className="space-y-6">

    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold">
        Contractor Quotations
      </h1>

    <Link
  to="/app/contractor-quotations/new"
  className="rounded-lg bg-blue-600 px-4 py-2 text-white"
>
  + Create Quotation
</Link>
    </div>

    <div className="overflow-hidden rounded-lg border">

      <table className="w-full">

        <thead className="bg-gray-100">

          <tr>

            <th className="p-3 text-left">Quotation ID</th>

            <th className="p-3 text-left">Request ID</th>

            <th className="p-3 text-left">Estimated Amount</th>

            <th className="p-3 text-left">Labour</th>

            <th className="p-3 text-left">Material</th>

            <th className="p-3 text-left">Completion Days</th>

            <th className="p-3 text-left">Status</th>

            <th className="p-3 text-left">Submitted</th>

          </tr>

        </thead>

        <tbody>

          {isLoading ? (
            <tr>
              <td colSpan={8} className="p-10 text-center text-gray-500">
                Loading quotations...
              </td>
            </tr>
          ) : isError ? (
            <tr>
              <td colSpan={8} className="p-10 text-center text-red-600">
                Unable to load quotations. Please try again.
              </td>
            </tr>
          ) : data.length === 0 ? (

            <tr>

              <td
                colSpan={8}
                className="p-10 text-center text-gray-500"
              >
                No quotations found.
              </td>

            </tr>

          ) : (

            data.map((q: any) => (

              <tr key={q.quotation_id}>

                <td className="p-3">
                  {q.quotation_id}
                </td>

                <td className="p-3">
                  {q.request_id}
                </td>

                <td className="p-3">
                  ₹{q.estimated_amount}
                </td>

                <td className="p-3">
                  ₹{q.labour_cost}
                </td>

                <td className="p-3">
                  ₹{q.material_cost}
                </td>

                <td className="p-3">
                  {q.estimated_completion_days}
                </td>

                <td className="p-3">
                  {q.quotation_status}
                </td>

                <td className="p-3">
                  {q.submitted_at}
                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>

  </div>
)
};
