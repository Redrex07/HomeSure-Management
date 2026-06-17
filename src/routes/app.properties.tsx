import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataCardGrid } from "@/shared/components/common/DataCardGrid";
import { Plus, Download, Trash2, ImagePlus, X, Pencil, Image } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/core/db/supabase";
import { getLandlordProperties } from "@/core/db/supabase-queries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  image_url?: string; // JSON array string e.g. '["url1","url2"]' or single URL
  [key: string]: unknown;
}

function PropertiesPage() {
  const landlordId = 2;

  const [landlordProps, setLandlordProps] = useState<SupabaseProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPropertyForImage, setSelectedPropertyForImage] =
    useState<SupabaseProperty | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [editingProperty, setEditingProperty] = useState<SupabaseProperty | null>(null);
  const [editForm, setEditForm] = useState({
    property_name: "",
    property_type: "",
    address: "",
    rent_amount: "",
    availability_status: "Available",
  });
  const [editImages, setEditImages] = useState<string[]>([]);
  const [isEditUploading, setIsEditUploading] = useState(false);

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
        image_url:
          uploadedImages.length > 0 ? JSON.stringify(uploadedImages) : null,
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
    });
    setUploadedImages([]);

    setIsAdding(false);
    loadProperties();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const slotsLeft = 3 - uploadedImages.length;
    if (slotsLeft <= 0) {
      toast.error("Maximum 3 images allowed per property.");
      return;
    }

    // Take only as many files as slots remaining
    const filesToUpload = Array.from(files).slice(0, slotsLeft);
    if (files.length > slotsLeft) {
      toast.warning(
        `Only ${slotsLeft} slot(s) remaining. Uploading first ${slotsLeft} of ${files.length} selected.`,
      );
    }

    try {
      setIsUploading(true);
      const newUrls: string[] = [];

      for (const file of filesToUpload) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(fileName, file);

        if (uploadError) {
          toast.error(`Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("property-images").getPublicUrl(fileName);

        newUrls.push(publicUrl);
      }

      if (newUrls.length > 0) {
        setUploadedImages((prev) => [...prev, ...newUrls]);
        toast.success(
          `${newUrls.length} image${newUrls.length > 1 ? "s" : ""} uploaded successfully!`,
        );
      }
    } catch (error) {
      toast.error(
        "Error uploading images: " +
          (error instanceof Error ? error.message : String(error)),
      );
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  /** Parse image_url field — supports JSON array or single URL */
  const parseImageUrls = (imageUrl?: string): string[] => {
    if (!imageUrl) return [];
    try {
      const parsed = JSON.parse(imageUrl);
      if (Array.isArray(parsed)) return parsed;
      return [String(parsed)];
    } catch {
      return [imageUrl];
    }
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

  const openEditDialog = (p: SupabaseProperty) => {
    setEditingProperty(p);
    setEditForm({
      property_name: p.property_name,
      property_type: p.property_type,
      address: p.address,
      rent_amount: String(p.rent_amount),
      availability_status: p.availability_status,
    });
    setEditImages(parseImageUrls(p.image_url));
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const slotsLeft = 3 - editImages.length;
    if (slotsLeft <= 0) {
      toast.error("Maximum 3 images allowed.");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, slotsLeft);
    try {
      setIsEditUploading(true);
      const newUrls: string[] = [];
      for (const file of filesToUpload) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(fileName, file);
        if (uploadError) {
          toast.error(`Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }
        const {
          data: { publicUrl },
        } = supabase.storage.from("property-images").getPublicUrl(fileName);
        newUrls.push(publicUrl);
      }
      if (newUrls.length > 0) {
        setEditImages((prev) => [...prev, ...newUrls]);
        toast.success(`${newUrls.length} image(s) uploaded!`);
      }
    } catch (error) {
      toast.error(
        "Error uploading: " +
          (error instanceof Error ? error.message : String(error)),
      );
    } finally {
      setIsEditUploading(false);
      e.target.value = "";
    }
  };

  const handleUpdateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;

    if (
      !editForm.property_name ||
      !editForm.property_type ||
      !editForm.address ||
      !editForm.rent_amount
    ) {
      toast.error("Please fill all fields");
      return;
    }

    const { error } = await supabase
      .from("properties")
      .update({
        property_name: editForm.property_name,
        property_type: editForm.property_type,
        address: editForm.address,
        rent_amount: Number(editForm.rent_amount),
        availability_status: editForm.availability_status,
        image_url: editImages.length > 0 ? JSON.stringify(editImages) : null,
      })
      .eq("property_id", editingProperty.property_id);

    if (error) {
      toast.error("Error updating property: " + error.message);
      return;
    }

    toast.success("Property updated successfully!");
    setEditingProperty(null);
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
            <DialogDescription className="sr-only">Fill out this form to add a new property.</DialogDescription>
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
              <Label>Pictures (Up to 3)</Label>

              {/* Thumbnail preview of uploaded images */}
              {uploadedImages.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {uploadedImages.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border"
                    >
                      <img
                        src={url}
                        alt={`Upload ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeUploadedImage(idx)}
                        className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              {uploadedImages.length < 3 && (
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                  <div className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {isUploading
                        ? "Uploading..."
                        : `Click to upload (${3 - uploadedImages.length} remaining)`}
                    </span>
                  </div>
                </div>
              )}
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

      {/* View Image Gallery Dialog */}
      <Dialog
        open={!!selectedPropertyForImage}
        onOpenChange={(open) => !open && setSelectedPropertyForImage(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPropertyForImage?.property_name} - Pictures
            </DialogTitle>
            <DialogDescription className="sr-only">
              Image gallery for the property
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const imgs = parseImageUrls(
              selectedPropertyForImage?.image_url,
            );
            if (imgs.length === 0) {
              return (
                <div className="flex items-center justify-center p-8 bg-muted/30 rounded-lg min-h-[300px]">
                  <div className="text-center text-muted-foreground">
                    <ImagePlus className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p>No pictures uploaded for this property yet.</p>
                  </div>
                </div>
              );
            }
            if (imgs.length === 1) {
              return (
                <div className="rounded-xl overflow-hidden bg-muted/30">
                  <img
                    src={imgs[0]}
                    alt={selectedPropertyForImage?.property_name}
                    className="w-full max-h-[65vh] object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/600x400?text=Image+Not+Found";
                    }}
                  />
                </div>
              );
            }
            // 2 or 3 images — gallery grid layout
            return (
              <div
                className="grid gap-2 rounded-xl overflow-hidden"
                style={{
                  gridTemplateColumns: "1fr 1fr",
                  gridTemplateRows:
                    imgs.length === 3 ? "1fr 1fr" : "1fr",
                  height: "450px",
                }}
              >
                {/* Main large image — spans left column */}
                <div
                  className="relative overflow-hidden rounded-lg bg-muted/40 flex items-center justify-center"
                  style={{
                    gridRow:
                      imgs.length === 3 ? "1 / 3" : "1",
                  }}
                >
                  <img
                    src={imgs[0]}
                    alt="Main"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/600x400?text=Image+Not+Found";
                    }}
                  />
                </div>
                {/* Second image — top right */}
                <div className="relative overflow-hidden rounded-lg bg-muted/40 flex items-center justify-center">
                  <img
                    src={imgs[1]}
                    alt="Second"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/600x400?text=Image+Not+Found";
                    }}
                  />
                </div>
                {/* Third image — bottom right (if exists) */}
                {imgs.length === 3 && (
                  <div className="relative overflow-hidden rounded-lg bg-muted/40 flex items-center justify-center">
                    <img
                      src={imgs[2]}
                      alt="Third"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/600x400?text=Image+Not+Found";
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })()}
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
            {
              key: "image_url",
              label: "Pictures",
              render: (p) => (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPropertyForImage(p);
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                >
                  <Image className="h-3 w-3" />
                  View Pictures
                </button>
              ),
            },
          ]}
          actions={(p) => (
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-primary-soft hover:text-primary"
                onClick={() => openEditDialog(p)}
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => handleDeleteProperty(p.property_id)}
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        />
      )}

      {/* Edit Property Dialog */}
      <Dialog
        open={!!editingProperty}
        onOpenChange={(open) => !open && setEditingProperty(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription className="sr-only">
              Edit the details of this property.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateProperty} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Property Name</Label>
              <Input
                value={editForm.property_name}
                onChange={(e) =>
                  setEditForm({ ...editForm, property_name: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Property Type</Label>
              <Input
                value={editForm.property_type}
                onChange={(e) =>
                  setEditForm({ ...editForm, property_type: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Address</Label>
              <Input
                value={editForm.address}
                onChange={(e) =>
                  setEditForm({ ...editForm, address: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Rent Amount</Label>
              <Input
                type="number"
                value={editForm.rent_amount}
                onChange={(e) =>
                  setEditForm({ ...editForm, rent_amount: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <select
                className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                value={editForm.availability_status}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    availability_status: e.target.value,
                  })
                }
              >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label>Pictures (Up to 3)</Label>
              {editImages.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {editImages.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border"
                    >
                      <img
                        src={url}
                        alt={`Image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditImages((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {editImages.length < 3 && (
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    onChange={handleEditImageUpload}
                    disabled={isEditUploading}
                  />
                  <div className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {isEditUploading
                        ? "Uploading..."
                        : `Click to upload (${3 - editImages.length} remaining)`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingProperty(null)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Property</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
