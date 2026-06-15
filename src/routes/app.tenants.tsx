import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataTable } from "@/shared/components/common/DataTable";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Plus, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "@/features/auth/store/auth-store";
import { getLandlordTenants } from "@/core/db/supabase-queries";

export const Route = createFileRoute("/app/tenants")({
  head: () => ({ meta: [{ title: "Tenants — HomeSure" }] }),
  component: TenantsPage,
});

function TenantsPage() {
  const session = useSession();
  const landlordId = "2"; // Using landlord_id from Supabase
  const [landlordTenants, setLandlordTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTenants = async () => {
      try {
        console.log("Loading tenants for landlord:", landlordId);
        const data = await getLandlordTenants(landlordId);
        console.log("Loaded tenants:", data);
        setLandlordTenants(data);
      } catch (error) {
        console.error("Error loading tenants:", error);
        setLandlordTenants([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadTenants();
  }, [landlordId]);

  const displayData = landlordTenants;

  return (
    <>
      <PageHeader title="Tenants" description="Manage tenant profiles and lease details." actions={<Button size="sm"><Plus className="mr-2 h-4 w-4" /> Invite tenant</Button>} />
      {isLoading ? (
        <div className="p-8 text-center">Loading tenants...</div>
      ) : (
        <DataTable
          rows={displayData}
          filterKeys={[
  "onboarding_id",
  "tenant_id",
  "property_id",
  "onboarding_status"
] as any}
          columns={[
  {
    key: "onboarding_id",
    header: "Onboarding ID",
    sortable: true,
  },
  {
    key: "tenant_id",
    header: "Tenant ID",
    sortable: true,
  },
  {
    key: "property_id",
    header: "Property ID",
    sortable: true,
  },
  {
    key: "onboarding_status",
    header: "Status",
    render: (t: any) => (
      <StatusBadge value={t.onboarding_status} />
    ),
  },
  {
    key: "onboarding_date",
    header: "Onboarding Date",
  },
]}
        />
      )}
    </>
  );
}
