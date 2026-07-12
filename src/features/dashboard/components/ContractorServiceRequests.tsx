import { useQuery } from "@tanstack/react-query";
import { getContractorServiceRequests } from "@/core/db/supabase-queries";

import { PageHeader } from "@/shared/components/common/PageHeader";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/shared/components/ui/card";

export function ContractorServiceRequests() {
  const contractorId = 1;

  const { data: requests = [] } = useQuery({
    queryKey: ["contractor-jobs"],
    queryFn: () => getContractorServiceRequests(contractorId),
  });

  return (
    <>
      <PageHeader
        title="Assigned Jobs"
        description="Jobs assigned to you."
      />

      <Card>

        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">

                <th className="py-2 text-left">Request ID</th>
                <th className="py-2 text-left">Maintenance ID</th>
                <th className="py-2 text-left">Property</th>
                <th className="py-2 text-left">Tenant</th>
                <th className="py-2 text-left">Landlord</th>
                <th className="py-2 text-left">Issue</th>
                <th className="py-2 text-left">Description</th>
                <th className="py-2 text-left">Assigned</th>
                <th className="py-2 text-left">Completion</th>
                <th className="py-2 text-left">Status</th>

              </tr>
            </thead>

            <tbody>
              {requests.map((r: any) => (
                <tr key={r.request_id} className="border-b">

                  <td>{r.request_id}</td>
                  <td>{r.maintenance_request_id}</td>
                  <td>{r.property_id}</td>
                  <td>{r.tenant_id}</td>
                  <td>{r.landlord_id}</td>
                  <td>{r.issue_title}</td>
                  <td>{r.issue_description}</td>
                  <td>{r.assigned_date}</td>
                  <td>{r.expected_completion}</td>
                  <td>{r.request_status}</td>

                </tr>
              ))}

              {requests.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-6 text-center">
                    No assigned jobs.
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