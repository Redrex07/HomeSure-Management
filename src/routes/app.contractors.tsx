import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getContractors, createContractor } from "@/core/db/supabase-queries";
import { Plus, Star, Phone, BriefcaseBusiness, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

const TRADE_OPTIONS = ["Plumbing", "Electrical", "HVAC", "Landscaping", "Painting", "Locksmith", "General"];

export const Route = createFileRoute("/app/contractors")({
  head: () => ({ meta: [{ title: "Contractors — HomeSure" }] }),
  component: ContractorsPage,
});

function ContractorsPage() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [trade, setTrade] = useState("Plumbing");
  const [specialization, setSpecialization] = useState("Plumbing");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [available, setAvailable] = useState(true);

  const queryClient = useQueryClient();

  const { data: contractorList = [], isLoading } = useQuery({
    queryKey: ["contractors"],
    queryFn: getContractors,
  });

  const inviteMutation = useMutation({
    mutationFn: createContractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      toast.success("Contractor invited successfully!");
      setOpen(false);
      setName("");
      setCompanyName("");
      setTrade("Plumbing");
      setSpecialization("Plumbing");
      setEmail("");
      setPhone("");
      setAvailable(true);
    },
    onError: (err: any) => {
      toast.error("Error inviting contractor: " + (err.message || String(err)));
    },
  });

  const contractorStats = useMemo(() => {
    const total = contractorList.length;
    const availableCount = contractorList.filter((c) => c.available).length;
    const averageRating =
      total === 0
        ? 0
        : contractorList.reduce((sum, contractor) => sum + Number(contractor.rating || 0), 0) /
          total;

    return {
      total,
      availableCount,
      averageRating,
    };
  }, [contractorList]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate({
      name,
      companyName,
      trade,
      specialization,
      email,
      phone,
      available,
    });
  };

  return (
    <>
      <PageHeader
        title="Contractor directory"
        description="Browse trusted contractors and their availability."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Invite contractor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Contractor</DialogTitle>
                <DialogDescription>
                  Create a contractor profile now. The record will stay in the local prototype store until Supabase is wired up.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <Label>Full name</Label>
                  <Input
                    placeholder="e.g. John Doe"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Company name</Label>
                  <Input
                    placeholder="e.g. Northside Plumbing"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Trade</Label>
                    <Select value={trade} onValueChange={setTrade}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRADE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Specialization</Label>
                    <Input
                      placeholder="e.g. Emergency plumbing"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="e.g. john@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input
                    placeholder="e.g. (555) 555-0199"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Availability</Label>
                  <Select value={available ? "available" : "busy"} onValueChange={(v) => setAvailable(v === "available")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      setName("");
                      setCompanyName("");
                      setTrade("Plumbing");
                      setSpecialization("Plumbing");
                      setEmail("");
                      setPhone("");
                      setAvailable(true);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending ? "Inviting..." : "Invite"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/70 shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-primary-soft p-2 text-primary">
              <BriefcaseBusiness className="h-4 w-4" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{contractorStats.total}</div>
              <div className="text-xs text-muted-foreground">Total contractors</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-success/10 p-2 text-success">
              <BadgeCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{contractorStats.availableCount}</div>
              <div className="text-xs text-muted-foreground">Available now</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-warning/10 p-2 text-warning">
              <Star className="h-4 w-4 fill-current" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{contractorStats.averageRating.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Average rating</div>
            </div>
          </CardContent>
        </Card>
      </div>
      {isLoading ? (
        <div className="flex h-64 items-center justify-center border border-border/60 rounded-md bg-background/50">
          <p className="text-sm text-muted-foreground animate-pulse">Loading contractor list...</p>
        </div>
      ) : contractorList.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center border border-dashed border-border/80 rounded-md bg-background/50 p-6 text-center">
          <p className="text-sm font-semibold text-muted-foreground mb-1">No contractors found</p>
          <p className="text-xs text-muted-foreground/75">
            Use the "Invite contractor" button to add a new contractor.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contractorList.map((c) => (
            <Card
              key={c.id}
              className="border-border/70 shadow-card transition-shadow hover:shadow-elegant"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary-soft text-sm text-primary">
                      {(c.companyName || c.name)
                        .split(" ")
                        .map((w: string) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate font-semibold">{c.companyName || c.name}</div>
                      <Badge
                        variant="outline"
                        className={
                          c.available
                            ? "border-success/30 bg-success/10 text-success"
                            : "border-border bg-muted text-muted-foreground"
                        }
                      >
                        {c.available ? "Available" : "Busy"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{c.trade}</div>
                    <div className="text-[11px] text-muted-foreground">{c.specialization}</div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 text-warning">
                        <Star className="h-3 w-3 fill-current" />
                        {Number(c.rating || 0).toFixed(1)}
                      </span>
                      <span>·</span>
                      <span>{c.jobs} jobs</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <a href={`tel:${c.phone}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full">
                      <Phone className="mr-1 h-3.5 w-3.5" />
                      Call
                    </Button>
                  </a>
                  <Button size="sm" className="flex-1" onClick={() => toast.info(`Assigned job flow for ${c.name} can be created in Appointments.`)}>
                    Assign job
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}


