import { useQuery } from "@tanstack/react-query";
import { getContractorServiceRequests } from "@/core/db/supabase-queries";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { DataTable } from "@/shared/components/common/DataTable";
import { StatusBadge } from "@/shared/components/common/StatusBadge";

type ContractorServiceRequest = {
  request_id: number;
  contractor_id: number;
  maintenance_request_id: number;
  property_id: number;
  tenant_id: number;
  landlord_id: number;
  issue_title: string;
  issue_description: string | null;
  assigned_date: string | null;
  expected_completion: string | null;
  request_status: "Assigned" | "Accepted" | "Rejected" | "Completed";
};

const CONTRACTOR_ID = 3001;

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

export function ContractorServiceRequests() {
  const { data: requests = [], isLoading, isError } = useQuery<ContractorServiceRequest[]>({
    queryKey: ["contractor-jobs", CONTRACTOR_ID],
    queryFn: () => getContractorServiceRequests(CONTRACTOR_ID),
  });

  return (
    <>
      <PageHeader
        title="Assigned Jobs"
        description="Review the maintenance jobs assigned to you and their expected completion dates."
      />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <p className="animate-pulse text-sm text-slate-500">Loading assigned jobs...</p>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load assigned jobs. Please try again.
        </div>
      ) : (
        <DataTable
          rows={requests}
          filterKeys={["request_id", "maintenance_request_id", "issue_title", "issue_description", "request_status"]}
          empty="No jobs are currently assigned to you."
          columns={[
            {
              key: "request_id",
              header: "Request ID",
              sortable: true,
              render: (job) => <span className="font-mono text-xs">CSR-{job.request_id}</span>,
            },
            {
              key: "maintenance_request_id",
              header: "Maintenance ID",
              render: (job) => <span className="font-mono text-xs">MR-{job.maintenance_request_id}</span>,
            },
            { key: "property_id", header: "Property", render: (job) => `#${job.property_id}` },
            { key: "tenant_id", header: "Tenant", render: (job) => `#${job.tenant_id}` },
            { key: "landlord_id", header: "Landlord", render: (job) => `#${job.landlord_id}` },
            {
              key: "issue_title",
              header: "Issue",
              sortable: true,
              render: (job) => (
                <div className="min-w-48">
                  <p className="font-medium text-slate-900">{job.issue_title}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{job.issue_description || "No description"}</p>
                </div>
              ),
            },
            { key: "assigned_date", header: "Assigned", render: (job) => formatDate(job.assigned_date) },
            { key: "expected_completion", header: "Expected completion", render: (job) => formatDate(job.expected_completion) },
            {
              key: "request_status",
              header: "Status",
              render: (job) => <StatusBadge value={job.request_status} />,
            },
          ]}
        />
      )}
    </>
  );
}
