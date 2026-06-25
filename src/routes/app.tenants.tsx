import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataCardGrid } from "@/shared/components/common/DataCardGrid";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { sendTenantInviteEmail } from "@/core/api/email.functions";
import {
  getLandlordTenants,
  createTenant,
  updateTenant,
  deleteTenant,
} from "@/core/db/supabase-queries";
import { useSession } from "@/features/auth/store/auth-store";

// Define Tenant type inline
type Tenant = {
  onboarding_id: string;
  tenant_id: number | string;
  email: string | null;
  property_id: number | string;
  onboarding_status: string;
  onboarding_date: string;
};
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

function TenantsPage() {
  const user = useSession();
  const [landlordTenants, setLandlordTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTenants = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const data = await getLandlordTenants(user.id);
    setLandlordTenants(data as Tenant[]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadTenants();
  }, [user?.id]);
  const [showInviteForm, setShowInviteForm] = useState(false);

  const [form, setForm] = useState({
    tenant_id: "",
    email: "",
    property_id: "",
    onboarding_status: "Active",
    onboarding_date: new Date().toISOString().split("T")[0],
  });

  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editForm, setEditForm] = useState({
    tenant_id: "",
    email: "",
    property_id: "",
    onboarding_status: "Active",
    onboarding_date: "",
  });

  const handleInviteTenant = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.tenant_id || !form.email || !form.property_id || !form.onboarding_date) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      await createTenant({
        tenant_id: Number(form.tenant_id),
        email: form.email,
        property_id: Number(form.property_id),
        onboarding_status: form.onboarding_status,
        onboarding_date: form.onboarding_date,
      });

      if (form.email) {
        const loadingId = toast.loading("Sending invite email...");
        const emailResult = await sendTenantInviteEmail({
          data: {
            email: form.email,
            propertyId: form.property_id,
            status: form.onboarding_status,
          },
        });

        toast.dismiss(loadingId);

        if (emailResult?.success && emailResult.previewUrl) {
          toast.success("Tenant invited and email sent successfully!", {
            duration: 10000,
            action: {
              label: "View Email",
              onClick: () => window.open(emailResult.previewUrl as string, "_blank"),
            },
          });
        } else {
          toast.error("Tenant invited, but failed to send email.");
        }
      } else {
        toast.success("Tenant invited successfully!");
      }

      setForm({
        tenant_id: "",
        email: "",
        property_id: "",
        onboarding_status: "Active",
        onboarding_date: new Date().toISOString().split("T")[0],
      });

      setShowInviteForm(false);
      loadTenants();
    } catch (err) {
      toast.error("Failed to add tenant.");
    }
  };

  const handleDeleteTenant = async (onboardingId: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this tenant?");
    if (!confirmDelete) return;

    try {
      await deleteTenant(onboardingId);
      toast.success("Tenant deleted successfully!");
      loadTenants();
    } catch (err) {
      toast.error("Failed to delete tenant.");
    }
  };

  const openEditDialog = (t: Tenant) => {
    setEditingTenant(t);
    setEditForm({
      tenant_id: String(t.tenant_id),
      email: (t.email as string) || "",
      property_id: String(t.property_id),
      onboarding_status: t.onboarding_status,
      onboarding_date: t.onboarding_date || new Date().toISOString().split("T")[0],
    });
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;

    if (!editForm.tenant_id || !editForm.email || !editForm.property_id || !editForm.onboarding_date) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      await updateTenant(editingTenant.onboarding_id, {
        tenant_id: Number(editForm.tenant_id),
        email: editForm.email,
        property_id: Number(editForm.property_id),
        onboarding_status: editForm.onboarding_status,
        onboarding_date: editForm.onboarding_date,
      });

      toast.success("Tenant updated successfully!");
      setEditingTenant(null);
      loadTenants();
    } catch (err) {
      toast.error("Failed to update tenant.");
    }
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
              <Label>Email ID</Label>
              <Input
                type="email"
                placeholder="tenant@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
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
        <div className="p-8 text-center text-muted-foreground">Loading tenants...</div>
      ) : landlordTenants.length === 0 ? (
        <div className="p-8 text-center">No tenants found.</div>
      ) : (
        <DataCardGrid
          rows={landlordTenants}
          filterKeys={["onboarding_id", "tenant_id", "email", "property_id", "onboarding_status"]}
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
              key: "email",
              label: "Email",
              render: (t) => (
                <span className="text-xs text-muted-foreground">
                  {(t.email as string) || "N/A"}
                </span>
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
              render: (t: Tenant) => <StatusBadge value={t.onboarding_status} />,
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
            <div className="flex items-center gap-0.5 justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-primary-soft hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditDialog(t);
                }}
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTenant(t.onboarding_id);
                }}
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        />
      )}

      {/* Edit Tenant Dialog */}
      <Dialog open={!!editingTenant} onOpenChange={(open) => !open && setEditingTenant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdateTenant} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Tenant ID</Label>
              <Input
                type="number"
                value={editForm.tenant_id}
                onChange={(e) => setEditForm({ ...editForm, tenant_id: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Email ID</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Property ID</Label>
              <Input
                type="number"
                value={editForm.property_id}
                onChange={(e) => setEditForm({ ...editForm, property_id: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <select
                className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={editForm.onboarding_status}
                onChange={(e) => setEditForm({ ...editForm, onboarding_status: e.target.value })}
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
                value={editForm.onboarding_date}
                onChange={(e) => setEditForm({ ...editForm, onboarding_date: e.target.value })}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setEditingTenant(null)}>
                Cancel
              </Button>
              <Button type="submit">Update Tenant</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
