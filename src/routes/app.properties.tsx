import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataCardGrid } from "@/shared/components/common/DataCardGrid";
import { Plus, Download, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/core/db/supabase";
import { getLandlordProperties } from "@/core/db/supabase-queries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/app/properties")({
  head: () => ({ meta: [{ title: "Properties — HomeSure" }] }),
  component: PropertiesPage,
});

interface SupabaseProperty {
  property_id: number;
  landlord_id: number;
  property_name: string;
  property_type: string;
  address: string;
  rent_amount: number;
  availability_status: string;
  image_url?: string;
  [key: string]: unknown;
}

function PropertiesPage() {
  const landlordId = 2;

  const [landlordProps, setLandlordProps] = useState<SupabaseProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPropertyForImage, setSelectedPropertyForImage] = useState<SupabaseProperty | null>(null);

  const [form, setForm] = useState({
    property_name: "",
    property_type: "",
    address: "",
    rent_amount: "",
    availability_status: "Available",
    image_url: "",
  });

  const loadProperties = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getLandlordProperties(String(landlordId));
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
      toast.error("Please fill all fields");
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
        image_url: form.image_url,
      },
    ]);

    if (error) {
      toast.error("Error adding property: " + error.message);
      return;
    }

    toast.success("Property added successfully!");

    setForm({
      property_name: "",
      property_type: "",
      address: "",
      rent_amount: "",
      availability_status: "Available",
      image_url: "",
    });

    setIsAdding(false);
    loadProperties();
  };

  const handleExport = () => {
    const headers = ["Property ID", "Property Name", "Type", "Address", "Rent Amount", "Status"];

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

    const { error } = await supabase.from("properties").delete().eq("property_id", propertyId);

    if (error) {
      toast.error("Error deleting property: " + error.message);
      return;
    }

    toast.success("Property deleted successfully!");
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

      {/* Add Property Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddProperty} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Property Name</Label>
              <Input
                placeholder="Example: Green Residency"
                value={form.property_name}
                onChange={(e) => setForm({ ...form, property_name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Property Type</Label>
              <Input
                placeholder="Apartment / Villa"
                value={form.property_type}
                onChange={(e) => setForm({ ...form, property_type: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Address</Label>
              <Input
                placeholder="Chennai, Tamil Nadu"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Rent Amount</Label>
              <Input
                type="number"
                placeholder="18000"
                value={form.rent_amount}
                onChange={(e) => setForm({ ...form, rent_amount: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <select
                className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={form.availability_status}
                onChange={(e) => setForm({ ...form, availability_status: e.target.value })}
              >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label>Picture URL (Optional)</Label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Property</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Image Dialog */}
      <Dialog open={!!selectedPropertyForImage} onOpenChange={(open) => !open && setSelectedPropertyForImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedPropertyForImage?.property_name} - Pictures</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg min-h-[300px]">
            {selectedPropertyForImage?.image_url ? (
              <img
                src={selectedPropertyForImage.image_url}
                alt={selectedPropertyForImage.property_name}
                className="max-h-[60vh] max-w-full rounded-md object-contain shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Image+Not+Found";
                }}
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <p>No pictures uploaded for this property yet.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="p-8 text-center text-gray-600">Loading properties from Supabase...</div>
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
        <DataCardGrid
          rows={landlordProps}
          onCardClick={(p) => setSelectedPropertyForImage(p)}
          filterKeys={["property_name", "address", "property_id"]}
          fields={[
            {
              key: "property_name",
              label: "Property",
              primary: true,
              render: (p) => (
                <Link
                  to="/app/properties/$id"
                  params={{ id: String(p.property_id) }}
                  className="hover:text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {p.property_name}
                </Link>
              ),
            },
            {
              key: "address",
              label: "Address",
              secondary: true,
            },
            {
              key: "property_id",
              label: "ID",
              render: (p) => (
                <span className="font-mono text-[11px] text-muted-foreground">
                  #{p.property_id}
                </span>
              ),
            },
            {
              key: "property_type",
              label: "Type",
            },
            {
              key: "rent_amount",
              label: "Rent",
              render: (p) => (
                <span className="font-semibold text-foreground">
                  ₹{p.rent_amount?.toLocaleString()}
                </span>
              ),
            },
            {
              key: "availability_status",
              label: "Status",
              render: (p) => <StatusBadge value={p.availability_status} />,
            },
          ]}
          actions={(p) => (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => handleDeleteProperty(p.property_id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        />
      )}
    </>
  );
}
