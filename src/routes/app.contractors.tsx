import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getContractors,
  createContractor,
  getServiceRequests,
  assignContractor,
  getContractorAssignments,
  updateAssignmentStatus,
  reassignContractor,
} from "@/core/db/supabase-queries";
import { Plus, Star, Phone, BriefcaseBusiness, BadgeCheck, HardHat, Mail, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
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

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "status-available" | "status-busy" | "highest-rated">("name-asc");
  const [assigningContractor, setAssigningContractor] = useState<any | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");

  const queryClient = useQueryClient();

  const { data: contractorList = [], isLoading } = useQuery({
    queryKey: ["contractors"],
    queryFn: getContractors,
  });

  const { data: requestList = [] } = useQuery({
    queryKey: ["serviceRequests"],
    queryFn: getServiceRequests,
  });

  const assignMutation = useMutation({
    mutationFn: assignContractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      queryClient.invalidateQueries({ queryKey: ["serviceRequests"] });
      toast.success("Contractor assigned successfully!");
      setAssigningContractor(null);
      setSelectedRequestId("");
    },
    onError: (err: any) => {
      toast.error("Error assigning contractor: " + (err.message || String(err)));
    }
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

  const filteredContractors = contractorList
    .filter((c) => {
      const query = search.toLowerCase();
      const nameMatch = c.name.toLowerCase().includes(query);
      const companyMatch = (c.companyName || "").toLowerCase().includes(query);
      const tradeMatch = (c.trade || "").toLowerCase().includes(query);
      const specMatch = (c.specialization || "").toLowerCase().includes(query);
      return nameMatch || companyMatch || tradeMatch || specMatch;
    })
    .sort((a, b) => {
      if (sortBy === "name-asc") {
        const nameA = a.companyName || a.name;
        const nameB = b.companyName || b.name;
        return nameA.localeCompare(nameB);
      } else if (sortBy === "name-desc") {
        const nameA = a.companyName || a.name;
        const nameB = b.companyName || b.name;
        return nameB.localeCompare(nameA);
      } else if (sortBy === "status-available") {
        return a.available === b.available ? 0 : a.available ? -1 : 1;
      } else if (sortBy === "status-busy") {
        return a.available === b.available ? 0 : a.available ? 1 : -1;
      } else if (sortBy === "highest-rated") {
        return Number(b.rating || 0) - Number(a.rating || 0);
      }
      return 0;
    });

  return (
    <>
      <PageHeader
        title="Contractor directory"
        description="Browse trusted contractors and their availability."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" aria-label="Invite new contractor">
                <Plus className="mr-2 h-4 w-4" /> Invite contractor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Contractor</DialogTitle>
                <DialogDescription>
                  Invite a new contractor to the directory.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    placeholder="e.g. John Doe"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="compName">Company name</Label>
                  <Input
                    id="compName"
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
                      <SelectTrigger aria-label="Select Trade">
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
                    <Label htmlFor="spec">Specialization</Label>
                    <Input
                      id="spec"
                      placeholder="e.g. Emergency plumbing"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="emailInput">Email</Label>
                  <Input
                    id="emailInput"
                    type="email"
                    placeholder="e.g. john@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phoneInput">Phone</Label>
                  <Input
                    id="phoneInput"
                    placeholder="e.g. (555) 555-0199"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Availability</Label>
                  <Select value={available ? "available" : "busy"} onValueChange={(v) => setAvailable(v === "available")}>
                    <SelectTrigger aria-label="Select Availability">
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

     {isLoading ? (
  <div className="flex h-64 items-center justify-center border border-border/60 rounded-md bg-background/50">
    <p className="text-sm text-muted-foreground animate-pulse">
      Loading contractor list...
    </p>
  </div>
      ) : contractorList.length === 0 ? (
        <div className="flex h-72 flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-white p-8 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-500 mb-4 shadow-sm">
            <HardHat className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">No Contractors Available</h3>
          <p className="text-xs text-slate-500 max-w-sm mb-5 font-normal leading-relaxed">
            Invite your first contractor to begin assigning maintenance requests.
          </p>
          <Button size="sm" onClick={() => setOpen(true)} className="shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all" aria-label="Invite first contractor">
            <Plus className="mr-2 h-4 w-4" /> Invite Contractor
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border border-border/70 bg-white shadow-card rounded-xl transition-all duration-200 hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">{contractorStats.total}</div>
                  <div className="text-xs font-medium text-slate-500">Total contractors</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border/70 bg-white shadow-card rounded-xl transition-all duration-200 hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">{contractorStats.availableCount}</div>
                  <div className="text-xs font-medium text-slate-500">Available now</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border/70 bg-white shadow-card rounded-xl transition-all duration-200 hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-xl bg-amber-50 p-3 text-amber-500">
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">{contractorStats.averageRating.toFixed(1)}</div>
                  <div className="text-xs font-medium text-slate-500">Average rating</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search, Sort & Count Toolbar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
            <div className="flex-1 max-w-md relative">
              <Label htmlFor="searchQuery" className="sr-only">Search contractors</Label>
              <Input
                id="searchQuery"
                placeholder="Search contractors by name, company, trade, specialization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 h-9"
              />
              <div className="absolute left-3 top-2.5 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
                </svg>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                Showing {filteredContractors.length} of {contractorList.length} contractors
              </span>
              <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                <SelectTrigger className="h-9 w-44" aria-label="Sort Contractors">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="status-available">Available First</SelectItem>
                  <SelectItem value="status-busy">Busy First</SelectItem>
                  <SelectItem value="highest-rated">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredContractors.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-white p-6 text-center shadow-sm">
              <p className="text-sm font-semibold text-slate-800 mb-1">No matching contractors found</p>
              <p className="text-xs text-muted-foreground">
                No contractors match your search term "{search}". Try searching for another keyword.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredContractors.map((c) => (
                <Card
                  key={c.id}
                  className="border border-slate-200 bg-white shadow-card rounded-xl transition-all duration-200 hover:shadow-elegant flex flex-col justify-between h-full"
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full flex-1">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <Avatar className="h-12 w-12 border border-slate-100 shadow-sm flex-shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                            {(c.companyName || c.name)
                              .split(" ")
                              .map((w: string) => w[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 truncate leading-snug" title={c.companyName || c.name}>
                            {c.companyName || c.name}
                          </div>
                          <div className="text-xs font-medium text-slate-500 truncate mt-0.5">
                            Rep: {c.name}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {c.available ? (
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50/50 text-emerald-700 gap-1.5 pl-1.5 py-0.5 font-medium whitespace-nowrap">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Available
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 gap-1.5 pl-1.5 py-0.5 font-medium whitespace-nowrap">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              Busy
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="text-xs font-semibold text-primary bg-primary/5 px-2.5 py-0.5 rounded-md">
                          {c.trade || "General"}
                        </span>
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md truncate max-w-[150px]" title={c.specialization}>
                          {c.specialization || "General Maintenance"}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-1">
                          <div className="flex items-center text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < Math.round(Number(c.rating || 0))
                                    ? "fill-current"
                                    : "text-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-slate-800 ml-0.5">{Number(c.rating || 0).toFixed(1)}</span>
                        </div>
                        <span className="text-slate-300">|</span>
                        <div className="text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">{c.jobs || 0}</span> jobs completed
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="border-t border-slate-100 pt-3 mt-4 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <a href={`tel:${c.phone}`} className="hover:text-primary transition-colors truncate">
                            {c.phone}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <a href={`mailto:${c.email}`} className="hover:text-primary transition-colors truncate">
                            {c.email}
                          </a>
                        </div>
                      </div>

                      <div className="mt-5 flex gap-2 w-full">
                        <a href={`tel:${c.phone}`} className="flex-1" title="Call contractor">
                          <Button size="sm" variant="outline" className="w-full h-9" aria-label={`Call ${c.name}`}>
                            <Phone className="mr-1.5 h-3.5 w-3.5" />
                            Call
                          </Button>
                        </a>
                        <a href={`mailto:${c.email}`} className="flex-1" title="Email contractor">
                          <Button size="sm" variant="outline" className="w-full h-9" aria-label={`Email ${c.name}`}>
                            <Mail className="mr-1.5 h-3.5 w-3.5" />
                            Email
                          </Button>
                        </a>
                        <Button
                          size="sm"
                          className="flex-1 h-9 shadow-sm"
                          onClick={() => setAssigningContractor(c)}
                          aria-label={`Assign job to ${c.name}`}
                        >
                          Assign Job
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assign Job Confirmation Dialog */}
      <Dialog open={!!assigningContractor} onOpenChange={(open) => {
        if (!open) {
          setAssigningContractor(null);
          setSelectedRequestId("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Contractor</DialogTitle>
            <DialogDescription>
              Assign this job request to {assigningContractor?.companyName || assigningContractor?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="activeRequestSelect">Select Active Service Request</Label>
            <Select value={selectedRequestId} onValueChange={setSelectedRequestId}>
              <SelectTrigger id="activeRequestSelect" aria-label="Select request">
                <SelectValue placeholder="Select service request..." />
              </SelectTrigger>
              <SelectContent>
                {requestList
                  .filter((r) => r.status === "Pending" || r.status === "Open")
                  .map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.id} — {r.title} ({r.property})
                    </SelectItem>
                  ))}
                {requestList.filter((r) => r.status === "Pending" || r.status === "Open").length === 0 && (
                  <SelectItem value="none" disabled>
                    No pending service requests
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => {
              setAssigningContractor(null);
              setSelectedRequestId("");
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedRequestId || selectedRequestId === "none") {
                  toast.error("Please select a request first");
                  return;
                }
                const reqId = parseInt(selectedRequestId.replace("SR-", ""), 10);
                assignMutation.mutate({
                  service_request_id: reqId,
                  contractor_id: parseInt(assigningContractor.id.replace("C-", ""), 10)
                });
              }}
              disabled={assignMutation.isPending}
            >
              {assignMutation.isPending ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
