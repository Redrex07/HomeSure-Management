import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataTable } from "@/shared/components/common/DataTable";
import { StatCard } from "@/shared/components/common/StatCard";
import { subscriptions as initialSubscriptions } from "@/shared/utils/mock-data";
import { CreditCard, DollarSign, TrendingUp, Plus } from "lucide-react";
import { formatINR } from "@/shared/utils/utils";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

export const Route = createFileRoute("/app/subscriptions")({
  head: () => ({ meta: [{ title: "Subscriptions — HomeSure" }] }),
  component: SubsPage,
});

function SubsPage() {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [open, setOpen] = useState(false);
  
  const mrr = subscriptions.reduce((s, x) => s + x.mrr, 0);

  const handleAddSubscription = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSub = {
      id: `SUB-${9000 + subscriptions.length + 1}`,
      customer: formData.get("customer") as string,
      plan: formData.get("plan") as string,
      seats: Number(formData.get("seats")),
      mrr: Number(formData.get("mrr")),
      status: formData.get("status") as string,
      renews: formData.get("renews") as string,
    };
    
    setSubscriptions([newSub, ...subscriptions]);
    setOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Subscriptions"
        description="Plans, billing and renewals."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add subscription
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Subscription</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubscription} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="customer">Customer</Label>
                  <Input id="customer" name="customer" required placeholder="Acme Corp" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="plan">Plan</Label>
                    <Select name="plan" defaultValue="Starter" required>
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
                    <Select name="status" defaultValue="Active" required>
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
                    <Input id="seats" name="seats" type="number" required min="1" defaultValue="1" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mrr">MRR ($)</Label>
                    <Input id="mrr" name="mrr" type="number" required min="0" defaultValue="0" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="renews">Renewal Date</Label>
                  <Input id="renews" name="renews" type="date" required />
                </div>
                <DialogFooter className="mt-4">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Save Subscription</Button>
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
        ]}
      />
    </>
  );
}
