import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { DataTable } from "@/shared/components/common/DataTable";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  getPropertyReadinessRecords,
  getRealtorCommunications,
  getRealtorPropertyListings,
  getRealtors,
  getTenantOnboardingRecords,
} from "@/core/db/supabase-queries";

type Row = Record<string, any>;
type WorkspaceTab = "realtors" | "listings" | "onboarding" | "readiness" | "communications";

const RESPONSIBILITY_LABELS: Record<Exclude<WorkspaceTab, "realtors">, string> = {
  listings: "Property listings",
  onboarding: "Tenant onboarding",
  readiness: "Property readiness",
  communications: "Communications",
};

const TAB_ADD_ACTIONS: Record<Exclude<WorkspaceTab, "realtors">, { label: string; to: string }> = {
  listings: { label: "Add property listing", to: "/app/properties?openAdd=1" },
  onboarding: { label: "Add tenant onboarding", to: "/app/tenants?openAdd=1" },
  readiness: { label: "Add property readiness", to: "/app/service-requests?openAdd=1" },
  communications: { label: "Add communication", to: "/app/service-communications?openAdd=1" },
};

export const Route = createFileRoute("/app/realtor-workspace")({
  head: () => ({ meta: [{ title: "Realtor Workspace — HomeSure" }] }),
  component: RealtorWorkspacePage,
});

function date(value: unknown) {
  if (!value) return "—";
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime())
    ? String(value)
    : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(parsed);
}

function currency(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount)
    : "—";
}

function LoadingOrError({ isLoading, isError, label }: { isLoading: boolean; isError: boolean; label: string }) {
  if (isLoading) return <div className="py-12 text-center text-sm text-muted-foreground">Loading {label}...</div>;
  if (isError) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load {label}. Please try again.</div>;
  return null;
}

function RealtorWorkspacePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("realtors");
  const realtorProfiles = useQuery<Row[]>({ queryKey: ["realtors"], queryFn: getRealtors });
  const listings = useQuery<Row[]>({ queryKey: ["realtor-property-listings"], queryFn: getRealtorPropertyListings });
  const onboarding = useQuery<Row[]>({ queryKey: ["tenant-onboarding"], queryFn: getTenantOnboardingRecords });
  const readiness = useQuery<Row[]>({ queryKey: ["property-readiness"], queryFn: getPropertyReadinessRecords });
  const communications = useQuery<Row[]>({ queryKey: ["realtor-communications"], queryFn: getRealtorCommunications });

  const isResponsibilityTab = activeTab !== "realtors";
  const activeAction = isResponsibilityTab ? TAB_ADD_ACTIONS[activeTab] : null;

  const handleAddAction = () => {
    if (!activeAction) return;
    navigate({ href: activeAction.to });
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title="Realtor Workspace" description="Manage listings, tenant onboarding, property readiness, and communications." />
        {isResponsibilityTab && activeAction && (
          <Button type="button" className="shrink-0" onClick={handleAddAction}>
            {activeAction.label}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as WorkspaceTab)} className="space-y-4">
        <TabsList className="h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="realtors">Realtors</TabsTrigger>
          <TabsTrigger value="listings">Property listings</TabsTrigger>
          <TabsTrigger value="onboarding">Tenant onboarding</TabsTrigger>
          <TabsTrigger value="readiness">Property readiness</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
        </TabsList>

        <TabsContent value="realtors">
          <LoadingOrError isLoading={realtorProfiles.isLoading} isError={realtorProfiles.isError} label="realtors" />
          {!realtorProfiles.isLoading && !realtorProfiles.isError && <DataTable rows={realtorProfiles.data || []} filterKeys={["realtor_id", "realtor_name", "agency_name", "email", "mobile_number", "operating_city", "account_status"]} empty="No realtors found." columns={[
            { key: "realtor_id", header: "Realtor ID", sortable: true, render: (row) => `#${row.realtor_id}` },
            { key: "realtor_name", header: "Name", sortable: true, render: (row) => row.realtor_name || "—" },
            { key: "agency_name", header: "Agency", render: (row) => row.agency_name || "—" },
            { key: "email", header: "Email", render: (row) => row.email || "—" },
            { key: "mobile_number", header: "Mobile", render: (row) => row.mobile_number || "—" },
            { key: "license_number", header: "License", render: (row) => row.license_number || "—" },
            { key: "operating_city", header: "City", render: (row) => row.operating_city || "—" },
            { key: "account_status", header: "Status", render: (row) => <StatusBadge value={row.account_status || "Inactive"} /> },
          ]} />}
        </TabsContent>

        <TabsContent value="listings">
          <LoadingOrError isLoading={listings.isLoading} isError={listings.isError} label="property listings" />
          {!listings.isLoading && !listings.isError && <DataTable rows={listings.data || []} filterKeys={["listing_id", "realtor_id", "property_id", "listing_type", "listing_status", "remarks"]} empty="No property listings found." columns={[
            { key: "listing_id", header: "Listing ID", sortable: true, render: (row) => `#${row.listing_id}` },
            { key: "realtor_id", header: "Realtor", render: (row) => `#${row.realtor_id}` },
            { key: "property_id", header: "Property", render: (row) => `#${row.property_id}` },
            { key: "landlord_id", header: "Landlord", render: (row) => `#${row.landlord_id}` },
            { key: "listing_type", header: "Type", render: (row) => row.listing_type || "—" },
            { key: "listing_price", header: "Price", render: (row) => currency(row.listing_price) },
            { key: "listing_status", header: "Status", render: (row) => <StatusBadge value={row.listing_status || "Pending"} /> },
            { key: "listing_date", header: "Listed", render: (row) => date(row.listing_date) },
            { key: "remarks", header: "Remarks", render: (row) => row.remarks || "—" },
          ]} />}
        </TabsContent>

        <TabsContent value="onboarding">
          <LoadingOrError isLoading={onboarding.isLoading} isError={onboarding.isError} label="tenant onboarding records" />
          {!onboarding.isLoading && !onboarding.isError && <DataTable rows={onboarding.data || []} filterKeys={["onboarding_id", "realtor_id", "tenant_id", "property_id", "onboarding_status", "onboarding_stage", "remarks"]} empty="No tenant onboarding records found." columns={[
            { key: "onboarding_id", header: "Onboarding ID", sortable: true, render: (row) => `#${row.onboarding_id}` },
            { key: "realtor_id", header: "Realtor", render: (row) => `#${row.realtor_id}` },
            { key: "tenant_id", header: "Tenant", render: (row) => `#${row.tenant_id}` },
            { key: "property_id", header: "Property", render: (row) => `#${row.property_id}` },
            { key: "onboarding_status", header: "Status", render: (row) => <StatusBadge value={row.onboarding_status || "Pending"} /> },
            { key: "onboarding_stage", header: "Stage", render: (row) => row.onboarding_stage || "—" },
            { key: "completed_date", header: "Completed", render: (row) => date(row.completed_date) },
            { key: "remarks", header: "Remarks", render: (row) => row.remarks || "—" },
          ]} />}
        </TabsContent>

        <TabsContent value="readiness">
          <LoadingOrError isLoading={readiness.isLoading} isError={readiness.isError} label="property readiness records" />
          {!readiness.isLoading && !readiness.isError && <DataTable rows={readiness.data || []} filterKeys={["readiness_id", "realtor_id", "property_id", "readiness_status", "furnishing_status", "inspection_notes"]} empty="No property readiness records found." columns={[
            { key: "readiness_id", header: "Readiness ID", sortable: true, render: (row) => `#${row.readiness_id}` },
            { key: "realtor_id", header: "Realtor", render: (row) => `#${row.realtor_id}` },
            { key: "property_id", header: "Property", render: (row) => `#${row.property_id}` },
            { key: "inspection_date", header: "Inspection", render: (row) => date(row.inspection_date) },
            { key: "cleaning_completed", header: "Cleaning", render: (row) => row.cleaning_completed ? "Completed" : "Pending" },
            { key: "maintenance_completed", header: "Maintenance", render: (row) => row.maintenance_completed ? "Completed" : "Pending" },
            { key: "furnishing_status", header: "Furnishing", render: (row) => row.furnishing_status || "—" },
            { key: "readiness_status", header: "Status", render: (row) => <StatusBadge value={row.readiness_status || "Pending"} /> },
            { key: "inspection_notes", header: "Notes", render: (row) => row.inspection_notes || "—" },
          ]} />}
        </TabsContent>

        <TabsContent value="communications">
          <LoadingOrError isLoading={communications.isLoading} isError={communications.isError} label="communications" />
          {!communications.isLoading && !communications.isError && <DataTable rows={communications.data || []} filterKeys={["communication_id", "realtor_id", "landlord_id", "tenant_id", "communication_type", "subject", "communication_notes"]} empty="No communications found." columns={[
            { key: "communication_id", header: "Communication ID", sortable: true, render: (row) => `#${row.communication_id}` },
            { key: "realtor_id", header: "Realtor", render: (row) => `#${row.realtor_id}` },
            { key: "landlord_id", header: "Landlord", render: (row) => `#${row.landlord_id}` },
            { key: "tenant_id", header: "Tenant", render: (row) => `#${row.tenant_id}` },
            { key: "communication_type", header: "Type", render: (row) => row.communication_type || "—" },
            { key: "subject", header: "Subject", sortable: true, render: (row) => row.subject || "—" },
            { key: "communication_notes", header: "Notes", render: (row) => row.communication_notes || "—" },
            { key: "communication_date", header: "Date", render: (row) => date(row.communication_date) },
          ]} />}
        </TabsContent>
      </Tabs>
    </>
  );
}
