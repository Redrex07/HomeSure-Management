import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/shared/components/ui/badge";
import { Label } from "@/shared/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Progress } from "@/shared/components/ui/progress";
import { StatCard } from "@/shared/components/common/StatCard";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { PageHeader } from "@/shared/components/common/PageHeader";
import {
  ChartCard,
  RevenueArea,
  RequestsBar,
  CategoryPie,
} from "@/shared/components/charts/Charts";
import {
  Users,
  Building2,
  CreditCard,
  DollarSign,
  Wrench,
  ClipboardCheck,
  HardHat,
  Clock,
  LifeBuoy,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Receipt,
  Eye,
  Plus,
  TrendingUp,
  FileSpreadsheet,
  Sparkles,
  Home,
} from "lucide-react";
import {
  properties,
  tenants,
  serviceRequests,
  contractors,
  appointments,
  estimates,
  invoices,
  tickets,
  users,
  subscriptions,
  auditLogs,
  revenueSeries,
  requestsSeries,
  categoryBreakdown,
  listings,
  leaseDocs,
  followUps,
  realtorNotifications,
} from "@/shared/utils/mock-data";
import { Link } from "@tanstack/react-router";
import { useSession } from "@/features/auth/store/auth-store";
import { formatINR } from "@/shared/utils/utils";
import { createAiListing, getAiListings, getLandlordProperties } from "@/core/db/supabase-queries";

const fmt = (n: number) => formatINR(n);

type PropertyOption = {
  property_id: number;
  property_name: string;
  property_type?: string | null;
  rent_amount?: number | string | null;
  availability_status?: string | null;
  Description?: string | null;
  Category?: string | null;
  amenities?: string | null;
  address?: string | null;
};

type GeneratedAiListing = {
  propertyId: number;
  title: string;
  description: string;
  keywords: string[];
  price: number;
};

const formatListingLocation = (address?: string | null) => {
  if (!address) return "a well-connected neighborhood";

  try {
    const parsed = JSON.parse(address);
    if (parsed && typeof parsed === "object") {
      const parts = [
        parsed.building_name,
        parsed.locality,
        parsed.city,
        parsed.state,
      ]
        .map((part) => String(part || "").trim())
        .filter(Boolean);

      if (parts.length > 0) {
        return parts.join(", ");
      }

      const fallbackParts = [parsed.street_address, parsed.landmark, parsed.country]
        .map((part) => String(part || "").trim())
        .filter(Boolean);

      if (fallbackParts.length > 0) {
        return fallbackParts.join(", ");
      }
    }
  } catch {
    // Plain text address, fall through to trimming.
  }

  return address.trim();
};

const buildAiListing = (property: PropertyOption): GeneratedAiListing => {
  const amenityKeywords = (property.amenities || "")
    .split(",")
    .map((amenity) => amenity.trim())
    .filter(Boolean)
    .slice(0, 4);

  const keywords = Array.from(
    new Set([
      property.Category || property.property_type || "Property",
      property.property_type || "Listing",
      property.availability_status || "Available",
      ...amenityKeywords,
      "HomeSure",
    ])
  ).filter(Boolean);

  const rentAmount = Number(property.rent_amount || 0);
  const rentText = rentAmount > 0 ? `${fmt(rentAmount)}/mo` : "competitive pricing";
    const locationText = formatListingLocation(property.address);
    const highlightText = amenityKeywords.length > 0 ? `Notable features include ${amenityKeywords.join(", ")}.` : "Designed for comfortable everyday living.";
    const description = `${property.property_name} is a ${property.property_type || "modern"} ${property.availability_status || "available"} listing in ${locationText}. ${property.Description?.trim() || highlightText} Estimated pricing is ${rentText}.`;

  return {
    propertyId: property.property_id,
    title: `${property.property_name} - ${property.property_type || "Featured Listing"}`,
    description,
    keywords,
    price: rentAmount,
  };
};

