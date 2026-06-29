import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataTable } from "@/shared/components/common/DataTable";
import { StatCard } from "@/shared/components/common/StatCard";
import { Subscription } from "@/shared/utils/subscriptions-store";
import { 
  getSubscriptionsData, 
  createSubscriptionData, 
  updateSubscriptionData 
} from "@/core/db/supabase-queries";
import { CreditCard, DollarSign, TrendingUp, Plus, Pencil } from "lucide-react";
import { formatINR } from "@/shared/utils/utils";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/app/subscriptions")({
  head: () => ({ meta: [{ title: "Subscriptions — HomeSure" }] }),
  component: SubsPage,
});

function SubsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [open, setOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  const fetchSubscriptions = async () => {
    try {
      const data = await getSubscriptionsData();
      if (data && data.length > 0) {
        setSubscriptions(data as Subscription[]);
      } else {
        // Fallback to local store data temporarily if Supabase is empty during testing
        const storeModule = await import("@/shared/utils/subscriptions-store");
        setSubscriptions(storeModule.getSubscriptions());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);
  
  const mrr = subscriptions.reduce((s, x) => s + x.mrr, 0);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setTimeout(() => setEditingSub(null), 200);
    }
  };

  const handleSaveSubscription = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Auto-generate ID if it's new
    const maxId = subscriptions.reduce((max, s) => {
      const num = parseInt(s.id.replace("SUB-", ""), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 9000);
    const newId = `SUB-${maxId + 1}`;
    
    const data = {
      id: editingSub ? editingSub.id : newId,
      customer: formData.get("customer") as string,
      plan: formData.get("plan") as string,
      seats: Number(formData.get("seats")),
      mrr: Number(formData.get("mrr")),
      status: formData.get("status") as string,
      renews: formData.get("renews") as string,
    };
    
    try {
      if (editingSub) {
        await updateSubscriptionData(editingSub.id, data);
        toast.success("Subscription updated successfully");
      } else {
        await createSubscriptionData(data);
        toast.success("Subscription created successfully");
      }
      fetchSubscriptions();
    } catch (error) {
      toast.error("Failed to save to Supabase. Make sure your RLS policies allow insertion/updates.");
      // Fallback local update for UI
      if (editingSub) {
        setSubscriptions(subscriptions.map(s => s.id === editingSub.id ? { ...s, ...data } : s));
      } else {
        setSubscriptions([data, ...subscriptions]);
      }
    }
    
    setOpen(false);
    setTimeout(() => setEditingSub(null), 200);
  };

  const handleEditClick = (sub: Subscription) => {
    setEditingSub(sub);
    setOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Subscriptions"
        description="Plans, billing and renewals."
        actions={
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditingSub(null)}>
                <Plus className="mr-2 h-4 w-4" /> Add subscription
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingSub ? "Edit Subscription" : "Add Subscription"}</DialogTitle>
              </DialogHeader>
              <form key={editingSub ? editingSub.id : "new"} onSubmit={handleSaveSubscription} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="customer">Customer</Label>
                  <Input id="customer" name="customer" required placeholder="Acme Corp" defaultValue={editingSub?.customer} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="plan">Plan</Label>
                    <Select name="plan" defaultValue={editingSub?.plan || "Starter"} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Starter">Starter</SelectItem>
                        <SelectItem value="Pro">Pro</SelectItem>
                        <SelectItem value="Enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={editingSub?.status || "Active"} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Trial">Trial</SelectItem>
                        <SelectItem value="Past Due">Past Due</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="seats">Seats</Label>
                    <Input id="seats" name="seats" type="number" required min="1" defaultValue={editingSub?.seats || 1} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mrr">MRR ($)</Label>
                    <Input id="mrr" name="mrr" type="number" required min="0" defaultValue={editingSub?.mrr || 0} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="renews">Renewal Date</Label>
                  <Input id="renews" name="renews" type="date" required defaultValue={editingSub?.renews} />
                </div>
                <DialogFooter className="mt-4">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">{editingSub ? "Save Changes" : "Save Subscription"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active subs"
          value={String(subscriptions.filter((s) => s.status === "Active").length)}
          icon={CreditCard}
          tone="success"
        />
        <StatCard
          label="MRR"
          value={formatINR(mrr)}
          icon={DollarSign}
          tone="success"
          delta={14}
        />
        <StatCard
          label="Trials"
          value={String(subscriptions.filter((s) => s.status === "Trial").length)}
          icon={TrendingUp}
          tone="info"
        />
      </div>
      <DataTable
        rows={subscriptions}
        filterKeys={["customer", "plan"]}
        columns={[
          {
            key: "id",
            header: "ID",
            render: (s) => <span className="font-mono text-xs">{s.id}</span>,
          },
          {
            key: "customer",
            header: "Customer",
            sortable: true,
            render: (s) => <span className="font-medium">{s.customer}</span>,
          },
          { key: "plan", header: "Plan" },
          { key: "seats", header: "Seats" },
          { key: "mrr", header: "MRR", render: (s) => formatINR(s.mrr) },
          { key: "renews", header: "Renews" },
          { key: "status", header: "Status", render: (s) => <StatusBadge value={s.status} /> },
          {
            key: "actions",
            header: "",
            width: "50px",
            render: (s) => (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0"
                onClick={() => handleEditClick(s)}
              >
                <Pencil className="h-4 w-4 text-slate-500" />
                <span className="sr-only">Edit</span>
              </Button>
            ),
          },
        ]}
      />
    </>
  );
}
