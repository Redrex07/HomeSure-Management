import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataCardGrid } from "@/shared/components/common/DataCardGrid";
import { Plus, Download, Trash2, ImagePlus, X, Pencil, Image, ChevronLeft, ChevronRight, ListChecks } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "@/features/auth/store/auth-store";
import {
  useProperties,
  updateProperty as updateLocalProperty,
  deleteProperty as deleteLocalProperty,
  Property as LocalProperty
} from "@/shared/utils/properties-store";
import {
  getLandlordProperties,
  createProperty,
  updateProperty as updateSupabaseProperty,
  deleteProperty as deleteSupabaseProperty
} from "@/core/db/supabase-queries";
import { supabase } from "@/core/db/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
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
import { formatINR } from "@/shared/utils/utils";

export const Route = createFileRoute("/app/properties")({
  head: () => ({ meta: [{ title: "Properties — HomeSure" }] }),
  component: PropertiesPage,
});

/** Fixed room labels mapped by upload order (index 0–3) */
const ROOM_LABELS = ["Hall View", "Front View", "Bed View", "Kitchen View"] as const;

export type UnifiedProperty = LocalProperty & { isLocal?: boolean };

function PropertiesPage() {
  const localProps = useProperties();
  const { session } = useSession();
  const [supabaseProps, setSupabaseProps] = useState<UnifiedProperty[]>([]);

  const fetchSupabaseProperties = async () => {
    const landlordId = "2"; // Force "2" to match Supabase mock data
    const data = await getLandlordProperties(landlordId);
    setSupabaseProps(data as UnifiedProperty[]);
  };

  useEffect(() => {
    fetchSupabaseProperties();
  }, []);

  const landlordProps: UnifiedProperty[] = [
    ...supabaseProps
  ];
  
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("All");
  const [priceFilter, setPriceFilter] = useState("All");

  const filteredProps = landlordProps.filter((p) => {
    let matchesType = true;
    let matchesPrice = true;

    if (propertyTypeFilter !== "All") {
      matchesType = p.property_type.toLowerCase().includes(propertyTypeFilter.toLowerCase());
    }

    if (priceFilter !== "All") {
      const price = p.rent_amount;
      if (priceFilter === "Under ₹10,000") matchesPrice = price < 10000;
      else if (priceFilter === "₹10,000 - ₹20,000") matchesPrice = price >= 10000 && price <= 20000;
      else if (priceFilter === "₹20,000 - ₹50,000") matchesPrice = price > 20000 && price <= 50000;
      else if (priceFilter === "₹50,000 - ₹1,00,000") matchesPrice = price > 50000 && price <= 100000;
      else if (priceFilter === "Over ₹1,00,000") matchesPrice = price > 100000;
    }

    return matchesType && matchesPrice;
  });

  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPropertyForImage, setSelectedPropertyForImage] =
    useState<UnifiedProperty | null>(null);
  const [galleryPage, setGalleryPage] = useState(0);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [editingProperty, setEditingProperty] = useState<UnifiedProperty | null>(null);
  const [selectedPropertyForAmenities, setSelectedPropertyForAmenities] = useState<UnifiedProperty | null>(null);
  const [editForm, setEditForm] = useState({
    property_name: "",
    property_type: "",
    address: "",
    rent_amount: "",
    availability_status: "Available",
    amenities: "",
  });
  const [editImages, setEditImages] = useState<string[]>([]);
  const [isEditUploading, setIsEditUploading] = useState(false);

  const [form, setForm] = useState({
    property_name: "",
    property_type: "",
    address: "",
    rent_amount: "",
    availability_status: "Available",
    amenities: "",
    listing_date: "",
    Description: "",
    Category: "Residential",
  });

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.property_name || !form.property_type) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      await createProperty({
        landlord_id: "2", // Force "2" to match Supabase mock data
        property_name: form.property_name,
        property_type: form.property_type,
        availability_status: form.availability_status,
        image_url: uploadedImages.length > 0 ? JSON.stringify(uploadedImages) : undefined,
        Listing_date: new Date().toISOString(),
        Description: form.Description,
        Category: form.Category,
      });
      toast.success("Property added successfully!");
      fetchSupabaseProperties();
      window.dispatchEvent(new Event("supabase-properties-updated"));
    } catch (error) {
      toast.error("Failed to add property");
      return;
    }

    setForm({
      property_name: "",
      property_type: "",
      address: "",
      rent_amount: "",
      availability_status: "Available",
      amenities: "",
    });
    setUploadedImages([]);
    setIsAdding(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const slotsLeft = 4 - uploadedImages.length;
    if (slotsLeft <= 0) {
      toast.error("Maximum 4 images allowed per property.");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, slotsLeft);
    if (files.length > slotsLeft) {
      toast.warning(
        `Only ${slotsLeft} slot(s) remaining. Uploading first ${slotsLeft} of ${files.length} selected.`,
      );
    }

    setIsUploading(true);
    
    const uploadToSupabase = async (file: File): Promise<string> => {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(`properties/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(`properties/${fileName}`);

      return publicUrlData.publicUrl;
    };

    try {
      const publicUrls = await Promise.all(filesToUpload.map(uploadToSupabase));
      setUploadedImages((prev) => [...prev, ...publicUrls]);
      toast.success(`${publicUrls.length} image${publicUrls.length > 1 ? "s" : ""} uploaded successfully!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to process images. Is your Supabase bucket configured?");
    } finally {
      setIsUploading(false);
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

  const handleDeleteProperty = async (p: UnifiedProperty) => {
    const confirmDelete = confirm("Are you sure you want to delete this property?");

    if (!confirmDelete) return;

    if (p.isLocal) {
      deleteLocalProperty(p.property_id);
      toast.success("Property deleted successfully!");
    } else {
      try {
        await deleteSupabaseProperty(p.property_id);
        toast.success("Property deleted successfully!");
        fetchSupabaseProperties();
        window.dispatchEvent(new Event("supabase-properties-updated"));
      } catch (error) {
        toast.error("Failed to delete property");
      }
    }
  };

  const openEditDialog = (p: UnifiedProperty) => {
    setEditingProperty(p);
    setEditForm({
      property_name: p.property_name,
      property_type: p.property_type,
      address: p.address,
      rent_amount: String(p.rent_amount),
      availability_status: p.availability_status,
      amenities: p.amenities || "",
      listing_date: p.listing_date || "",
      Description: p.Description || "",
      Category: p.Category || "Residential",
    });
    setEditImages(parseImageUrls(p.image_url));
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const slotsLeft = 4 - editImages.length;
    if (slotsLeft <= 0) {
      toast.error("Maximum 4 images allowed.");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, slotsLeft);
    setIsEditUploading(true);

    const uploadToSupabase = async (file: File): Promise<string> => {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(`properties/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(`properties/${fileName}`);

      return publicUrlData.publicUrl;
    };

    try {
      const publicUrls = await Promise.all(filesToUpload.map(uploadToSupabase));
      setEditImages((prev) => [...prev, ...publicUrls]);
      toast.success(`${publicUrls.length} image(s) uploaded!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to process images.");
    } finally {
      setIsEditUploading(false);
      e.target.value = "";
    }
  };

  const handleUpdateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;

    if (!editForm.property_name || !editForm.property_type) {
      toast.error("Please fill all fields");
      return;
    }

    if (editingProperty.isLocal) {
      updateLocalProperty(editingProperty.property_id, {
        property_name: editForm.property_name,
        property_type: editForm.property_type,
        availability_status: editForm.availability_status,
        image_url: editImages.length > 0 ? JSON.stringify(editImages) : undefined,
        Description: editForm.Description,
        Category: editForm.Category,
      });
      toast.success("Property updated successfully!");
      setEditingProperty(null);
    } else {
      try {
        await updateSupabaseProperty(editingProperty.property_id, {
          property_name: editForm.property_name,
          property_type: editForm.property_type,
          availability_status: editForm.availability_status,
          image_url: editImages.length > 0 ? JSON.stringify(editImages) : undefined,
          Description: editForm.Description,
          Category: editForm.Category,
        });
        toast.success("Property updated successfully!");
        setEditingProperty(null);
        fetchSupabaseProperties();
        window.dispatchEvent(new Event("supabase-properties-updated"));
      } catch (error) {
        toast.error("Failed to update property");
      }
    }
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Basic Property Information</DialogTitle>
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
              <Label>Status</Label>
              <select
                className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={form.availability_status}
                onChange={(e) => setForm({ ...form, availability_status: e.target.value })}
              >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Under Maintenance">Under Maintenance</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={form.Description}
                onChange={(e) => setForm({ ...form, Description: e.target.value })}
                placeholder="E.g., Great location, newly renovated..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Category</Label>
              <select
                className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={form.Category}
                onChange={(e) => setForm({ ...form, Category: e.target.value })}
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>



            <div className="grid gap-2">
              <Label>Pictures (Up to 4)</Label>

              {/* Thumbnail preview of uploaded images */}
              {uploadedImages.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                  {uploadedImages.map((url, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div
                        className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border"
                      >
                        <img
                          src={url}
                          alt={ROOM_LABELS[idx] ?? `Image ${idx + 1}`}
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
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {ROOM_LABELS[idx] ?? `Image ${idx + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              {uploadedImages.length < 4 && (
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
                        : `Upload next: ${ROOM_LABELS[uploadedImages.length] ?? "Image"} (${4 - uploadedImages.length} remaining)`}
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
            
            const itemsPerPage = 2;
            const totalPages = Math.ceil(imgs.length / itemsPerPage);
            const currentImages = imgs.slice(galleryPage * itemsPerPage, (galleryPage + 1) * itemsPerPage);

            return (
              <div className="flex flex-col gap-2">
                <div
                  className="grid gap-2 rounded-xl overflow-hidden"
                  style={{
                    gridTemplateColumns: currentImages.length === 2 ? "1fr 1fr" : "1fr",
                    height: "450px",
                  }}
                >
                  {currentImages.map((imgUrl, idx) => {
                    const globalIdx = galleryPage * itemsPerPage + idx;
                    const roomLabel = ROOM_LABELS[globalIdx] ?? `Image ${globalIdx + 1}`;
                    return (
                      <div
                        key={idx}
                        className="relative overflow-hidden rounded-lg bg-muted/40 flex items-center justify-center"
                      >
                        <img
                          src={imgUrl}
                          alt={roomLabel}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://placehold.co/600x400?text=Image+Not+Found";
                          }}
                        />
                        {/* Room label overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                          <span className="text-white text-sm font-semibold drop-shadow-md">
                            {roomLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setGalleryPage((p) => Math.max(0, p - 1))}
                      disabled={galleryPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium text-muted-foreground">
                      {galleryPage + 1} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setGalleryPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={galleryPage === totalPages - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {landlordProps.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>No properties found.</p>
        </div>
      ) : (
        <DataCardGrid
          rows={filteredProps}
          pageSize={7}
          toolbar={
            <div className="flex items-center gap-2">
              <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="Apartment">Apartment</SelectItem>
                  <SelectItem value="Villa">Villa</SelectItem>
                  <SelectItem value="House">House</SelectItem>
                  <SelectItem value="1 BHK">1 BHK</SelectItem>
                  <SelectItem value="2 BHK">2 BHK</SelectItem>
                  <SelectItem value="3 BHK">3 BHK</SelectItem>
                  <SelectItem value="Loft">Loft</SelectItem>
                  <SelectItem value="Condo">Condo</SelectItem>
                  <SelectItem value="Townhouse">Townhouse</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="w-[170px] h-9">
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Prices</SelectItem>
                  <SelectItem value="Under ₹10,000">Under ₹10,000</SelectItem>
                  <SelectItem value="₹10,000 - ₹20,000">₹10,000 - ₹20,000</SelectItem>
                  <SelectItem value="₹20,000 - ₹50,000">₹20,000 - ₹50,000</SelectItem>
                  <SelectItem value="₹50,000 - ₹1,00,000">₹50,000 - ₹1,00,000</SelectItem>
                  <SelectItem value="Over ₹1,00,000">Over ₹1,00,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
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
              label: "Property ID",
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
              key: "listing_date",
              label: "Listing Date",
              render: (p) => {
                const dateVal = p.listing_date || p.Listing_date || "2024-01-15T10:00:00Z";
                return (
                  <span className="text-foreground">
                    {dateVal ? new Date(dateVal).toLocaleDateString() : "—"}
                  </span>
                );
              },
            },
            {
              key: "Description",
              label: "Description",
            },
            {
              key: "Category",
              label: "Category",
              render: (p) => (
                p.Category ? (
                  <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    {p.Category}
                  </span>
                ) : <span className="text-muted-foreground">—</span>
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
                    setGalleryPage(0);
                  }}
                  className="group/pic relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg border-2 border-violet-500/60 bg-gradient-to-r from-violet-500/15 via-fuchsia-500/10 to-amber-500/15 px-3 py-1 text-[11px] font-semibold text-violet-700 shadow-sm transition-all duration-300 hover:border-violet-500 hover:from-violet-500/25 hover:via-fuchsia-500/20 hover:to-amber-500/25 hover:shadow-md hover:shadow-violet-500/20 dark:border-violet-400/50 dark:text-violet-300 dark:hover:border-violet-400 dark:hover:shadow-violet-400/20"
                >
                  {/* Shimmer sweep effect */}
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover/pic:translate-x-full dark:via-white/10" />
                  <Image className="relative h-3.5 w-3.5 transition-transform duration-300 group-hover/pic:scale-110" />
                  <span className="relative">View Pictures</span>
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
                onClick={() => handleDeleteProperty(p)}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
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
                <option value="Under Maintenance">Under Maintenance</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={editForm.Description}
                onChange={(e) => setEditForm({ ...editForm, Description: e.target.value })}
                placeholder="E.g., Great location, newly renovated..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Category</Label>
              <select
                className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                value={editForm.Category}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    Category: e.target.value,
                  })
                }
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>



            <div className="grid gap-2">
              <Label>Pictures (Up to 4)</Label>
              {editImages.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                  {editImages.map((url, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div
                        className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border"
                      >
                        <img
                          src={url}
                          alt={ROOM_LABELS[idx] ?? `Image ${idx + 1}`}
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
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {ROOM_LABELS[idx] ?? `Image ${idx + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {editImages.length < 4 && (
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
                        : `Upload next: ${ROOM_LABELS[editImages.length] ?? "Image"} (${4 - editImages.length} remaining)`}
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

      {/* View Amenities Dialog */}
      <Dialog
        open={!!selectedPropertyForAmenities}
        onOpenChange={(open) => !open && setSelectedPropertyForAmenities(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedPropertyForAmenities?.property_name} - Amenities
            </DialogTitle>
            <DialogDescription>
              Available amenities for this property.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedPropertyForAmenities?.amenities ? (
              <ul className="grid gap-2">
                {selectedPropertyForAmenities.amenities.split(',').map((item, i) => (
                  <li key={i} className="flex items-center gap-2 bg-muted/50 p-2 rounded-md text-sm border border-border">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span>{item.trim()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-muted-foreground p-8 bg-muted/30 rounded-lg">
                <p>No amenities listed for this property.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setSelectedPropertyForAmenities(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