/* ---------------- REALTOR ---------------- */
export function RealtorDashboard() {
  const session = useSession();
  const queryClient = useQueryClient();
  const landlordId = session?.id && /^\d+$/.test(session.id) ? session.id : "2";

  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [draftListing, setDraftListing] = useState<GeneratedAiListing | null>(null);

  const { data: propertyOptions = [], isLoading: isPropertiesLoading } = useQuery({
    queryKey: ["realtor-properties", landlordId],
    queryFn: () => getLandlordProperties(landlordId) as Promise<PropertyOption[]>,
  });

  const { data: savedAiListings = [], isLoading: isAiListingsLoading } = useQuery({
    queryKey: ["ai-listings", landlordId],
    queryFn: () => getAiListings(landlordId),
  });

  useEffect(() => {
    if (!selectedPropertyId && propertyOptions.length > 0) {
      setSelectedPropertyId(String(propertyOptions[0].property_id));
    }
  }, [propertyOptions, selectedPropertyId]);

  useEffect(() => {
    setDraftListing(null);
  }, [selectedPropertyId]);

  const selectedProperty = useMemo(
    () => propertyOptions.find((property) => String(property.property_id) === selectedPropertyId) || null,
    [propertyOptions, selectedPropertyId]
  );

  const generatedListing = draftListing;

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProperty) {
        throw new Error("Select a property first.");
      }

      return buildAiListing(selectedProperty);
    },
    onSuccess: (listing) => {
      setDraftListing(listing);
      toast.success("AI listing generated.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Unable to generate listing.");
    },
  });

  const saveMutation = useMutation({
    mutationFn: createAiListing,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ai-listings", landlordId] });
      toast.success("Listing saved to Supabase.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Unable to save listing.");
    },
  });

  const activeListingCount = listings.filter((listing) => listing.status === "Active").length;

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const handleSave = () => {
    if (!generatedListing) {
      toast.error("Generate a listing before saving.");
      return;
    }

    saveMutation.mutate({
      propertyId: generatedListing.propertyId,
      title: generatedListing.title,
      description: generatedListing.description,
      keywords: generatedListing.keywords,
      price: generatedListing.price,
      landlordId,
    });
  };

  return (
    <>
      <PageHeader
        title="Listing performance"
        description="Track properties on the market and onboarding pipeline."
        actions={
          <Link to="/app/properties">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> New listing
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active listings" value={String(activeListingCount)} icon={Building2} delta={2} />
        <StatCard label="Total views (30d)" value="4,218" icon={Eye} tone="info" delta={26} />
        <StatCard label="Leads generated" value="44" icon={TrendingUp} tone="success" delta={12} />
        <StatCard
          label="Onboarding tenants"
          value={String(tenants.filter((t) => t.status === "Onboarding").length)}
          icon={Users}
          tone="warning"
        />
      </div>

      <Card className="border-border/70 shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Listings</CardTitle>
          <Link to="/app/properties">
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="px-0">
          <div className="divide-y divide-border">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="grid grid-cols-2 items-center gap-3 px-6 py-3 sm:grid-cols-6"
              >
                <div className="sm:col-span-2">
                  <div className="text-sm font-medium">{listing.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {listing.id} · {fmt(listing.price)}/mo
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Views</div>
                  <div className="text-sm font-semibold">{listing.views.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Leads</div>
                  <div className="text-sm font-semibold">{listing.leads}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Days listed</div>
                  <div className="text-sm font-semibold">{listing.days}</div>
                </div>
                <div className="text-right">
                  <StatusBadge value={listing.status} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Property readiness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Harbor View Loft 12", v: 92 },
              { name: "Cedar Heights #11", v: 78 },
              { name: "Ridgeline Studio", v: 35 },
              { name: "Riverside 2BR", v: 60 },
            ].map((property) => (
              <div key={property.name}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{property.name}</span>
                  <span className="text-muted-foreground">{property.v}%</span>
                </div>
                <Progress value={property.v} className="mt-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Tenant onboarding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tenants.slice(-3).map((tenant) => (
              <div
                key={tenant.id}
                className="flex items-center gap-3 rounded-md border border-border/60 p-2.5"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary-soft text-xs text-primary">
                    {tenant.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{tenant.name}</div>
                  <div className="text-xs text-muted-foreground">{tenant.email}</div>
                </div>
                <StatusBadge value={tenant.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 border-border/70 shadow-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">AI Listing Generator</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Property</Label>

            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={isPropertiesLoading ? "Loading properties..." : "Choose a property"}
                />
              </SelectTrigger>

              <SelectContent>
                {propertyOptions.map((property) => (
                  <SelectItem key={property.property_id} value={String(property.property_id)}>
                    {property.property_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full"
            onClick={handleGenerate}
            disabled={generateMutation.isPending || isPropertiesLoading || propertyOptions.length === 0}
          >
            {generateMutation.isPending ? "Generating..." : "Generate AI Listing"}
          </Button>

          {generatedListing ? (
            <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Generated Title</p>
                <p className="font-semibold">{generatedListing.title}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="text-sm">{generatedListing.description}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">SEO Keywords</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {generatedListing.keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleSave}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Saving..." : "Save Listing"}
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              Pick a property and generate a listing to see the AI preview here.
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Saved AI listings</p>
              <p className="text-xs text-muted-foreground">
                {isAiListingsLoading ? "Loading..." : `${savedAiListings.length} saved`}
              </p>
            </div>

            {savedAiListings.length > 0 ? (
              savedAiListings.map((listing) => (
                <div key={listing.id} className="space-y-3 rounded-lg border border-border bg-background p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Generated Title</p>
                    <p className="font-semibold">{listing.title}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p className="text-sm">{listing.description}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">SEO Keywords</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {listing.keywords.map((keyword) => (
                        <Badge key={keyword} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-border/70 bg-background p-4 text-sm text-muted-foreground">
                No saved AI listings yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4 border-border/70 shadow-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Follow-up Reminders</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {followUps.map((followUp: (typeof followUps)[number]) => (
            <div
              key={followUp.id}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div>
                <h4 className="font-medium">{followUp.customer}</h4>
                <p className="text-sm text-muted-foreground">{followUp.property}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {followUp.type} • {followUp.date}
                </p>
              </div>

              <StatusBadge value={followUp.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
