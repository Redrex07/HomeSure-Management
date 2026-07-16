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
import { 
  fetchPlatformPlans, 
  createPlatformPlan, 
  updatePlatformPlan, 
  deletePlatformPlan 
} from "@/core/api/users.functions";
import { CreditCard, DollarSign, TrendingUp, Plus, Pencil, Trash2, CalendarClock, Ban, Sparkles, RefreshCw, MoreHorizontal } from "lucide-react";
import { formatINR } from "@/shared/utils/utils";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { useSession } from "@/features/auth/store/auth-store";
import { toast } from "sonner";
import { Badge } from "@/shared/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/shared/components/ui/dropdown-menu";

export const Route = createFileRoute("/app/subscriptions")({
  head: () => ({ meta: [{ title: "Subscriptions — HomeSure" }] }),
  component: SubsPage,
});

function SubsPage() {
  const session = useSession();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  // Plans CRUD states
  const [planOpen, setPlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  const fetchSubscriptions = async () => {
    try {
      const data = await getSubscriptionsData();
      if (data && data.length > 0) {
        setSubscriptions(data as Subscription[]);
      } else {
        const storeModule = await import("@/shared/utils/subscriptions-store");
        setSubscriptions(storeModule.getSubscriptions());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPlansList = async () => {
    try {
      const data = await fetchPlatformPlans();
      if (data && data.length > 0) {
        setPlans(data);
      } else {
        // Mock fallback plans
        setPlans([
          { plan_id: 1, plan_name: "Basic", plan_type: "Monthly", price: 999, description: "Basic property management tools." },
          { plan_id: 2, plan_name: "Premium", plan_type: "Quarterly", price: 2499, description: "Advanced tools with realtor integration." },
          { plan_id: 3, plan_name: "Enterprise", plan_type: "Yearly", price: 7999, description: "Complete platform control with support SLAs." }
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    fetchPlansList();
  }, []);
  
  const mrr = subscriptions.reduce((s, x) => s + x.mrr, 0);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setTimeout(() => setEditingSub(null), 200);
    }
  };

  const handlePlanOpenChange = (newOpen: boolean) => {
    setPlanOpen(newOpen);
    if (!newOpen) {
      setTimeout(() => setEditingPlan(null), 200);
    }
  };

  const handleSaveSubscription = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
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
      toast.error("Failed to save. Updated locally.");
      if (editingSub) {
        setSubscriptions(subscriptions.map(s => s.id === editingSub.id ? { ...s, ...data } : s));
      } else {
        setSubscriptions([data, ...subscriptions]);
      }
    }
    
    setOpen(false);
    setTimeout(() => setEditingSub(null), 200);
  };

  const handleRenewSubscription = async (sub: Subscription) => {
    const nextYearDate = new Date();
    nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
    const nextYearStr = nextYearDate.toISOString().split("T")[0];
    
    const updated = {
      ...sub,
      status: "Active",
      renews: nextYearStr
    };
    
    try {
      await updateSubscriptionData(sub.id, updated);
      toast.success(`Subscription for ${sub.customer} has been renewed!`);
      fetchSubscriptions();
    } catch (e) {
      toast.error("Renewed locally.");
      setSubscriptions(subscriptions.map(s => s.id === sub.id ? updated : s));
    }
  };

  const handleCancelSubscription = async (sub: Subscription) => {
    const updated = {
      ...sub,
      status: "Past Due"
    };
    
    try {
      await updateSubscriptionData(sub.id, updated);
      toast.success(`Subscription for ${sub.customer} has been cancelled.`);
      fetchSubscriptions();
    } catch (e) {
      toast.error("Cancelled locally.");
      setSubscriptions(subscriptions.map(s => s.id === sub.id ? updated : s));
    }
  };

  const handleEditClick = (sub: Subscription) => {
    setEditingSub(sub);
    setOpen(true);
  };

  // Plan CRUD Actions
  const handleSavePlan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const planName = formData.get("plan_name") as string;
    const planType = formData.get("plan_type") as string;
    const price = Number(formData.get("price"));
    const description = formData.get("description") as string;

    try {
      if (editingPlan) {
        await updatePlatformPlan({
          data: {
            planId: editingPlan.plan_id,
            planName,
            planType,
            price,
            description,
            adminEmail: session?.email,
            adminName: session?.name,
            adminRole: session?.role
          }
        });
        toast.success("Plan updated successfully!");
      } else {
        await createPlatformPlan({
          data: {
            planName,
            planType,
            price,
            description,
            adminEmail: session?.email,
            adminName: session?.name,
            adminRole: session?.role
          }
        });
        toast.success("New subscription plan created!");
      }
      fetchPlansList();
    } catch (err: any) {
      toast.error(err.message || "Failed to save plan.");
    }

    setPlanOpen(false);
    setTimeout(() => setEditingPlan(null), 200);
  };

  const handleDeletePlan = async (id: number) => {
    if (!confirm("Are you sure you want to delete this subscription plan?")) return;
    try {
      await deletePlatformPlan({
        data: {
          planId: id,
          adminEmail: session?.email,
          adminName: session?.name,
          adminRole: session?.role
        }
      });
      toast.success("Plan deleted successfully.");
      fetchPlansList();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete plan.");
    }
  };

  return (
    <>
      <PageHeader
        title="Subscriptions & billing"
        description="Manage active subscribers, plans, renewals, and platform pricing."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex items-center gap-1 cursor-pointer" onClick={() => { fetchSubscriptions(); fetchPlansList(); toast.success("Refreshed data."); }}><RefreshCw className="h-3.5 w-3.5" /> Refresh</Button>
            <Dialog open={open} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button size="sm" className="cursor-pointer" onClick={() => setEditingSub(null)}>
                  <Plus className="mr-2 h-4 w-4" /> Add subscriber
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
          </div>
        }
      />

      <Tabs defaultValue="subscribers">
        <TabsList className="bg-slate-100 p-1 rounded-lg mb-4">
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> Subscription Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="subscribers">
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <StatCard
              label="Active Subscriptions"
              value={String(subscriptions.filter((s) => s.status === "Active").length)}
              icon={CreditCard}
              tone="success"
            />
            <StatCard
              label="Monthly Recurring Revenue (MRR)"
              value={formatINR(mrr)}
              icon={DollarSign}
              tone="success"
              delta={14}
            />
            <StatCard
              label="Trials & Expired"
              value={String(subscriptions.filter((s) => s.status !== "Active").length)}
              icon={TrendingUp}
              tone="info"
            />
          </div>

          <DataTable
            rows={subscriptions}
            filterKeys={["customer", "plan", "status"]}
            columns={[
              {
                key: "id",
                header: "ID",
                render: (s) => <span className="font-mono text-xs text-slate-500">{s.id}</span>,
              },
              {
                key: "customer",
                header: "Customer",
                sortable: true,
                render: (s) => <span className="font-medium text-slate-800">{s.customer}</span>,
              },
              { key: "plan", header: "Plan", sortable: true },
              { key: "seats", header: "Seats" },
              { key: "mrr", header: "MRR", sortable: true, render: (s) => formatINR(s.mrr) },
              { key: "renews", header: "Renews On", sortable: true, render: (s) => <span className="font-mono text-xs">{s.renews}</span> },
              { key: "status", header: "Status", sortable: true, render: (s) => <StatusBadge value={s.status} /> },
              {
                key: "actions",
                header: "",
                render: (s) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditClick(s)}>
                        <Pencil className="mr-2 h-4 w-4 text-slate-500" />
                        Edit Subscription
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRenewSubscription(s)}>
                        <CalendarClock className="mr-2 h-4 w-4 text-emerald-500" />
                        Renew Plan (1 Year)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCancelSubscription(s)}>
                        <Ban className="mr-2 h-4 w-4 text-red-500" />
                        Cancel Subscription
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ),
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="plans">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Platform subscription plans</h3>
            <Dialog open={planOpen} onOpenChange={handlePlanOpenChange}>
              <DialogTrigger asChild>
                <Button size="sm" className="cursor-pointer" onClick={() => setEditingPlan(null)}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Create Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingPlan ? "Edit Subscription Plan" : "Create Subscription Plan"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSavePlan} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="plan-name">Plan Name</Label>
                    <Input id="plan-name" name="plan_name" required placeholder="e.g. Basic, Premium" defaultValue={editingPlan?.plan_name} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="plan-type">Plan Type (Duration)</Label>
                      <Select name="plan_type" defaultValue={editingPlan?.plan_type || "Monthly"} required>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Quarterly">Quarterly</SelectItem>
                          <SelectItem value="Yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="plan-price">Price (₹)</Label>
                      <Input id="plan-price" name="price" type="number" required min="0" placeholder="e.g. 999" defaultValue={editingPlan?.price} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="plan-desc">Plan Description</Label>
                    <Textarea id="plan-desc" name="description" required placeholder="Summarize features and limits..." defaultValue={editingPlan?.description} />
                  </div>
                  <DialogFooter className="pt-2">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">{editingPlan ? "Save Changes" : "Create Plan"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((p) => (
              <Card key={p.plan_id} className="border border-slate-200 shadow-sm bg-white rounded-xl flex flex-col justify-between">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold text-slate-800">{p.plan_name}</CardTitle>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 border-0">{p.plan_type}</Badge>
                  </div>
                  <CardDescription className="text-xs">{p.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold text-slate-900">
                    {formatINR(p.price)}
                    <span className="text-xs text-slate-400 font-normal"> / cycle</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t pt-3 bg-slate-50/50 rounded-b-xl">
                  <Button size="sm" variant="outline" onClick={() => { setEditingPlan(p); setPlanOpen(true); }} className="cursor-pointer h-8">
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer h-8" onClick={() => handleDeletePlan(p.plan_id)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
