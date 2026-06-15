import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DataTable } from "@/components/common/DataTable";
import { Plus, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-store";
import { getLandlordProperties, getAllProperties, testSupabaseConnection } from "@/lib/supabase-queries";

export const Route = createFileRoute("/app/properties")({
  head: () => ({ meta: [{ title: "Properties — HomeSure" }] }),
  component: PropertiesPage,
});

function PropertiesPage() {
  const session = useSession();
  const landlordId = "2"; // Using landlord_id from Supabase
  console.log("LANDLORD ID =", landlordId);
  const [landlordProps, setLandlordProps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        console.log("🧪 Starting connection test...");
        const connTest = await testSupabaseConnection();
        
        if (!connTest.connected) {
          console.error("❌ Supabase connection FAILED:", connTest.error);
          setError(`Connection Error: ${connTest.error}`);
          setLandlordProps([]);
          setIsLoading(false);
          return;
        }
        
        console.log("✅ Supabase connected! Now loading data...");

const data = await getAllProperties();

console.log("📊 Result:", data);
console.log("📊 Length:", data?.length);

setLandlordProps(data || []);

if (!data) {
  setError("No data returned from Supabase");
  setIsLoading(false);
  return;
}

if (data.length === 0) {
  setError(
    "No properties returned from Supabase. Check browser console for details."
  );
} else {
  setError(null);
}
console.log("❌ Error:", error);

setLandlordProps(data || []);

if (error) {
  setError(`Supabase Error: ${error.message}`);
  return;
}

if (!data) {
  setError("No data returned from Supabase");
  return;
}

if (data.length === 0) {
  setError(`No properties found. landlord_id being searched: ${landlordId}`);
  return;
}

setError("");
      } catch (error) {
        console.error("❌ Exception:", error);
        setError(`Error: ${String(error)}`);
        setLandlordProps([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadProperties();
  }, [landlordId]);

  return (
    <>
      <PageHeader
        title="Properties"
        description="All properties in your portfolio."
        actions={<>
          <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
          <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add property</Button>
        </>}
      />
      {isLoading ? (
        <div className="p-8 text-center text-gray-600">Loading properties from Supabase...</div>
      ) : error ? (
        <div className="p-8 rounded-lg bg-yellow-50 border border-yellow-200">
          <p className="text-yellow-800"><strong>⚠️ {error}</strong></p>
          <p className="text-sm text-yellow-700 mt-2">
            <strong>DEBUG:</strong> This page is showing ALL properties from your Supabase table (no filter).
          </p>
          <p className="text-sm text-yellow-700 mt-1">
            If you see this message, your properties table is either empty OR Supabase connection failed.
          </p>
        </div>
      ) : landlordProps.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>No properties found in Supabase for landlord: <code className="bg-gray-100 px-2 py-1 rounded">{landlordId}</code></p>
        </div>
      ) : (
        <DataTable
          rows={landlordProps}
          filterKeys={[
  "property_name",
  "address",
  "property_id"
] as any}
          columns={[
  {
    key: "property_name",
    header: "Property",
    sortable: true,
    render: (p: any) => (
      <div className="flex items-center gap-3">
        <div>
          <Link
            to="/app/properties/$id"
            params={{ id: String(p.property_id) }}
            className="text-sm font-medium hover:underline"
          >
            {p.property_name}
          </Link>
          <div className="text-xs text-muted-foreground">
            {p.address}
          </div>
        </div>
      </div>
    ),
  },

  {
    key: "property_id",
    header: "ID",
    render: (p: any) => (
      <span className="font-mono text-xs text-muted-foreground">
        {p.property_id}
      </span>
    ),
  },

  {
    key: "property_type",
    header: "Type",
    sortable: true,
  },

  {
    key: "tenant",
    header: "Tenant",
    render: () => (
      <span className="text-muted-foreground">—</span>
    ),
  },

  {
    key: "rent_amount",
    header: "Rent",
    sortable: true,
    render: (p: any) => (
      <span className="font-medium">
        ₹{p.rent_amount?.toLocaleString()}
      </span>
    ),
  },

  {
    key: "availability_status",
    header: "Status",
    render: (p: any) => (
      <StatusBadge value={p.availability_status} />
    ),
  },
]}
        />
      )}
    </>
  );
}
