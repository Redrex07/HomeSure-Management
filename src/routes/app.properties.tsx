import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { DataCardGrid } from "@/shared/components/common/DataCardGrid";
import { Card } from "@/shared/components/ui/card";
import { Plus, Download, Trash2, ImagePlus, X, Pencil, Image, ChevronLeft, ChevronRight, ListChecks, Video, CheckCircle, Search, Home } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/shared/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/shared/components/ui/accordion";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { toast } from "sonner";
import { formatINR } from "@/shared/utils/utils";

export const Route = createFileRoute("/app/properties")({
  head: () => ({ meta: [{ title: "Properties — HomeSure" }] }),
  component: PropertiesPage,
});

/** Fixed room labels mapped by upload order (index 0–3) */
const ROOM_LABELS = ["Front View", "Living Room", "Bedroom", "Kitchen"] as const;

export type UnifiedProperty = LocalProperty & { isLocal?: boolean };

const parseImageUrls = (urlData: any): string[] => {
  if (!urlData) return [];
  if (Array.isArray(urlData)) return urlData;
  try {
    const parsed = JSON.parse(urlData);
    if (Array.isArray(parsed)) return parsed;
    return [urlData];
  } catch {
    return [urlData];
  }
};

function PropertiesPage() {
  const localProps = useProperties();
  const navigate = useNavigate();
  const [supabaseProps, setSupabaseProps] = useState<UnifiedProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSupabaseProperties = async () => {
    setIsLoading(true);
    try {
      const landlordId = "2"; // Force "2" to match Supabase mock data
      const data = await getLandlordProperties(landlordId);
      setSupabaseProps(data as UnifiedProperty[]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSupabaseProperties();
  }, []);

  const landlordProps: UnifiedProperty[] = [
    ...supabaseProps
  ];
  
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 9;

  const filteredProps = landlordProps.filter((p) => {
    let matchesType = true;
    let matchesStatus = true;
    let matchesSearch = true;

    if (propertyTypeFilter !== "All") {
      matchesType = p.property_type.toLowerCase().includes(propertyTypeFilter.toLowerCase());
    }

    if (statusFilter !== "All") {
      matchesStatus = p.availability_status === statusFilter;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const locStr = p.address ? String(p.address).toLowerCase() : "";
      matchesSearch = (p.property_name?.toLowerCase().includes(q) || String(p.property_id).includes(q) || locStr.includes(q));
    }

    return matchesType && matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredProps.length / pageSize);
  const paginatedProps = filteredProps.slice(page * pageSize, (page + 1) * pageSize);

  const [isAdding, setIsAdding] = useState(false);
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPropertyForImage, setSelectedPropertyForImage] =
    useState<UnifiedProperty | null>(null);
  const [selectedPropertyForVideo, setSelectedPropertyForVideo] =
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
    listing_date: "",
    Description: "",
    Category: "Residential",
    security_deposit: "",
    maintenance_charges: "",
    electricity_charges: "",
    water_charges: "",
    parking_charges: "",
    advance_payment: "",
    available_from: "",
    lease_duration: "",
    wifi: false,
    power_backup: false,
    parking: false,
    lift: false,
    gym: false,
    swimming_pool: false,
    cctv: false,
    security: false,
    garden: false,
    childrens_play_area: false,
    furnished: false,
    semi_furnished: false,
    air_conditioning: false,
    preferred_tenant_type: "",
    bachelors_allowed: false,
    family_allowed: false,
    students_allowed: false,
    pets_allowed: false,
    smoking_allowed: false,
    drinking_allowed: false,
    maximum_occupants: "",
  });
  const [editImages, setEditImages] = useState<string[]>([]);
  const [isEditUploading, setIsEditUploading] = useState(false);

  // Video Upload States
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const [editVideo, setEditVideo] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

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
    house_number: "",
    building_name: "",
    street_address: "",
    locality: "",
    landmark: "",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    pin_code: "",
    map_location: "",
    bedrooms: "",
    bathrooms: "",
    balconies: "",
    kitchen: "",
    hall: "",
    dining_room: "",
    study_room: "",
    floor_number: "",
    total_floors: "",
    built_up_area: "",
    carpet_area: "",
    plot_area: "",
    property_age: "",
    facing_direction: "",
    security_deposit: "",
    maintenance_charges: "",
    electricity_charges: "",
    water_charges: "",
    parking_charges: "",
    advance_payment: "",
    available_from: "",
    lease_duration: "",
    wifi: false,
    power_backup: false,
    parking: false,
    lift: false,
    gym: false,
    swimming_pool: false,
    cctv: false,
    security: false,
    garden: false,
    childrens_play_area: false,
    furnished: false,
    semi_furnished: false,
    air_conditioning: false,
    preferred_tenant_type: "",
    bachelors_allowed: false,
    family_allowed: false,
    students_allowed: false,
    pets_allowed: false,
    smoking_allowed: false,
    drinking_allowed: false,
    maximum_occupants: "",
  });

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent premature saving if they press "Enter" on an earlier step
    if (step < 7) {
      setStep(step + 1);
      return;
    }

    if (!form.property_name || !form.property_type) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const location_details = {
        house_number: form.house_number,
        building_name: form.building_name,
        street_address: form.street_address,
        locality: form.locality,
        landmark: form.landmark,
        city: form.city,
        state: form.state,
        country: form.country,
        pin_code: form.pin_code,
        map_location: form.map_location,
      };

      const specifications = {
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        balconies: form.balconies,
        kitchen: form.kitchen,
        hall: form.hall,
        dining_room: form.dining_room,
        study_room: form.study_room,
        floor_number: form.floor_number,
        total_floors: form.total_floors,
        built_up_area: form.built_up_area,
        carpet_area: form.carpet_area,
        plot_area: form.plot_area,
        property_age: form.property_age,
        facing_direction: form.facing_direction,
        rent_details: {
          security_deposit: form.security_deposit,
          maintenance_charges: form.maintenance_charges,
          electricity_charges: form.electricity_charges,
          water_charges: form.water_charges,
          parking_charges: form.parking_charges,
          advance_payment: form.advance_payment,
          available_from: form.available_from,
          lease_duration: form.lease_duration,
        }
      };

      const payload: any = {
        landlord_id: "2", // Force "2" to match Supabase mock data
        property_name: form.property_name,
        property_type: form.property_type,
        availability_status: form.availability_status,
        image_url: uploadedImages.length > 0 ? JSON.stringify(uploadedImages) : undefined,
        Listing_date: new Date().toISOString(),
        Description: form.Description,
        Category: form.Category,
        address: JSON.stringify(location_details),
        specifications: JSON.stringify(specifications),
        amenities: {
          wifi: form.wifi,
          power_backup: form.power_backup,
          parking: form.parking,
          lift: form.lift,
          gym: form.gym,
          swimming_pool: form.swimming_pool,
          cctv: form.cctv,
          security: form.security,
          garden: form.garden,
          childrens_play_area: form.childrens_play_area,
          furnished: form.furnished,
          semi_furnished: form.semi_furnished,
          air_conditioning: form.air_conditioning
        }
      };
      if (uploadedVideo) {
        payload.Virtual_Tour = uploadedVideo;
      }
      await createProperty(payload);
      toast("Property added successfully!", {
        icon: <CheckCircle className="h-5 w-5 text-emerald-500 animate-in zoom-in duration-500" />,
        description: "Check your properties list to see it.",
        className: "bg-emerald-50 border-emerald-200 text-emerald-950 px-6 py-4 shadow-lg scale-110",
        position: "top-center",
      });
      fetchSupabaseProperties();
      window.dispatchEvent(new Event("supabase-properties-updated"));
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to add property: ${error?.message || JSON.stringify(error)}`);
      return;
    }

    setForm({
      property_name: "",
      property_type: "",
      address: "",
      rent_amount: "",
      availability_status: "Available",
      amenities: "",
      listing_date: "",
      Description: "",
      Category: "Residential",
      house_number: "",
      building_name: "",
      street_address: "",
      locality: "",
      landmark: "",
      city: "Chennai",
      state: "Tamil Nadu",
      country: "India",
      pin_code: "",
      map_location: "",
      bedrooms: "",
      bathrooms: "",
      balconies: "",
      kitchen: "",
      hall: "",
      dining_room: "",
      study_room: "",
      floor_number: "",
      total_floors: "",
      built_up_area: "",
      carpet_area: "",
      plot_area: "",
      property_age: "",
      facing_direction: "",
      security_deposit: "",
      maintenance_charges: "",
      electricity_charges: "",
      water_charges: "",
      parking_charges: "",
      advance_payment: "",
      available_from: "",
      lease_duration: "",
      wifi: false,
      power_backup: false,
      parking: false,
      lift: false,
      gym: false,
      swimming_pool: false,
      cctv: false,
      security: false,
      garden: false,
      childrens_play_area: false,
      furnished: false,
      semi_furnished: false,
      air_conditioning: false,
      preferred_tenant_type: "",
      bachelors_allowed: false,
      family_allowed: false,
      students_allowed: false,
      pets_allowed: false,
      smoking_allowed: false,
      drinking_allowed: false,
      maximum_occupants: "",
    });
    setStep(1);
    setUploadedImages([]);
    setUploadedVideo(null);
    setIsAdding(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Video must be less than 10MB");
      e.target.value = "";
      return;
    }

    setIsUploadingVideo(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      const { error } = await supabase.storage
        .from('property-images')
        .upload(`properties/${fileName}`, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(`properties/${fileName}`);

      if (isEdit) {
        setEditVideo(publicUrlData.publicUrl);
      } else {
        setUploadedVideo(publicUrlData.publicUrl);
      }
      toast.success("Video uploaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload video.");
    } finally {
      setIsUploadingVideo(false);
      e.target.value = "";
    }
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
      security_deposit: "",
      maintenance_charges: "",
      electricity_charges: "",
      water_charges: "",
      parking_charges: "",
      advance_payment: "",
      available_from: "",
      lease_duration: "",
      wifi: false,
      power_backup: false,
      parking: false,
      lift: false,
      gym: false,
      swimming_pool: false,
      cctv: false,
      security: false,
      garden: false,
      childrens_play_area: false,
      furnished: false,
      semi_furnished: false,
      air_conditioning: false,
      preferred_tenant_type: (p as any).tenantPreferencesData?.preferred_tenant_type || "",
      bachelors_allowed: (p as any).tenantPreferencesData?.bachelors_allowed || false,
      family_allowed: (p as any).tenantPreferencesData?.family_allowed || false,
      students_allowed: (p as any).tenantPreferencesData?.students_allowed || false,
      pets_allowed: (p as any).tenantPreferencesData?.pets_allowed || false,
      smoking_allowed: (p as any).tenantPreferencesData?.smoking_allowed || false,
      drinking_allowed: (p as any).tenantPreferencesData?.drinking_allowed || false,
      maximum_occupants: (p as any).tenantPreferencesData?.maximum_occupants ? String((p as any).tenantPreferencesData?.maximum_occupants) : "",
    });
    setEditImages(parseImageUrls(p.image_url));
    setEditVideo(p.Virtual_Tour || null);
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
      const localPayload: any = {
        property_name: editForm.property_name,
        property_type: editForm.property_type,
        availability_status: editForm.availability_status,
        image_url: editImages.length > 0 ? JSON.stringify(editImages) : null,
        Description: editForm.Description,
        Category: editForm.Category,
        Virtual_Tour: editVideo || null,
      };
      updateLocalProperty(editingProperty.property_id, localPayload);
      toast.success("Property updated successfully!");
      setEditingProperty(null);
    } else {
      try {
        const supabasePayload: any = {
          property_name: editForm.property_name,
          property_type: editForm.property_type,
          availability_status: editForm.availability_status,
          image_url: editImages.length > 0 ? JSON.stringify(editImages) : null,
          Description: editForm.Description,
          Category: editForm.Category,
          Virtual_Tour: editVideo || null,
        };
        await updateSupabaseProperty(editingProperty.property_id, supabasePayload);
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

      {/* Add Property Sheet */}
      <Sheet open={isAdding} onOpenChange={(open) => {
        setIsAdding(open);
        if(!open) setStep(1);
      }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {step === 1 ? "Step 1 of 6: Basic Property Information" : step === 2 ? "Step 2 of 6: Location Details" : step === 3 ? "Step 3 of 6: Images & Media" : step === 4 ? "Step 4 of 6: Property Specifications" : step === 5 ? "Step 5 of 6: Rent Details" : "Step 6 of 6: Amenities"}
            </SheetTitle>
            <SheetDescription className="sr-only">Fill out this form to add a new property.</SheetDescription>
          </SheetHeader>

          <form onSubmit={(e) => e.preventDefault()} className="grid gap-4 py-4">
            {step === 1 ? (
              <>
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

              </>
            ) : step === 2 ? (
              <>
                <div className="grid gap-2">
                  <Label>House/Flat Number</Label>
                  <Input placeholder="A-302" value={form.house_number} onChange={(e) => setForm({ ...form, house_number: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Building Name</Label>
                  <Input placeholder="Green Residency" value={form.building_name} onChange={(e) => setForm({ ...form, building_name: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Street Address</Label>
                  <Input placeholder="MG Road" value={form.street_address} onChange={(e) => setForm({ ...form, street_address: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Area/Locality</Label>
                  <Input placeholder="Anna Nagar" value={form.locality} onChange={(e) => setForm({ ...form, locality: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Landmark (Optional)</Label>
                  <Input placeholder="Near Bus Stand" value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>City</Label>
                  <Input placeholder="Chennai" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>State</Label>
                  <Input placeholder="Tamil Nadu" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Country</Label>
                  <Input placeholder="India" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>PIN Code</Label>
                  <Input placeholder="600040" value={form.pin_code} onChange={(e) => setForm({ ...form, pin_code: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Google Map Location (Latitude & Longitude) (Optional)</Label>
                  <Input placeholder="13.0827, 80.2707" value={form.map_location} onChange={(e) => setForm({ ...form, map_location: e.target.value })} />
                </div>
              </>
            ) : step === 3 ? (
              <>
                <div className="grid gap-2">
                  <Label>Virtual Tour Video (Optional, Max 10MB)</Label>
                  {uploadedVideo ? (
                    <div className="flex items-center gap-4">
                      <video src={uploadedVideo} className="h-20 w-32 object-cover rounded-md bg-black" />
                      <Button type="button" variant="outline" size="sm" onClick={() => setUploadedVideo(null)}>
                        Remove Video
                      </Button>
                    </div>
                  ) : (
                    <Input
                      type="file"
                      accept="video/mp4,video/x-m4v,video/*"
                      onChange={(e) => handleVideoUpload(e, false)}
                      disabled={isUploadingVideo}
                      className="cursor-pointer"
                    />
                  )}
                  {isUploadingVideo && <p className="text-xs text-muted-foreground animate-pulse">Uploading video...</p>}
                </div>

                <div className="grid gap-2 mt-4">
                  <Label>Pictures (Up to 4)</Label>
                  <p className="text-xs text-muted-foreground mb-2">Please upload images in order: 1. Front View, 2. Living Room, 3. Bedroom, 4. Kitchen</p>

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
                    <div className="relative mt-2">
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
              </>
            ) : step === 4 ? (
                <>
                  <div className="grid gap-2">
                    <Label>Bedrooms</Label>
                    <Input type="number" placeholder="e.g. 2" value={form.bedrooms} onChange={(e) => setForm({...form, bedrooms: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Bathrooms</Label>
                    <Input type="number" placeholder="e.g. 2" value={form.bathrooms} onChange={(e) => setForm({...form, bathrooms: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Balconies</Label>
                    <Input type="number" placeholder="e.g. 1" value={form.balconies} onChange={(e) => setForm({...form, balconies: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Kitchen</Label>
                    <Input placeholder="e.g. Modular" value={form.kitchen} onChange={(e) => setForm({...form, kitchen: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Hall</Label>
                    <Input placeholder="e.g. 1" value={form.hall} onChange={(e) => setForm({...form, hall: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Dining Room</Label>
                    <Input placeholder="e.g. Yes/No" value={form.dining_room} onChange={(e) => setForm({...form, dining_room: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Study Room</Label>
                    <Input placeholder="e.g. Yes/No" value={form.study_room} onChange={(e) => setForm({...form, study_room: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Floor Number</Label>
                    <Input type="number" placeholder="e.g. 2" value={form.floor_number} onChange={(e) => setForm({...form, floor_number: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Total Floors</Label>
                    <Input type="number" placeholder="e.g. 5" value={form.total_floors} onChange={(e) => setForm({...form, total_floors: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Built-up Area (sq.ft)</Label>
                    <Input type="number" placeholder="e.g. 1200" value={form.built_up_area} onChange={(e) => setForm({...form, built_up_area: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Carpet Area (sq.ft)</Label>
                    <Input type="number" placeholder="e.g. 1000" value={form.carpet_area} onChange={(e) => setForm({...form, carpet_area: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Plot Area (sq.ft)</Label>
                    <Input type="number" placeholder="e.g. 1500" value={form.plot_area} onChange={(e) => setForm({...form, plot_area: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Property Age</Label>
                    <Input placeholder="e.g. 5 Years" value={form.property_age} onChange={(e) => setForm({...form, property_age: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Facing Direction</Label>
                    <Input placeholder="e.g. East" value={form.facing_direction} onChange={(e) => setForm({...form, facing_direction: e.target.value})} />
                  </div>
                </>
              ) : step === 5 ? (
                <>
                  <div className="grid gap-2">
                    <Label>Monthly Rent</Label>
                    <Input placeholder="e.g. ₹18,000" value={form.rent_amount} onChange={(e) => setForm({...form, rent_amount: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Security Deposit</Label>
                    <Input placeholder="e.g. ₹50,000" value={form.security_deposit} onChange={(e) => setForm({...form, security_deposit: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Maintenance Charges</Label>
                    <Input placeholder="e.g. ₹2,000" value={form.maintenance_charges} onChange={(e) => setForm({...form, maintenance_charges: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Electricity Charges</Label>
                    <Input placeholder="e.g. Included/Separate" value={form.electricity_charges} onChange={(e) => setForm({...form, electricity_charges: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Water Charges</Label>
                    <Input placeholder="e.g. Included" value={form.water_charges} onChange={(e) => setForm({...form, water_charges: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Parking Charges</Label>
                    <Input placeholder="e.g. ₹500" value={form.parking_charges} onChange={(e) => setForm({...form, parking_charges: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Advance Payment</Label>
                    <Input placeholder="e.g. 2 Months" value={form.advance_payment} onChange={(e) => setForm({...form, advance_payment: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Available From</Label>
                    <Input placeholder="e.g. 1-Aug-26" type="date" value={form.available_from} onChange={(e) => setForm({...form, available_from: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Lease Duration</Label>
                    <Input placeholder="e.g. 11 Months" value={form.lease_duration} onChange={(e) => setForm({...form, lease_duration: e.target.value})} />
                  </div>
                </>
              ) : step === 6 ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="wifi" checked={form.wifi} onCheckedChange={(checked) => setForm({...form, wifi: checked === true})} />
                      <Label htmlFor="wifi" className="cursor-pointer">Wi-Fi</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="power_backup" checked={form.power_backup} onCheckedChange={(checked) => setForm({...form, power_backup: checked === true})} />
                      <Label htmlFor="power_backup" className="cursor-pointer">Power Backup</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="parking" checked={form.parking} onCheckedChange={(checked) => setForm({...form, parking: checked === true})} />
                      <Label htmlFor="parking" className="cursor-pointer">Parking</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="lift" checked={form.lift} onCheckedChange={(checked) => setForm({...form, lift: checked === true})} />
                      <Label htmlFor="lift" className="cursor-pointer">Lift</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="gym" checked={form.gym} onCheckedChange={(checked) => setForm({...form, gym: checked === true})} />
                      <Label htmlFor="gym" className="cursor-pointer">Gym/Fitness Center</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="swimming_pool" checked={form.swimming_pool} onCheckedChange={(checked) => setForm({...form, swimming_pool: checked === true})} />
                      <Label htmlFor="swimming_pool" className="cursor-pointer">Swimming Pool</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="cctv" checked={form.cctv} onCheckedChange={(checked) => setForm({...form, cctv: checked === true})} />
                      <Label htmlFor="cctv" className="cursor-pointer">CCTV Surveillance</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="security" checked={form.security} onCheckedChange={(checked) => setForm({...form, security: checked === true})} />
                      <Label htmlFor="security" className="cursor-pointer">Security Guard</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="garden" checked={form.garden} onCheckedChange={(checked) => setForm({...form, garden: checked === true})} />
                      <Label htmlFor="garden" className="cursor-pointer">Garden</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="childrens_play_area" checked={form.childrens_play_area} onCheckedChange={(checked) => setForm({...form, childrens_play_area: checked === true})} />
                      <Label htmlFor="childrens_play_area" className="cursor-pointer">Children's Play Area</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="furnished" checked={form.furnished} onCheckedChange={(checked) => setForm({...form, furnished: checked === true})} />
                      <Label htmlFor="furnished" className="cursor-pointer">Furnished</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="semi_furnished" checked={form.semi_furnished} onCheckedChange={(checked) => setForm({...form, semi_furnished: checked === true})} />
                      <Label htmlFor="semi_furnished" className="cursor-pointer">Semi-Furnished</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="air_conditioning" checked={form.air_conditioning} onCheckedChange={(checked) => setForm({...form, air_conditioning: checked === true})} />
                      <Label htmlFor="air_conditioning" className="cursor-pointer">Air Conditioning</Label>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 grid gap-2">
                      <Label>Preferred Tenant Type</Label>
                      <Input placeholder="e.g. Family" value={form.preferred_tenant_type} onChange={(e) => setForm({...form, preferred_tenant_type: e.target.value})} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="bachelors_allowed" checked={form.bachelors_allowed} onCheckedChange={(checked) => setForm({...form, bachelors_allowed: checked === true})} />
                      <Label htmlFor="bachelors_allowed" className="cursor-pointer">Bachelors Allowed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="family_allowed" checked={form.family_allowed} onCheckedChange={(checked) => setForm({...form, family_allowed: checked === true})} />
                      <Label htmlFor="family_allowed" className="cursor-pointer">Family Allowed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="students_allowed" checked={form.students_allowed} onCheckedChange={(checked) => setForm({...form, students_allowed: checked === true})} />
                      <Label htmlFor="students_allowed" className="cursor-pointer">Students Allowed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="pets_allowed" checked={form.pets_allowed} onCheckedChange={(checked) => setForm({...form, pets_allowed: checked === true})} />
                      <Label htmlFor="pets_allowed" className="cursor-pointer">Pets Allowed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="smoking_allowed" checked={form.smoking_allowed} onCheckedChange={(checked) => setForm({...form, smoking_allowed: checked === true})} />
                      <Label htmlFor="smoking_allowed" className="cursor-pointer">Smoking Allowed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="drinking_allowed" checked={form.drinking_allowed} onCheckedChange={(checked) => setForm({...form, drinking_allowed: checked === true})} />
                      <Label htmlFor="drinking_allowed" className="cursor-pointer">Drinking Allowed</Label>
                    </div>
                    <div className="col-span-2 grid gap-2">
                      <Label>Maximum Occupants</Label>
                      <Input type="number" placeholder="e.g. 4" value={form.maximum_occupants} onChange={(e) => setForm({...form, maximum_occupants: e.target.value})} />
                    </div>
                  </div>
                </>
              )}

            <SheetFooter className="mt-4 pb-12">
              {step === 1 ? (
                <>
                  <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={() => setStep(2)}>Next</Button>
                </>
              ) : step === 2 ? (
                <>
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="button" onClick={() => setStep(3)}>Next</Button>
                </>
              ) : step === 3 ? (
                <>
                  <Button type="button" variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button type="button" onClick={() => setStep(4)}>Next</Button>
                </>
              ) : step === 4 ? (
                <>
                  <Button type="button" variant="outline" onClick={() => setStep(3)}>
                    Back
                  </Button>
                  <Button type="button" onClick={() => setStep(5)}>Next</Button>
                </>
              ) : step === 5 ? (
                <>
                  <Button type="button" variant="outline" onClick={() => setStep(4)}>
                    Back
                  </Button>
                  <Button type="button" onClick={() => setStep(6)}>Next</Button>
                </>
              ) : step === 6 ? (
                <>
                  <Button type="button" variant="outline" onClick={() => setStep(5)}>
                    Back
                  </Button>
                  <Button type="button" onClick={() => setStep(7)}>Next</Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={() => setStep(6)}>
                    Back
                  </Button>
                  <Button type="button" onClick={handleAddProperty} disabled={isUploading || isUploadingVideo}>
                    {(isUploading || isUploadingVideo) ? "Uploading..." : "Save Property"}
                  </Button>
                </>
              )}
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

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

      <Dialog
        open={!!selectedPropertyForVideo}
        onOpenChange={(open) => !open && setSelectedPropertyForVideo(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-black border-none">
          {selectedPropertyForVideo?.Virtual_Tour ? (
            <video
              src={selectedPropertyForVideo.Virtual_Tour}
              controls
              autoPlay
              className="w-full h-full object-contain max-h-[85vh]"
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-white">
              No video available
            </div>
          )}
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-muted-foreground font-medium">Loading your properties...</p>
        </div>
      ) : landlordProps.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground bg-card/50 rounded-xl border border-border border-dashed">
          <h3 className="text-xl font-medium mb-2">No properties found</h3>
          <p className="mb-4">You haven't added any properties yet.</p>
          <Button onClick={() => setIsAdding(true)}>Add your first property</Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/80 backdrop-blur-sm p-4 rounded-xl border border-border shadow-sm">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties by name, ID or address..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                className="pl-9 h-10 w-full bg-background/50 border-border/80 focus-visible:ring-primary/30"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <Select value={propertyTypeFilter} onValueChange={(val) => { setPropertyTypeFilter(val); setPage(0); }}>
                <SelectTrigger className="w-[140px] h-10 bg-background/50">
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
              <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(0); }}>
                <SelectTrigger className="w-[170px] h-10 bg-background/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Occupied">Occupied</SelectItem>
                  <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredProps.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground bg-card/50 rounded-xl border border-border border-dashed">
               <p className="mb-4">No properties match your filters.</p>
               <Button variant="outline" onClick={() => { setSearchQuery(""); setPropertyTypeFilter("All"); setStatusFilter("All"); }}>Clear Filters</Button>
            </div>
          ) : (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                <AnimatePresence mode="popLayout">
                  {paginatedProps.map((p, idx) => (
                    <motion.div
                      key={p.property_id}
                      initial={{ opacity: 0, y: 40, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ 
                        duration: 0.5, 
                        delay: idx * 0.08, 
                        type: "spring",
                        stiffness: 100,
                        damping: 15
                      }}
                      className="h-full"
                    >
                      <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-500 border-border/60 hover:border-primary/50 bg-card flex flex-col h-full rounded-2xl hover:-translate-y-1">
                        <div className="relative h-56 w-full bg-muted/30 overflow-hidden cursor-pointer" onClick={() => navigate({ to: "/app/property/$id", params: { id: String(p.property_id) } })}>
                          {parseImageUrls(p.image_url)[0] ? (
                            <img src={parseImageUrls(p.image_url)[0]} alt={p.property_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/30 group-hover:bg-primary/10 transition-colors duration-500">
                               <Home className="h-12 w-12 opacity-40" />
                            </div>
                          )}
                          
                          {/* Subtle overlay gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                          
                          <div className="absolute top-3 left-3">
                            <StatusBadge value={p.availability_status} />
                          </div>
                          
                          <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-2 group-hover:translate-x-0">
                            <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full shadow-sm hover:scale-110 transition-all" onClick={(e) => { e.stopPropagation(); handleDeleteProperty(p); }} title="Delete Property">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          
                          <div className="absolute bottom-3 left-4 right-4 pointer-events-none transform transition-transform duration-500 group-hover:-translate-y-1">
                            <h3 className="text-white font-bold text-xl truncate drop-shadow-md">{p.property_name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-black/40 text-white/90 backdrop-blur-md">#{p.property_id}</span>
                              <span className="text-xs font-medium text-white/90 line-clamp-1">
                                 {p.property_type} {p.Category ? `• ${p.Category}` : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-5 flex flex-col flex-grow bg-card relative overflow-hidden">
                          {/* Subtle background flair */}
                          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                          
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-5 flex-grow font-medium leading-relaxed z-10">
                             {(() => {
                                try {
                                  const loc = JSON.parse(p.address || "{}");
                                  return [loc.street_address, loc.locality, loc.city].filter(Boolean).join(", ") || "";
                                } catch {
                                  return p.address || "";
                                }
                             })()}
                          </p>
                          
                          <Button className="w-full mt-auto font-semibold shadow-sm hover:shadow-md transition-all duration-300 group/btn bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90" variant="default" asChild>
                            <Link to="/app/property/$id" params={{ id: String(p.property_id) }}>
                              View Property Details
                              <ChevronRight className="ml-1 h-4 w-4 opacity-70 group-hover/btn:translate-x-1.5 transition-transform" />
                            </Link>
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8 pt-4">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="hover:bg-primary hover:text-primary-foreground">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <span className="text-sm font-medium text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} className="hover:bg-primary hover:text-primary-foreground">
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Edit Property Dialog */}
      <Dialog
        open={!!editingProperty}
        onOpenChange={(open) => !open && setEditingProperty(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto w-full sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription className="sr-only">
              Edit the details of this property.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => e.preventDefault()} className="grid gap-4 py-4">
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
              <Label>Virtual Tour Video (Optional, Max 10MB)</Label>
              {editVideo ? (
                <div className="flex items-center gap-4">
                  <video src={editVideo} className="h-20 w-32 object-cover rounded-md bg-black" />
                  <Button variant="outline" size="sm" onClick={() => setEditVideo(null)}>
                    Remove Video
                  </Button>
                </div>
              ) : (
                <Input
                  type="file"
                  accept="video/mp4,video/x-m4v,video/*"
                  onChange={(e) => handleVideoUpload(e, true)}
                  disabled={isUploadingVideo}
                  className="cursor-pointer"
                />
              )}
              {isUploadingVideo && <p className="text-xs text-muted-foreground animate-pulse">Uploading video...</p>}
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

            <DialogFooter className="mt-4 pb-12">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingProperty(null)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleUpdateProperty}>Update Property</Button>
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
