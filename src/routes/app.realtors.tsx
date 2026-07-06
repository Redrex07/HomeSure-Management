import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { getRealtors, createRealtor } from "@/core/db/supabase-queries";
import { Building2, Plus, Phone, Mail, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/realtors")({
  head: () => ({ meta: [{ title: "Realtors — HomeSure" }] }),
  component: RealtorsPage,
});

function RealtorsPage() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const queryClient = useQueryClient();

  const { data: realtorList = [], isLoading } = useQuery({
    queryKey: ["realtors"],
    queryFn: getRealtors,
  });

  const realtorStats = useMemo(() => {
    const total = realtorList.length;
    const agencies = new Set(realtorList.map((realtor) => realtor.agencyName)).size;
    return { total, agencies };
  }, [realtorList]);

  const createMutation = useMutation({
    mutationFn: createRealtor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["realtors"] });
      toast.success("Realtor added successfully!");
      setOpen(false);
      setName("");
      setAgencyName("");
      setEmail("");
      setPhone("");
    },
    onError: (err: any) => {
      toast.error("Error adding realtor: " + (err.message || String(err)));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      agencyName,
      email,
      phone,
    });
  };

  return (
    <>
      <PageHeader
        title="Realtor directory"
        description="Track the realtor network and keep listings moving before the Supabase tables are ready."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add realtor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Realtor</DialogTitle>
                <DialogDescription>
                  Create a temporary realtor profile in the local prototype store.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <Label>Full name</Label>
                  <Input
                    placeholder="e.g. Linda Park"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Agency name</Label>
                  <Input
                    placeholder="e.g. Park & Co."
                    required
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="e.g. linda@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input
                    placeholder="e.g. (555) 555-0101"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      setName("");
                      setAgencyName("");
                      setEmail("");
                      setPhone("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Adding..." : "Add realtor"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/70 shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-primary-soft p-2 text-primary">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{realtorStats.total}</div>
              <div className="text-xs text-muted-foreground">Total realtors</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-info/10 p-2 text-info">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{realtorStats.agencies}</div>
              <div className="text-xs text-muted-foreground">Active agencies</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-md border border-border/60 bg-background/50">
          <p className="animate-pulse text-sm text-muted-foreground">Loading realtor list...</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {realtorList.map((realtor) => (
            <Card key={realtor.id} className="border-border/70 shadow-card transition-shadow hover:shadow-elegant">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary-soft text-sm text-primary">
                      {(realtor.realtorName || realtor.name)
                        .split(" ")
                        .map((word: string) => word[0])
                        .slice(0, 2)
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate font-semibold">{realtor.realtorName || realtor.name}</div>
                      <Badge variant="outline" className="border-info/30 bg-info/10 text-info">
                        Realtor
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{realtor.agencyName}</div>
                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{realtor.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{realtor.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <a href={`tel:${realtor.phone}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full">
                      Call
                    </Button>
                  </a>
                  <a href={`mailto:${realtor.email}`} className="flex-1">
                    <Button size="sm" className="w-full">
                      Email
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}