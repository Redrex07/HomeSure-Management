import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataCardGrid } from "@/shared/components/common/DataCardGrid";
import { Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/core/db/supabase";
import { getLandlordTenants } from "@/core/db/supabase-queries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { toast } from "sonner";

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
      toast.error("Please fill all fields");
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
      toast.error("Error inviting tenant: " + error.message);
      return;
    }

    toast.success("Tenant invited successfully!");

    setForm({
      tenant_id: "",
      property_id: "",
      onboarding_status: "Active",
      onboarding_date: new Date().toISOString().split("T")[0],
    });

    setShowInviteForm(false);
    loadTenants();
  };

  const handleDeleteTenant = async (onboardingId: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this tenant?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("tenant_onboarding")
      .delete()
      .eq("onboarding_id", onboardingId);

    if (error) {
      toast.error("Error deleting tenant: " + error.message);
      return;
    }

    toast.success("Tenant deleted successfully!");
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

      {/* Invite Tenant Dialog */}
      <Dialog open={showInviteForm} onOpenChange={setShowInviteForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Tenant</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleInviteTenant} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Tenant ID</Label>
              <Input
                type="number"
                placeholder="Example: 1"
                value={form.tenant_id}
                onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Property ID</Label>
              <Input
                type="number"
                placeholder="Example: 1"
                value={form.property_id}
                onChange={(e) => setForm({ ...form, property_id: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <select
                className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={form.onboarding_status}
                onChange={(e) => setForm({ ...form, onboarding_status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label>Onboarding Date</Label>
              <Input
                type="date"
                value={form.onboarding_date}
                onChange={(e) => setForm({ ...form, onboarding_date: e.target.value })}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowInviteForm(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Tenant</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="p-8 text-center">Loading tenants...</div>
      ) : (
        <DataCardGrid
          rows={landlordTenants}
          filterKeys={["onboarding_id", "tenant_id", "property_id", "onboarding_status"]}
          fields={[
            {
              key: "onboarding_id",
              label: "Onboarding",
              primary: true,
              render: (t) => <>Onboarding #{t.onboarding_id}</>,
            },
            {
              key: "onboarding_date",
              label: "Date",
              secondary: true,
              render: (t) => <>Joined {t.onboarding_date}</>,
            },
            {
              key: "tenant_id",
              label: "Tenant ID",
              render: (t) => (
                <span className="font-mono text-[11px] text-muted-foreground">#{t.tenant_id}</span>
              ),
            },
            {
              key: "property_id",
              label: "Property ID",
              render: (t) => (
                <span className="font-mono text-[11px] text-muted-foreground">
                  #{t.property_id}
                </span>
              ),
            },
            {
              key: "onboarding_status",
              label: "Status",
              render: (t: SupabaseTenant) => <StatusBadge value={t.onboarding_status} />,
            },
            {
              key: "onboarding_date_value",
              label: "Date",
              render: (t) => (
                <span className="text-xs text-muted-foreground">{t.onboarding_date}</span>
              ),
            },
          ]}
          actions={(t) => (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => handleDeleteTenant(t.onboarding_id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        />
      )}
    </>
  );
}