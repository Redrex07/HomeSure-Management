import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { contractors } from "@/shared/utils/mock-data";
import { Plus, Star, Phone } from "lucide-react";

export const Route = createFileRoute("/app/contractors")({
  head: () => ({ meta: [{ title: "Contractors — HomeSure" }] }),
  component: ContractorsPage,
});

function ContractorsPage() {
  return (
    <>
      <PageHeader
        title="Contractor directory"
        description="Browse trusted contractors and their availability."
        actions={
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" /> Invite contractor
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {contractors.map((c) => (
          <Card
            key={c.id}
            className="border-border/70 shadow-card transition-shadow hover:shadow-elegant"
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary-soft text-sm text-primary">
                    {c.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate font-semibold">{c.name}</div>
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
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 text-warning">
                      <Star className="h-3 w-3 fill-current" />
                      {c.rating}
                    </span>
                    <span>·</span>
                    <span>{c.jobs} jobs</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Phone className="mr-1 h-3.5 w-3.5" />
                  Call
                </Button>
                <Button size="sm" className="flex-1">
                  Assign job
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
