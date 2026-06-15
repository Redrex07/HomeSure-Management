import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataTable } from "@/shared/components/common/DataTable";
import { Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/core/db/supabase";
import { getLandlordTenants } from "@/core/db/supabase-queries";

export const Route = createFileRoute("/app/tenants")({
  head: () => ({ meta: [{ title: "Tenants — HomeSure" }] }),
  component: TenantsPage,
});

interface SupabaseTenant {
  onboarding_id: string;
  tenant_id: string;
  property_id: string;
  onboarding_status: string;
  onboarding_date: string;
  [key: string]: unknown;
}

function TenantsPage() {
  const landlordId = "2";
  const [landlordTenants, setLandlordTenants] = useState<SupabaseTenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);

  const [form, setForm] = useState({
    tenant_id: "",
    property_id: "",
    onboarding_status: "Active",
    onboarding_date: new Date().toISOString().split("T")[0],
  });

  const loadTenants = async () => {
    try {
      setIsLoading(true);
      const data = await getLandlordTenants(landlordId);
      setLandlordTenants(data);
    } catch (error) {
      console.error("Error loading tenants:", error);
      setLandlordTenants([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleInviteTenant = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.tenant_id || !form.property_id || !form.onboarding_date) {
      alert("Please fill all fields");
      return;
    }

    const { error } = await supabase.from("tenant_onboarding").insert([
      {
        tenant_id: Number(form.tenant_id),
        realtor_id: null,
        property_id: Number(form.property_id),
        onboarding_status: form.onboarding_status,
        onboarding_date: form.onboarding_date,
      },
    ]);

    if (error) {
      alert("Error inviting tenant: " + error.message);
      return;
    }

    alert("Tenant invited successfully!");

    setForm({
      tenant_id: "",
      property_id: "",
      onboarding_status: "Active",
      onboarding_date: new Date().toISOString().split("T")[0],
    });

    setShowInviteForm(false);
    loadTenants();
  };

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Manage tenant profiles and lease details."
        actions={
          <Button size="sm" onClick={() => setShowInviteForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> Invite tenant
          </Button>
        }
      />

      {showInviteForm && (
        <div className="mb-6 rounded-lg border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Invite Tenant</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowInviteForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleInviteTenant} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Tenant ID</label>
              <input
                type="number"
                className="mt-1 w-full rounded-md border px-3 py-2"
                placeholder="Example: 1"
                value={form.tenant_id}
                onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Property ID</label>
              <input
                type="number"
                className="mt-1 w-full rounded-md border px-3 py-2"
                placeholder="Example: 1"
                value={form.property_id}
                onChange={(e) => setForm({ ...form, property_id: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={form.onboarding_status}
                onChange={(e) => setForm({ ...form, onboarding_status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Onboarding Date</label>
              <input
                type="date"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={form.onboarding_date}
                onChange={(e) => setForm({ ...form, onboarding_date: e.target.value })}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit">Save Tenant</Button>
              <Button type="button" variant="outline" onClick={() => setShowInviteForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="p-8 text-center">Loading tenants...</div>
      ) : (
        <DataTable
          rows={landlordTenants}
          filterKeys={["onboarding_id", "tenant_id", "property_id", "onboarding_status"]}
          columns={[
            { key: "onboarding_id", header: "Onboarding ID", sortable: true },
            { key: "tenant_id", header: "Tenant ID", sortable: true },
            { key: "property_id", header: "Property ID", sortable: true },
            {
              key: "onboarding_status",
              header: "Status",
              render: (t: SupabaseTenant) => <StatusBadge value={t.onboarding_status} />,
            },
            { key: "onboarding_date", header: "Onboarding Date" },
          ]}
        />
      )}
    </>
  );
}