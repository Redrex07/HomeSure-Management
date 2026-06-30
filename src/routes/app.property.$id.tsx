import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getPropertyById, updateProperty } from "@/core/db/supabase-queries";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { Button } from "@/shared/components/ui/button";
import { ChevronLeft, Pencil } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/shared/components/ui/accordion";
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
import { UnifiedProperty } from "./app.properties";

export const Route = createFileRoute("/app/property/$id")({
  component: PropertyDetailsPage,
});

const ROOM_LABELS = ["Hall View", "Front View", "Bed View", "Kitchen View"] as const;

function PropertyDetailsPage() {
  const { id } = Route.useParams();
  const [property, setProperty] = useState<UnifiedProperty | null>(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [isUpdating, setIsUpdating] = useState(false);

  const openEditDialog = () => {
    let loc = {};
    try {
      if (property?.address) loc = JSON.parse(property.address);
    } catch {
      loc = { street_address: property?.address };
    }
    setEditForm({
      property_name: property?.property_name || "",
      property_type: property?.property_type || "",
      availability_status: property?.availability_status || "Available",
      Category: property?.Category || "",
      Description: property?.Description || "",
      ...loc
    });
    setIsEditing(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    setIsUpdating(true);
    
    const locationObj = {
      house_number: editForm.house_number || "",
      building_name: editForm.building_name || "",
      street_address: editForm.street_address || "",
      locality: editForm.locality || "",
      landmark: editForm.landmark || "",
      city: editForm.city || "",
      state: editForm.state || "",
      country: editForm.country || "",
      pin_code: editForm.pin_code || "",
      map_location: editForm.map_location || ""
    };
    
    const payload = {
      property_name: editForm.property_name,
      property_type: editForm.property_type,
      availability_status: editForm.availability_status,
      Category: editForm.Category,
      Description: editForm.Description,
      address: JSON.stringify(locationObj)
    };
    
    await updateProperty(property.property_id, payload);
    
    // Refresh
    const data = await getPropertyById(id);
    setProperty(data as UnifiedProperty);
    
    setIsEditing(false);
    setIsUpdating(false);
  };

  useEffect(() => {
    async function fetchProperty() {
      setLoading(true);
      const data = await getPropertyById(id);
      setProperty(data as UnifiedProperty);
      setLoading(false);
    }
    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Loading property details...
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Property not found.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/app/properties">Back to Properties</Link>
        </Button>
      </div>
    );
  }

  const parsedImages = (() => {
    try {
      if (!property.image_url) return [];
      const parsed = JSON.parse(property.image_url);
      return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      return property.image_url ? [property.image_url] : [];
    }
  })();

  const parsedLocation = (() => {
    try {
      return property.address ? JSON.parse(property.address) : null;
    } catch (e) {
      return { street_address: property.address };
    }
  })();

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {/* Hero Banner Section */}
      <div className="relative w-full h-[45vh] rounded-2xl overflow-hidden bg-muted/30 shadow-md">
        {parsedImages.length > 0 ? (
          <>
            <img
              src={parsedImages[0]}
              alt="Blurred Background"
              className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-50"
            />
            <img
              src={parsedImages[0]}
              alt="Front View"
              className="relative z-0 w-full h-full object-contain"
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted">
            <span className="text-lg">No pictures uploaded</span>
          </div>
        )}

        {/* Dark Gradient Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 pointer-events-none" />

        {/* Back & Edit Buttons */}
        <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
          <Button variant="outline" size="sm" asChild className="bg-background/20 text-white border-white/30 hover:bg-background/40 hover:text-white backdrop-blur-md">
            <Link to="/app/properties">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Properties
            </Link>
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={openEditDialog}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-none shadow-md backdrop-blur-md transition-all duration-300 group"
          >
            <Pencil className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" /> Edit Details
          </Button>
        </div>

        {/* Property Title Overlay */}
        <div className="absolute bottom-8 left-6 md:left-10 z-10 text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-sm font-medium mb-3">
            <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
            {property.availability_status || "Available"}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2 drop-shadow-lg max-w-4xl">
            {property.property_name}
          </h1>
          <p className="text-sm sm:text-base opacity-90 drop-shadow-md flex items-center gap-3">
            <span>#{property.property_id}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
            <span>{property.property_type || "Property"}</span>
            {property.Category && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                <span>{property.Category}</span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-8 mt-8">

        {/* Edit Property Dialog */}
        <Dialog open={isEditing} onOpenChange={(open) => !open && !isUpdating && setIsEditing(false)}>
          <DialogContent className="w-full sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Property Details</DialogTitle>
              <DialogDescription>Update the basic and location details.</DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleUpdate} className="grid gap-4 py-4">
              <h3 className="font-semibold border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2 col-span-2">
                  <Label>Property Name</Label>
                  <Input value={editForm.property_name || ""} onChange={(e) => setEditForm({...editForm, property_name: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label>Property Type</Label>
                  <Input value={editForm.property_type || ""} onChange={(e) => setEditForm({...editForm, property_type: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <select
                    className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                    value={editForm.Category || ""}
                    onChange={(e) => setEditForm({ ...editForm, Category: e.target.value })}
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
                <div className="grid gap-2 col-span-2">
                  <Label>Status</Label>
                  <select
                    className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                    value={editForm.availability_status || "Available"}
                    onChange={(e) => setEditForm({ ...editForm, availability_status: e.target.value })}
                  >
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                  </select>
                </div>
                <div className="grid gap-2 col-span-2">
                  <Label>Description</Label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={editForm.Description || ""}
                    onChange={(e) => setEditForm({ ...editForm, Description: e.target.value })}
                  />
                </div>
              </div>
              
              <h3 className="font-semibold border-b pb-2 mt-4">Location Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>House/Flat Number</Label>
                  <Input value={editForm.house_number || ""} onChange={(e) => setEditForm({...editForm, house_number: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>Building Name</Label>
                  <Input value={editForm.building_name || ""} onChange={(e) => setEditForm({...editForm, building_name: e.target.value})} />
                </div>
                <div className="grid gap-2 col-span-2">
                  <Label>Street Address</Label>
                  <Input value={editForm.street_address || ""} onChange={(e) => setEditForm({...editForm, street_address: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>Area/Locality</Label>
                  <Input value={editForm.locality || ""} onChange={(e) => setEditForm({...editForm, locality: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>Landmark</Label>
                  <Input value={editForm.landmark || ""} onChange={(e) => setEditForm({...editForm, landmark: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>City</Label>
                  <Input value={editForm.city || ""} onChange={(e) => setEditForm({...editForm, city: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>State</Label>
                  <Input value={editForm.state || ""} onChange={(e) => setEditForm({...editForm, state: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>Country</Label>
                  <Input value={editForm.country || ""} onChange={(e) => setEditForm({...editForm, country: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>PIN Code</Label>
                  <Input value={editForm.pin_code || ""} onChange={(e) => setEditForm({...editForm, pin_code: e.target.value})} />
                </div>
                <div className="grid gap-2 col-span-2">
                  <Label>Google Map Location (Lat, Lng)</Label>
                  <Input value={editForm.map_location || ""} onChange={(e) => setEditForm({...editForm, map_location: e.target.value})} />
                </div>
              </div>
              
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button type="submit" disabled={isUpdating}>{isUpdating ? "Saving..." : "Save Changes"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Video Tour Section */}
        {property.Virtual_Tour && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Virtual Tour</h2>
            <div className="rounded-xl overflow-hidden border border-border bg-black aspect-video max-w-3xl">
              <video
                src={property.Virtual_Tour}
                controls
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}

        {/* Details Accordions */}
        <div className="space-y-4">
          <Accordion type="multiple" className="w-full space-y-4">
            
            {/* Basic Info Accordion */}
            <AccordionItem value="basic" className="border rounded-xl px-6 bg-card shadow-sm">
              <AccordionTrigger className="hover:no-underline font-semibold text-lg py-5">
                Basic Information
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm pb-6 pt-2">
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Type</span>
                    <span className="font-medium text-base">{property.property_type || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Status</span>
                    <span className="font-medium text-base">{property.availability_status || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Category</span>
                    <span className="font-medium text-base">{property.Category || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Listing Date</span>
                    <span className="font-medium text-base">
                      {property.Listing_date || property.listing_date 
                        ? new Date(property.Listing_date || property.listing_date!).toLocaleDateString() 
                        : "—"}
                    </span>
                  </div>
                  <div className="sm:col-span-2 md:col-span-3">
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Description</span>
                    <span className="font-medium text-base">{property.Description || "—"}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Location Details Accordion */}
            <AccordionItem value="location" className="border rounded-xl px-6 bg-card shadow-sm">
              <AccordionTrigger className="hover:no-underline font-semibold text-lg py-5">
                Location Details
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm pb-6 pt-2">
                  {parsedLocation ? (
                    <>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">House/Flat Number</span>
                        <span className="font-medium text-base">{parsedLocation.house_number || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Building Name</span>
                        <span className="font-medium text-base">{parsedLocation.building_name || "—"}</span>
                      </div>
                      <div className="sm:col-span-2 md:col-span-3">
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Street Address</span>
                        <span className="font-medium text-base">{parsedLocation.street_address || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Area/Locality</span>
                        <span className="font-medium text-base">{parsedLocation.locality || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Landmark</span>
                        <span className="font-medium text-base">{parsedLocation.landmark || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">City</span>
                        <span className="font-medium text-base">{parsedLocation.city || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">State</span>
                        <span className="font-medium text-base">{parsedLocation.state || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Country</span>
                        <span className="font-medium text-base">{parsedLocation.country || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">PIN Code</span>
                        <span className="font-medium text-base">{parsedLocation.pin_code || "—"}</span>
                      </div>
                      <div className="sm:col-span-2 md:col-span-3">
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Google Map Location</span>
                        <span className="font-medium text-base">{parsedLocation.map_location || "—"}</span>
                      </div>
                    </>
                  ) : (
                    <div className="sm:col-span-2 md:col-span-3">
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Address</span>
                      <span className="font-medium text-base">{property.address || "—"}</span>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      </div>
    </div>
  );
}
