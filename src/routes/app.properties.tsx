import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataTable } from "@/shared/components/common/DataTable";
import { Plus, Download, X, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/core/db/supabase";
import { getAllProperties, testSupabaseConnection } from "@/core/db/supabase-queries";

export const Route = createFileRoute("/app/properties")({
  head: () => ({ meta: [{ title: "Properties — HomeSure" }] }),
  component: PropertiesPage,
});

function PropertiesPage() {
  const landlordId = 2;

  const [landlordProps, setLandlordProps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    property_name: "",
    property_type: "",
    address: "",
    rent_amount: "",
    availability_status: "Available",
  });

  const loadProperties = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const connTest = await testSupabaseConnection();

      if (!connTest.connected) {
        setError(`Connection Error: ${connTest.error}`);
        setLandlordProps([]);
        return;
      }

      const data = await getAllProperties();
      setLandlordProps(data || []);
    } catch (err) {
      setError(`Error: ${String(err)}`);
      setLandlordProps([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.property_name || !form.property_type || !form.address || !form.rent_amount) {
      alert("Please fill all fields");
      return;
    }

    const { error } = await supabase.from("properties").insert([
      {
        landlord_id: landlordId,
        property_name: form.property_name,
        property_type: form.property_type,
        address: form.address,
        rent_amount: Number(form.rent_amount),
        availability_status: form.availability_status,
      },
    ]);

    if (error) {
      alert("Error adding property: " + error.message);
      return;
    }

    alert("Property added successfully!");

    setForm({
      property_name: "",
      property_type: "",
      address: "",
      rent_amount: "",
      availability_status: "Available",
    });

    setIsAdding(false);
    loadProperties();
  };
     const handleExport = () => {
  const headers = [
    "Property ID",
    "Property Name",
    "Type",
    "Address",
    "Rent Amount",
    "Status",
  ];

  const rows = landlordProps.map((p) => [
    p.property_id,
    p.property_name,
    p.property_type,
    p.address,
    p.rent_amount,
    p.availability_status,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((value) => `"${value ?? ""}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "properties.csv";
  link.click();

  URL.revokeObjectURL(url);
};

const handleDeleteProperty = async (propertyId: number) => {
  const confirmDelete = confirm("Are you sure you want to delete this property?");

  if (!confirmDelete) return;

  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("property_id", propertyId);

  if (error) {
    alert("Error deleting property: " + error.message);
    return;
  }

  alert("Property deleted successfully!");
  loadProperties();
};
  return (
    <>
      <PageHeader
        title="Properties"
        description="All properties in your portfolio."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleExport}>
  <Download className="mr-2 h-4 w-4" /> Export
</Button>

            <Button size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add property
            </Button>
          </>
        }
      />

      {isAdding && (
        <div className="mb-6 rounded-lg border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Add New Property</h2>
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleAddProperty} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Property Name</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                placeholder="Example: Green Residency"
                value={form.property_name}
                onChange={(e) => setForm({ ...form, property_name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Property Type</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                placeholder="Apartment / Villa"
                value={form.property_type}
                onChange={(e) => setForm({ ...form, property_type: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Address</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                placeholder="Chennai, Tamil Nadu"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Rent Amount</label>
              <input
                type="number"
                className="mt-1 w-full rounded-md border px-3 py-2"
                placeholder="18000"
                value={form.rent_amount}
                onChange={(e) => setForm({ ...form, rent_amount: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={form.availability_status}
                onChange={(e) => setForm({ ...form, availability_status: e.target.value })}
              >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit">Save Property</Button>
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="p-8 text-center text-gray-600">
          Loading properties from Supabase...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-8">
          <p className="text-yellow-800">
            <strong>⚠️ {error}</strong>
          </p>
        </div>
      ) : landlordProps.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>No properties found in Supabase.</p>
        </div>
      ) : (
        <DataTable
          rows={landlordProps}
          filterKeys={["property_name", "address", "property_id"] as any}
          columns={[
            {
              key: "property_name",
              header: "Property",
              sortable: true,
              render: (p: any) => (
                <div>
                  <Link
                    to="/app/properties/$id"
                    params={{ id: String(p.property_id) }}
                    className="text-sm font-medium hover:underline"
                  >
                    {p.property_name}
                  </Link>
                  <div className="text-xs text-muted-foreground">{p.address}</div>
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
              render: () => <span className="text-muted-foreground">—</span>,
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
              render: (p: any) => <StatusBadge value={p.availability_status} />,
            },
            {
  key: "actions",
  header: "Actions",
  render: (p: any) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleDeleteProperty(p.property_id)}
      className="text-red-600 hover:text-red-700"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  ),  
},
          ]}
        />
      )}
    </>
  );
}