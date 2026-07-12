import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { getPropertyById, updateProperty } from "@/core/db/supabase-queries";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { Button } from "@/shared/components/ui/button";
import { ChevronLeft, Pencil, ImagePlus, X, CheckCircle } from "lucide-react";
import { supabase } from "@/core/db/supabase";
import { toast } from "sonner";
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
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { UnifiedProperty } from "./app.properties";

export const Route = createFileRoute("/app/property/$id")({
  component: PropertyDetailsPage,
});

const ROOM_LABELS = ["Front View", "Living Room", "Bedroom", "Kitchen"] as const;

function PropertyDetailsPage() {
  const { id } = Route.useParams();
  const [property, setProperty] = useState<UnifiedProperty | null>(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editStep, setEditStep] = useState(1);
  const [editForm, setEditForm] = useState<any>({});
  const [isUpdating, setIsUpdating] = useState(false);

  const [editImages, setEditImages] = useState<string[]>([]);
  const [editVideo, setEditVideo] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

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
      rent_amount: property?.rent_amount || "",
      ...loc
    });
    
    let specs: any = {};
    try {
      if ((property as any)?.specifications) {
        specs = JSON.parse((property as any).specifications);
      }
    } catch { }

    const rentDetails = specs.rent_details || {};
    const amenities = (property as any)?.amenitiesData || {};
    const tenantPrefs = (property as any)?.tenantPreferencesData || {};
    const utilities = (property as any)?.utilitiesData || {};
    const nearbyFacilities = (property as any)?.nearbyFacilitiesData || {};
    const documents = (property as any)?.documentsData || {};
    const contactDetails = (property as any)?.contactDetailsData || {};
    const availability = (property as any)?.availabilityData || {};
    const additionalInformation = (property as any)?.additionalInformationData || {};
    const propertyVerified = (property as any)?.property_verification?.[0]?.property_verified ?? false;
    const adminApproval = (property as any)?.property_verification?.[0]?.['admin approval'] ?? "Pending";
    const featuredProperty = (property as any)?.property_verification?.[0]?.featured_property ?? false;
    
    setEditForm((prev: any) => ({ ...prev, ...specs, ...rentDetails, ...amenities, ...tenantPrefs, ...utilities, ...nearbyFacilities, ...documents, ...contactDetails, ...availability, ...additionalInformation, property_verified: propertyVerified, admin_approval: adminApproval, featured_property: featuredProperty }));

    let images = [];
    try {
      if (property?.image_url) {
        const parsed = JSON.parse(property.image_url);
        images = Array.isArray(parsed) ? parsed : [String(parsed)];
      }
    } catch {
      images = property?.image_url ? [property.image_url] : [];
    }
    setEditImages(images);
    setEditVideo(property?.Virtual_Tour || null);

    setEditStep(1);
    setIsEditing(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const slotsLeft = 4 - editImages.length;
    if (slotsLeft <= 0) {
      toast.error("Maximum 4 images allowed.");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, slotsLeft);
    setIsUploading(true);

    const uploadToSupabase = async (file: File): Promise<string> => {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
      const { error } = await supabase.storage
        .from('property-images')
        .upload(`properties/${fileName}`, file, { cacheControl: '3600', upsert: false });

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
      toast.error("Failed to upload images.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setEditVideo(publicUrlData.publicUrl);
      toast.success("Video uploaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload video.");
    } finally {
      setIsUploadingVideo(false);
      e.target.value = "";
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Document must be less than 10MB");
      e.target.value = "";
      return;
    }

    setIsUploadingDoc(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
      const { error } = await supabase.storage
        .from('property-documents')
        .upload(`properties/${fileName}`, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('property-documents')
        .getPublicUrl(`properties/${fileName}`);

      setEditForm((prev: any) => ({ ...prev, [fieldName]: publicUrlData.publicUrl }));
      toast.success("Document uploaded successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to upload document: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUploadingDoc(false);
      e.target.value = "";
    }
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
    
    const specsObj = {
      bedrooms: editForm.bedrooms || "",
      bathrooms: editForm.bathrooms || "",
      balconies: editForm.balconies || "",
      kitchen: editForm.kitchen || "",
      hall: editForm.hall || "",
      dining_room: editForm.dining_room || "",
      study_room: editForm.study_room || "",
      floor_number: editForm.floor_number || "",
      total_floors: editForm.total_floors || "",
      built_up_area: editForm.built_up_area || "",
      carpet_area: editForm.carpet_area || "",
      plot_area: editForm.plot_area || "",
      property_age: editForm.property_age || "",
      facing_direction: editForm.facing_direction || "",
      rent_details: {
        security_deposit: editForm.security_deposit || "",
        maintenance_charges: editForm.maintenance_charges || "",
        electricity_charges: editForm.electricity_charges || "",
        water_charges: editForm.water_charges || "",
        parking_charges: editForm.parking_charges || "",
        advance_payment: editForm.advance_payment || "",
        available_from: editForm.available_from || "",
        lease_duration: editForm.lease_duration || "",
      }
    };
    
    const payload: any = {
      property_name: editForm.property_name,
      property_type: editForm.property_type,
      availability_status: editForm.availability_status,
      Category: editForm.Category,
      Description: editForm.Description,
      rent_amount: editForm.rent_amount,
      address: JSON.stringify(locationObj),
      specifications: JSON.stringify(specsObj),
      image_url: editImages.length > 0 ? JSON.stringify(editImages) : null,
      Virtual_Tour: editVideo || null,
      amenities: {
        wifi: editForm.wifi === true,
        power_backup: editForm.power_backup === true,
        parking: editForm.parking === true,
        lift: editForm.lift === true,
        gym: editForm.gym === true,
        swimming_pool: editForm.swimming_pool === true,
        cctv: editForm.cctv === true,
        security: editForm.security === true,
        garden: editForm.garden === true,
        childrens_play_area: editForm.childrens_play_area === true,
        furnished: editForm.furnished === true,
        semi_furnished: editForm.semi_furnished === true,
        air_conditioning: editForm.air_conditioning === true
      },
      tenant_preferences: {
        preferred_tenant_type: editForm.preferred_tenant_type,
        bachelors_allowed: editForm.bachelors_allowed === true,
        family_allowed: editForm.family_allowed === true,
        students_allowed: editForm.students_allowed === true,
        pets_allowed: editForm.pets_allowed === true,
        smoking_allowed: editForm.smoking_allowed === true,
        drinking_allowed: editForm.drinking_allowed === true,
        maximum_occupants: editForm.maximum_occupants
      },
      property_utilities: {
        water_supply: editForm.water_supply,
        electricity_connection: editForm.electricity_connection,
        internet_available: editForm.internet_available === true,
        gas_connection: editForm.gas_connection === true,
        sewage_connection: editForm.sewage_connection === true
      },
      nearby_facilities: {
        school_distance: editForm.school_distance,
        college_distance: editForm.college_distance,
        hospital_distance: editForm.hospital_distance,
        bus_stop_distance: editForm.bus_stop_distance,
        railway_station_distance: editForm.railway_station_distance,
        airport_distance: editForm.airport_distance,
        supermarket_distance: editForm.supermarket_distance,
        bank_distance: editForm.bank_distance
      },
      property_documents: {
        ownership_proof: editForm.ownership_proof,
        tax_receipt: editForm.tax_receipt,
        electricity_bill: editForm.electricity_bill,
        encumbrance_certificate: editForm.encumbrance_certificate,
        occupancy_certificate: editForm.occupancy_certificate,
        property_insurance: editForm.property_insurance,
        owner_government_id: editForm.owner_government_id
      },
      property_availability: {
        available_from: editForm.available_from,
        visit_timing: editForm.visit_timing,
        open_house_date: editForm.open_house_date
      },
      property_contact_details: {
        landlord_name: editForm.landlord_name,
        mobile_number: editForm.mobile_number,
        email: editForm.email,
        preferred_contact_time: editForm.preferred_contact_time,
        whatsapp_number: editForm.whatsapp_number
      },
      property_additional_information: {
        house_rules: editForm.house_rules,
        noise_restrictions: editForm.noise_restrictions,
        visitor_policy: editForm.visitor_policy,
        society_rules: editForm.society_rules,
        pets_policy: editForm.pets_policy,
        smoking_policy: editForm.smoking_policy,
        maintenance_instructions: editForm.maintenance_instructions
      },
      property_verified: editForm.property_verified,
      admin_approval: editForm.admin_approval,
      featured_property: editForm.featured_property
    };
    
    try {
      await updateProperty(property.property_id, payload);
      
      // Refresh
      const data = await getPropertyById(id);
      setProperty(data as UnifiedProperty);
      
      setIsEditing(false);
      toast.success("Property updated successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to update property: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
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


  let parsedSpecs: any = null;
  try {
    if ((property as any)?.specifications) {
      parsedSpecs = JSON.parse((property as any).specifications);
    }
  } catch {}

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

  const pageVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.15, delayChildren: 0.1 } 
    }
  };

  const heroImageVariants: Variants = {
    hidden: { scale: 1.15, filter: "blur(10px)" },
    visible: { 
      scale: 1, 
      filter: "blur(0px)",
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  const heroTextVariants: Variants = {
    hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: "easeOut", delay: 0.4 } 
    }
  };

  const backBtnVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, delay: 0.2 } }
  };

  const contentVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 overflow-x-hidden"
    >
      {/* Hero Banner Section */}
      <div className="relative w-full h-[45vh] rounded-2xl overflow-hidden bg-black shadow-md">
        {parsedImages.length > 0 ? (
          <motion.div variants={heroImageVariants} className="absolute inset-0 w-full h-full">
            <img
              src={parsedImages[0]}
              alt="Blurred Background"
              className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-40"
            />
            <img
              src={parsedImages[0]}
              alt="Front View"
              className="relative z-0 w-full h-full object-contain"
            />
          </motion.div>
        ) : (
          <motion.div variants={heroImageVariants} className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted">
            <span className="text-lg">No pictures uploaded</span>
          </motion.div>
        )}

        {/* Dark Gradient Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10 pointer-events-none" />

        {/* Back Button */}
        <motion.div variants={backBtnVariants} className="absolute top-6 left-6 z-10 flex items-center gap-3">
          <Button variant="outline" size="sm" asChild className="bg-background/20 text-white border-white/30 hover:bg-background/40 hover:text-white backdrop-blur-md">
            <Link to="/app/properties">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Properties
            </Link>
          </Button>
        </motion.div>

        {/* Property Title Overlay */}
        <motion.div variants={heroTextVariants} className="absolute bottom-8 left-6 md:left-10 z-10 text-white">
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
        </motion.div>
      </div>

      <motion.div variants={contentVariants} className="max-w-5xl mx-auto flex flex-col gap-8 mt-8">
        <div className="flex justify-end w-full">
          <Button 
            variant="default" 
            size="sm" 
            onClick={openEditDialog}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-none shadow-md transition-all duration-300 group"
          >
            <Pencil className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" /> Edit Details
          </Button>
        </div>

        {/* Edit Property Dialog */}
        <Dialog open={isEditing} onOpenChange={(open) => !open && !isUpdating && setIsEditing(false)}>
          <DialogContent className="w-full sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Property Details {editStep && `- Step ${editStep} of 14`}</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={(e) => e.preventDefault()} className="grid gap-6 py-4">
              {editStep === 1 ? (
                <>
                  {/* Basic Information */}
                  <div>
                    <h3 className="font-semibold border-b pb-2 mb-4">Basic Information</h3>
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
                        <Select value={editForm.Category || ""} onValueChange={(val) => setEditForm({ ...editForm, Category: val })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Residential">Residential</SelectItem>
                            <SelectItem value="Commercial">Commercial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2 col-span-2">
                        <Label>Status</Label>
                        <Select value={editForm.availability_status || "Available"} onValueChange={(val) => setEditForm({ ...editForm, availability_status: val })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Available">Available</SelectItem>
                            <SelectItem value="Occupied">Occupied</SelectItem>
                            <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
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
                  </div>
                  
                  
                </>
              ) : editStep === 2 ? (
                <>
                  {/* Location Details */}
                  <div>
                    <h3 className="font-semibold border-b pb-2 mb-4">Location Details</h3>
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
                        <Label>Landmark (Optional)</Label>
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
                        <Label>Google Map Location (Lat, Lng) (Optional)</Label>
                        <Input value={editForm.map_location || ""} onChange={(e) => setEditForm({...editForm, map_location: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  
                </>
              ) : editStep === 3 ? (
                <>
                  {/* Media */}
                  <div>
                    <h3 className="font-semibold border-b pb-2 mb-4">Images & Media</h3>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>Virtual Tour Video (Optional, Max 10MB)</Label>
                        {editVideo ? (
                          <div className="flex items-center gap-4">
                            <video src={editVideo} className="h-20 w-32 object-cover rounded-md bg-black" />
                            <Button type="button" variant="outline" size="sm" onClick={() => setEditVideo(null)}>
                              Remove Video
                            </Button>
                          </div>
                        ) : (
                          <Input
                            type="file"
                            accept="video/mp4,video/x-m4v,video/*"
                            onChange={handleVideoUpload}
                            disabled={isUploadingVideo}
                            className="cursor-pointer"
                          />
                        )}
                        {isUploadingVideo && <p className="text-xs text-muted-foreground animate-pulse">Uploading video...</p>}
                      </div>

                      <div className="grid gap-2 mt-2">
                        <Label>Pictures (Up to 4)</Label>
                        <p className="text-xs text-muted-foreground mb-2">Please upload images in order: 1. Front View, 2. Living Room, 3. Bedroom, 4. Kitchen</p>

                        {editImages.length > 0 && (
                          <div className="flex gap-3 flex-wrap">
                            {editImages.map((url, idx) => (
                              <div key={idx} className="flex flex-col items-center gap-1">
                                <div className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border">
                                  <img src={url} alt={ROOM_LABELS[idx] ?? `Image ${idx + 1}`} className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => setEditImages((prev) => prev.filter((_, i) => i !== idx))}
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
                                {isUploading ? "Uploading..." : `Upload next: ${ROOM_LABELS[editImages.length] ?? "Image"} (${4 - editImages.length} remaining)`}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  
                </>
              ) : editStep === 4 ? (
                <>
                  {/* Property Specifications */}
                  <div>
                    <h3 className="font-semibold border-b pb-2 mb-4">Property Specifications</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Bedrooms</Label>
                        <Input type="number" placeholder="e.g. 2" value={editForm.bedrooms || ""} onChange={(e) => setEditForm({...editForm, bedrooms: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Bathrooms</Label>
                        <Input type="number" placeholder="e.g. 2" value={editForm.bathrooms || ""} onChange={(e) => setEditForm({...editForm, bathrooms: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Balconies</Label>
                        <Input type="number" placeholder="e.g. 1" value={editForm.balconies || ""} onChange={(e) => setEditForm({...editForm, balconies: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Kitchen</Label>
                        <Input placeholder="e.g. Modular" value={editForm.kitchen || ""} onChange={(e) => setEditForm({...editForm, kitchen: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Hall</Label>
                        <Input type="number" placeholder="e.g. 1" value={editForm.hall || ""} onChange={(e) => setEditForm({...editForm, hall: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Dining Room</Label>
                        <Input placeholder="e.g. Yes" value={editForm.dining_room || ""} onChange={(e) => setEditForm({...editForm, dining_room: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Study Room</Label>
                        <Input placeholder="e.g. Optional" value={editForm.study_room || ""} onChange={(e) => setEditForm({...editForm, study_room: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Floor Number</Label>
                        <Input type="number" placeholder="e.g. 3" value={editForm.floor_number || ""} onChange={(e) => setEditForm({...editForm, floor_number: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Total Floors</Label>
                        <Input type="number" placeholder="e.g. 5" value={editForm.total_floors || ""} onChange={(e) => setEditForm({...editForm, total_floors: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Built-up Area</Label>
                        <Input placeholder="e.g. 1200 sq.ft" value={editForm.built_up_area || ""} onChange={(e) => setEditForm({...editForm, built_up_area: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Carpet Area</Label>
                        <Input placeholder="e.g. 1000 sq.ft" value={editForm.carpet_area || ""} onChange={(e) => setEditForm({...editForm, carpet_area: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Plot Area</Label>
                        <Input placeholder="e.g. 1500 sq.ft" value={editForm.plot_area || ""} onChange={(e) => setEditForm({...editForm, plot_area: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Property Age</Label>
                        <Input placeholder="e.g. 5 Years" value={editForm.property_age || ""} onChange={(e) => setEditForm({...editForm, property_age: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Facing Direction</Label>
                        <Input placeholder="e.g. East" value={editForm.facing_direction || ""} onChange={(e) => setEditForm({...editForm, facing_direction: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  
                </>
              ) : editStep === 5 ? (
                <>
                  {/* Rent Details */}
                  <div>
                    <h3 className="font-semibold border-b pb-2 mb-4">Rent Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Monthly Rent</Label>
                        <Input placeholder="e.g. ₹18,000" value={editForm.rent_amount || ""} onChange={(e) => setEditForm({...editForm, rent_amount: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Security Deposit</Label>
                        <Input placeholder="e.g. ₹50,000" value={editForm.security_deposit || ""} onChange={(e) => setEditForm({...editForm, security_deposit: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Maintenance Charges</Label>
                        <Input placeholder="e.g. ₹2,000" value={editForm.maintenance_charges || ""} onChange={(e) => setEditForm({...editForm, maintenance_charges: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Electricity Charges</Label>
                        <Input placeholder="e.g. Included/Separate" value={editForm.electricity_charges || ""} onChange={(e) => setEditForm({...editForm, electricity_charges: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Water Charges</Label>
                        <Input placeholder="e.g. Included" value={editForm.water_charges || ""} onChange={(e) => setEditForm({...editForm, water_charges: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Parking Charges</Label>
                        <Input placeholder="e.g. ₹500" value={editForm.parking_charges || ""} onChange={(e) => setEditForm({...editForm, parking_charges: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Advance Payment</Label>
                        <Input placeholder="e.g. 2 Months" value={editForm.advance_payment || ""} onChange={(e) => setEditForm({...editForm, advance_payment: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Lease Duration</Label>
                        <Input placeholder="e.g. 11 Months" value={editForm.lease_duration || ""} onChange={(e) => setEditForm({...editForm, lease_duration: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  
                </>
              ) : editStep === 6 ? (
                <>
                  {/* Amenities */}
                  <div>
                    <h3 className="font-semibold border-b pb-2 mb-4">Amenities</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="edit_wifi" checked={editForm.wifi} onCheckedChange={(checked) => setEditForm({...editForm, wifi: checked === true})} />
                        <Label htmlFor="edit_wifi" className="cursor-pointer">Wi-Fi</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="edit_power_backup" checked={editForm.power_backup} onCheckedChange={(checked) => setEditForm({...editForm, power_backup: checked === true})} />
                        <Label htmlFor="edit_power_backup" className="cursor-pointer">Power Backup</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="edit_parking" checked={editForm.parking} onCheckedChange={(checked) => setEditForm({...editForm, parking: checked === true})} />
                        <Label htmlFor="edit_parking" className="cursor-pointer">Parking</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="edit_lift" checked={editForm.lift} onCheckedChange={(checked) => setEditForm({...editForm, lift: checked === true})} />
                        <Label htmlFor="edit_lift" className="cursor-pointer">Lift</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="edit_gym" checked={editForm.gym} onCheckedChange={(checked) => setEditForm({...editForm, gym: checked === true})} />
                        <Label htmlFor="edit_gym" className="cursor-pointer">Gym/Fitness Center</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="edit_swimming_pool" checked={editForm.swimming_pool} onCheckedChange={(checked) => setEditForm({...editForm, swimming_pool: checked === true})} />
                        <Label htmlFor="edit_swimming_pool" className="cursor-pointer">Swimming Pool</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="edit_cctv" checked={editForm.cctv} onCheckedChange={(checked) => setEditForm({...editForm, cctv: checked === true})} />
                        <Label htmlFor="edit_cctv" className="cursor-pointer">CCTV Surveillance</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="edit_security" checked={editForm.security} onCheckedChange={(checked) => setEditForm({...editForm, security: checked === true})} />
                        <Label htmlFor="edit_security" className="cursor-pointer">Security Guard</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="edit_garden" checked={editForm.garden} onCheckedChange={(checked) => setEditForm({...editForm, garden: checked === true})} />
                        <Label htmlFor="edit_garden" className="cursor-pointer">Garden</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="edit_childrens_play_area" checked={editForm.childrens_play_area} onCheckedChange={(checked) => setEditForm({...editForm, childrens_play_area: checked === true})} />
                        <Label htmlFor="edit_childrens_play_area" className="cursor-pointer">Children's Play Area</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="edit_furnished" checked={editForm.furnished} onCheckedChange={(checked) => setEditForm({...editForm, furnished: checked === true})} />
                        <Label htmlFor="edit_furnished" className="cursor-pointer">Furnished</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="edit_semi_furnished" checked={editForm.semi_furnished} onCheckedChange={(checked) => setEditForm({...editForm, semi_furnished: checked === true})} />
                        <Label htmlFor="edit_semi_furnished" className="cursor-pointer">Semi-Furnished</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="edit_air_conditioning" checked={editForm.air_conditioning} onCheckedChange={(checked) => setEditForm({...editForm, air_conditioning: checked === true})} />
                        <Label htmlFor="edit_air_conditioning" className="cursor-pointer">Air Conditioning</Label>
                      </div>
                    </div>
                  </div>

                  
                </>
              ) : editStep === 7 ? (
                <>
                  {/* Tenant Preferences */}
                  <div>
                    <h3 className="font-semibold border-b pb-2 mb-4">Tenant Preferences</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 grid gap-2">
                        <Label>Preferred Tenant Type</Label>
                        <Input placeholder="e.g. Family" value={editForm.preferred_tenant_type || ""} onChange={(e) => setEditForm({...editForm, preferred_tenant_type: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Bachelors Allowed</Label>
                        <Select value={editForm.bachelors_allowed ? "yes" : "no"} onValueChange={(val) => setEditForm({...editForm, bachelors_allowed: val === "yes"})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Students Allowed</Label>
                        <Select value={editForm.students_allowed ? "yes" : "no"} onValueChange={(val) => setEditForm({...editForm, students_allowed: val === "yes"})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Pets Allowed</Label>
                        <Select value={editForm.pets_allowed ? "yes" : "no"} onValueChange={(val) => setEditForm({...editForm, pets_allowed: val === "yes"})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Smoking Allowed</Label>
                        <Select value={editForm.smoking_allowed ? "yes" : "no"} onValueChange={(val) => setEditForm({...editForm, smoking_allowed: val === "yes"})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Drinking Allowed</Label>
                        <Select value={editForm.drinking_allowed ? "yes" : "no"} onValueChange={(val) => setEditForm({...editForm, drinking_allowed: val === "yes"})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 grid gap-2">
                        <Label>Maximum Occupants</Label>
                        <Input type="number" placeholder="e.g. 4" value={editForm.maximum_occupants || ""} onChange={(e) => setEditForm({...editForm, maximum_occupants: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  
                </>
              ) : editStep === 8 ? (
                <>
                  {/* Utility Information */}
                  <div>
                    <h3 className="font-semibold border-b pb-2 mb-4">Utility Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 grid gap-2">
                        <Label>Water Supply</Label>
                        <Input placeholder="e.g. 24x7 Corporation Water" value={editForm.water_supply || ""} onChange={(e) => setEditForm({...editForm, water_supply: e.target.value})} />
                      </div>
                      <div className="col-span-2 grid gap-2">
                        <Label>Electricity Connection</Label>
                        <Input placeholder="e.g. Generator / Invertor" value={editForm.electricity_connection || ""} onChange={(e) => setEditForm({...editForm, electricity_connection: e.target.value})} />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="edit_internet" checked={editForm.internet_available} onCheckedChange={(c) => setEditForm({...editForm, internet_available: !!c})} />
                        <Label htmlFor="edit_internet" className="cursor-pointer">Internet Available</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="edit_gas" checked={editForm.gas_connection} onCheckedChange={(c) => setEditForm({...editForm, gas_connection: !!c})} />
                        <Label htmlFor="edit_gas" className="cursor-pointer">Gas Connection</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="edit_sewage" checked={editForm.sewage_connection} onCheckedChange={(c) => setEditForm({...editForm, sewage_connection: !!c})} />
                        <Label htmlFor="edit_sewage" className="cursor-pointer">Sewage Connection</Label>
                      </div>
                    </div>
                  </div>

                  
                </>
              ) : editStep === 9 ? (
                <>
                  {/* Nearby Facilities */}
                  <div>
                    <h3 className="font-semibold border-b pb-2 mb-4">Nearby Facilities</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>School Distance (km)</Label>
                        <Input type="number" placeholder="e.g. 1.5" value={editForm.school_distance || ""} onChange={(e) => setEditForm({...editForm, school_distance: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>College Distance (km)</Label>
                        <Input type="number" placeholder="e.g. 3.0" value={editForm.college_distance || ""} onChange={(e) => setEditForm({...editForm, college_distance: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Hospital Distance (km)</Label>
                        <Input type="number" placeholder="e.g. 2.0" value={editForm.hospital_distance || ""} onChange={(e) => setEditForm({...editForm, hospital_distance: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Bus Stop Distance (km)</Label>
                        <Input type="number" placeholder="e.g. 0.5" value={editForm.bus_stop_distance || ""} onChange={(e) => setEditForm({...editForm, bus_stop_distance: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Railway Station (km)</Label>
                        <Input type="number" placeholder="e.g. 5.0" value={editForm.railway_station_distance || ""} onChange={(e) => setEditForm({...editForm, railway_station_distance: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Airport Distance (km)</Label>
                        <Input type="number" placeholder="e.g. 15.0" value={editForm.airport_distance || ""} onChange={(e) => setEditForm({...editForm, airport_distance: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Supermarket (km)</Label>
                        <Input type="number" placeholder="e.g. 1.0" value={editForm.supermarket_distance || ""} onChange={(e) => setEditForm({...editForm, supermarket_distance: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Bank/ATM (km)</Label>
                        <Input type="number" placeholder="e.g. 0.2" value={editForm.bank_distance || ""} onChange={(e) => setEditForm({...editForm, bank_distance: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  
                </>
              ) : editStep === 10 ? (
                <>
                  <div className="grid gap-4">
                    <p className="text-sm text-muted-foreground mb-2">Upload relevant property documents. Only PDFs and Images (max 10MB) are allowed.</p>
                    
                    <div className="grid gap-2">
                      <Label>Ownership Proof *</Label>
                      <div className="flex items-center gap-4">
                        <Input type="file" accept=".pdf,image/*" onChange={(e) => handleDocumentUpload(e, 'ownership_proof', true)} disabled={isUploadingDoc} />
                        {editForm.ownership_proof && <span className="text-xs text-green-600 font-medium">Uploaded ✓</span>}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Tax Receipt *</Label>
                      <div className="flex items-center gap-4">
                        <Input type="file" accept=".pdf,image/*" onChange={(e) => handleDocumentUpload(e, 'tax_receipt', true)} disabled={isUploadingDoc} />
                        {editForm.tax_receipt && <span className="text-xs text-green-600 font-medium">Uploaded ✓</span>}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Electricity Bill *</Label>
                      <div className="flex items-center gap-4">
                        <Input type="file" accept=".pdf,image/*" onChange={(e) => handleDocumentUpload(e, 'electricity_bill', true)} disabled={isUploadingDoc} />
                        {editForm.electricity_bill && <span className="text-xs text-green-600 font-medium">Uploaded ✓</span>}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Encumbrance Certificate *</Label>
                      <div className="flex items-center gap-4">
                        <Input type="file" accept=".pdf,image/*" onChange={(e) => handleDocumentUpload(e, 'encumbrance_certificate', true)} disabled={isUploadingDoc} />
                        {editForm.encumbrance_certificate && <span className="text-xs text-green-600 font-medium">Uploaded ✓</span>}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Occupancy Certificate *</Label>
                      <div className="flex items-center gap-4">
                        <Input type="file" accept=".pdf,image/*" onChange={(e) => handleDocumentUpload(e, 'occupancy_certificate', true)} disabled={isUploadingDoc} />
                        {editForm.occupancy_certificate && <span className="text-xs text-green-600 font-medium">Uploaded ✓</span>}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Government ID of Owner *</Label>
                      <div className="flex items-center gap-4">
                        <Input type="file" accept=".pdf,image/*" onChange={(e) => handleDocumentUpload(e, 'owner_government_id', true)} disabled={isUploadingDoc} />
                        {editForm.owner_government_id && <span className="text-xs text-green-600 font-medium">Uploaded ✓</span>}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Property Insurance (Optional)</Label>
                      <div className="flex items-center gap-4">
                        <Input type="file" accept=".pdf,image/*" onChange={(e) => handleDocumentUpload(e, 'property_insurance', true)} disabled={isUploadingDoc} />
                        {editForm.property_insurance && <span className="text-xs text-green-600 font-medium">Uploaded ✓</span>}
                      </div>
                    </div>
                  </div>

                  
                </>
              ) : editStep === 11 ? (
                <>
                  <div className="grid gap-4">
                    <p className="text-sm text-muted-foreground mb-2">Update contact details for the landlord or property manager.</p>
                    <div className="grid gap-2">
                      <Label>Landlord Name *</Label>
                      <Input placeholder="e.g. John Smith" value={editForm.landlord_name || ""} onChange={(e) => setEditForm({...editForm, landlord_name: e.target.value})} required />
                    </div>
                    <div className="grid gap-2">
                      <Label>Mobile Number *</Label>
                      <Input placeholder="e.g. +91 9876543210" value={editForm.mobile_number || ""} onChange={(e) => setEditForm({...editForm, mobile_number: e.target.value})} required />
                    </div>
                    <div className="grid gap-2">
                      <Label>Email</Label>
                      <Input type="email" placeholder="e.g. john@email.com" value={editForm.email || ""} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Preferred Contact Time</Label>
                      <Select value={editForm.preferred_contact_time || "Anytime"} onValueChange={(val) => setEditForm({...editForm, preferred_contact_time: val})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Contact Time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Morning">Morning</SelectItem>
                          <SelectItem value="Afternoon">Afternoon</SelectItem>
                          <SelectItem value="Evening">Evening</SelectItem>
                          <SelectItem value="Anytime">Anytime</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>WhatsApp Number (Optional)</Label>
                      <Input placeholder="e.g. +91 9876543210" value={editForm.whatsapp_number || ""} onChange={(e) => setEditForm({...editForm, whatsapp_number: e.target.value})} />
                    </div>
                  </div>

                  
                </>
              ) : editStep === 12 ? (
                <>
                  <div className="grid gap-4">
                    <p className="text-sm text-muted-foreground mb-2">Update property availability details.</p>
                    <div className="grid gap-2">
                      <Label>Available From</Label>
                      <Input type="date" placeholder="e.g. 1-Aug-26" value={editForm.available_from || ""} onChange={(e) => setEditForm({...editForm, available_from: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Visit Timing</Label>
                      <Input placeholder="e.g. 10 AM-6 PM" value={editForm.visit_timing || ""} onChange={(e) => setEditForm({...editForm, visit_timing: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Open House Date (Optional)</Label>
                      <Input type="date" placeholder="e.g. Optional" value={editForm.open_house_date || ""} onChange={(e) => setEditForm({...editForm, open_house_date: e.target.value})} />
                    </div>
                  </div>

                  
                </>
              ) : editStep === 13 ? (
                <>
                  <div className="grid gap-4">
                    <p className="text-sm text-muted-foreground mb-2">Update property additional information.</p>
                    <div className="grid gap-2">
                      <Label>House Rules</Label>
                      <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="e.g. No loud music after 10 PM" value={editForm.house_rules || ""} onChange={(e) => setEditForm({...editForm, house_rules: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Noise Restrictions</Label>
                      <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="e.g. Keep noise down during afternoon" value={editForm.noise_restrictions || ""} onChange={(e) => setEditForm({...editForm, noise_restrictions: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Visitor Policy</Label>
                      <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="e.g. Visitors allowed until 11 PM" value={editForm.visitor_policy || ""} onChange={(e) => setEditForm({...editForm, visitor_policy: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Society Rules</Label>
                      <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="e.g. Use service lift for moving furniture" value={editForm.society_rules || ""} onChange={(e) => setEditForm({...editForm, society_rules: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Pets Policy</Label>
                      <Select value={editForm.pets_policy || "Allowed"} onValueChange={(val) => setEditForm({...editForm, pets_policy: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Allowed">Allowed</SelectItem>
                          <SelectItem value="Not Allowed">Not Allowed</SelectItem>
                          <SelectItem value="Conditional">Conditional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Smoking Policy</Label>
                      <Select value={editForm.smoking_policy || "Allowed"} onValueChange={(val) => setEditForm({...editForm, smoking_policy: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Allowed">Allowed</SelectItem>
                          <SelectItem value="Not Allowed">Not Allowed</SelectItem>
                          <SelectItem value="Designated Area">Designated Area</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Maintenance Instructions</Label>
                      <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="e.g. Call plumber for leaks immediately" value={editForm.maintenance_instructions || ""} onChange={(e) => setEditForm({...editForm, maintenance_instructions: e.target.value})} />
                    </div>
                  </div>
                  
                  
                </>
              ) : editStep === 14 ? (
                <>
                  <div className="grid gap-6 sm:grid-cols-2 mt-2">
                    <div className="space-y-2">
                      <Label>Property Verified</Label>
                      <Select value={editForm.property_verified ? "Yes" : "No"} onValueChange={(val) => setEditForm({...editForm, property_verified: val === "Yes"})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Admin Approval</Label>
                      <Select value={editForm.admin_approval} onValueChange={(val) => setEditForm({...editForm, admin_approval: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Featured Property</Label>
                      <Select value={editForm.featured_property ? "Yes" : "No"} onValueChange={(val) => setEditForm({...editForm, featured_property: val === "Yes"})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                </>
              ) : null}
            
              <DialogFooter className="mt-6 pt-4 border-t flex sm:justify-between items-center w-full">
                <div>
                   {editStep > 1 && (
                     <Button type="button" variant="outline" onClick={() => setEditStep(editStep - 1)}>Back</Button>
                   )}
                   {editStep === 1 && (
                     <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                   )}
                </div>
                <div className="flex gap-2">
                   <Button type="button" variant="secondary" onClick={handleUpdate} disabled={isUpdating || isUploading || isUploadingVideo || isUploadingDoc}>
                     {(isUpdating || isUploading || isUploadingVideo || isUploadingDoc) ? "Saving..." : "Save Changes"}
                   </Button>
                   {editStep < 14 && (
                     <Button type="button" onClick={() => setEditStep(editStep + 1)}>Next</Button>
                   )}
                </div>
              </DialogFooter>
</form>
          </DialogContent>
        </Dialog>

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

            {/* Images & Media Accordion */}
            <AccordionItem value="media" className="border rounded-xl px-6 bg-card shadow-sm">
              <AccordionTrigger className="hover:no-underline font-semibold text-lg py-5">
                Images & Media
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pb-6 pt-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {["Front View", "Living Room", "Bedroom", "Kitchen"].map((label, idx) => (
                      <div key={idx} className="flex flex-col gap-2">
                        <span className="text-muted-foreground text-xs uppercase tracking-wider">{label}</span>
                        {parsedImages[idx] ? (
                          <div className="aspect-square rounded-lg overflow-hidden border border-border">
                            <img src={parsedImages[idx]} alt={label} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="aspect-square rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/30">
                            <span className="text-xs text-muted-foreground">Not uploaded</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t">
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-3">Virtual Tour Video</span>
                    {property.Virtual_Tour ? (
                      <div className="rounded-xl overflow-hidden border border-border bg-black aspect-video max-w-2xl">
                        <video
                          src={property.Virtual_Tour}
                          controls
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <span className="font-medium text-sm text-muted-foreground">Not uploaded</span>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Property Specifications Accordion */}
            <AccordionItem value="specifications" className="border rounded-xl px-6 bg-card shadow-sm">
              <AccordionTrigger className="hover:no-underline font-semibold text-lg py-5">
                Property Specifications
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm pb-6 pt-2">
                  {parsedSpecs ? (
                    <>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Bedrooms</span>
                        <span className="font-medium text-base">{parsedSpecs.bedrooms || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Bathrooms</span>
                        <span className="font-medium text-base">{parsedSpecs.bathrooms || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Balconies</span>
                        <span className="font-medium text-base">{parsedSpecs.balconies || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Kitchen</span>
                        <span className="font-medium text-base">{parsedSpecs.kitchen || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Hall</span>
                        <span className="font-medium text-base">{parsedSpecs.hall || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Dining Room</span>
                        <span className="font-medium text-base">{parsedSpecs.dining_room || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Study Room</span>
                        <span className="font-medium text-base">{parsedSpecs.study_room || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Floor Number</span>
                        <span className="font-medium text-base">{parsedSpecs.floor_number || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Total Floors</span>
                        <span className="font-medium text-base">{parsedSpecs.total_floors || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Built-up Area</span>
                        <span className="font-medium text-base">{parsedSpecs.built_up_area || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Carpet Area</span>
                        <span className="font-medium text-base">{parsedSpecs.carpet_area || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Plot Area</span>
                        <span className="font-medium text-base">{parsedSpecs.plot_area || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Property Age</span>
                        <span className="font-medium text-base">{parsedSpecs.property_age || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Facing Direction</span>
                        <span className="font-medium text-base">{parsedSpecs.facing_direction || "—"}</span>
                      </div>
                    </>
                  ) : (
                    <div className="sm:col-span-2 md:col-span-3">
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Specifications</span>
                      <span className="font-medium text-base text-muted-foreground italic">Not specified</span>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>

          {/* Rent Details Accordion */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="rent" className="border rounded-xl px-6 bg-card shadow-sm mt-4">
              <AccordionTrigger className="hover:no-underline font-semibold text-lg py-5">
                Rent Details
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm pb-6 pt-2">
                  {(property as any).rentDetailsData ? (
                    <>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Monthly Rent</span>
                        <span className="font-medium text-base">{(property as any).rentDetailsData.monthly_rent ? `₹${(property as any).rentDetailsData.monthly_rent}` : "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Security Deposit</span>
                        <span className="font-medium text-base">{(property as any).rentDetailsData.security_deposit ? `₹${(property as any).rentDetailsData.security_deposit}` : "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Maintenance Charges</span>
                        <span className="font-medium text-base">{(property as any).rentDetailsData.maintenance_charges ? `₹${(property as any).rentDetailsData.maintenance_charges}` : "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Electricity Charges</span>
                        <span className="font-medium text-base">{(property as any).rentDetailsData.electricity_charges ? `₹${(property as any).rentDetailsData.electricity_charges}` : "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Water Charges</span>
                        <span className="font-medium text-base">{(property as any).rentDetailsData.water_charges ? `₹${(property as any).rentDetailsData.water_charges}` : "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Parking Charges</span>
                        <span className="font-medium text-base">{(property as any).rentDetailsData.parking_charges ? `₹${(property as any).rentDetailsData.parking_charges}` : "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Advance Payment</span>
                        <span className="font-medium text-base">{parsedSpecs?.rent_details?.advance_payment || "—"}</span>
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Lease Duration</span>
                        <span className="font-medium text-base">{(property as any).rentDetailsData.lease_duration || "—"}</span>
                      </div>
                    </>
                  ) : parsedSpecs?.rent_details ? (
                    <>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Monthly Rent</span>
                        <span className="font-medium text-base">{property.rent_amount || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Security Deposit</span>
                        <span className="font-medium text-base">{parsedSpecs.rent_details.security_deposit || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Maintenance Charges</span>
                        <span className="font-medium text-base">{parsedSpecs.rent_details.maintenance_charges || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Electricity Charges</span>
                        <span className="font-medium text-base">{parsedSpecs.rent_details.electricity_charges || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Water Charges</span>
                        <span className="font-medium text-base">{parsedSpecs.rent_details.water_charges || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Parking Charges</span>
                        <span className="font-medium text-base">{parsedSpecs.rent_details.parking_charges || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Advance Payment</span>
                        <span className="font-medium text-base">{parsedSpecs.rent_details.advance_payment || "—"}</span>
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Lease Duration</span>
                        <span className="font-medium text-base">{parsedSpecs.rent_details.lease_duration || "—"}</span>
                      </div>
                    </>
                  ) : (
                    <div className="sm:col-span-2 md:col-span-3">
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Rent Details</span>
                      <span className="font-medium text-base text-muted-foreground italic">Not specified</span>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>

          {/* Amenities Accordion */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="amenities" className="border rounded-xl px-6 bg-card shadow-sm mt-4">
              <AccordionTrigger className="hover:no-underline font-semibold text-lg py-5">
                Amenities
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-sm pb-6 pt-2">
                  {(() => {
                    const amData = (property as any)?.amenitiesData || {};
                    const amenitiesList = [
                      { id: "wifi", label: "Wi-Fi" },
                      { id: "power_backup", label: "Power Backup" },
                      { id: "parking", label: "Parking" },
                      { id: "lift", label: "Lift" },
                      { id: "gym", label: "Gym/Fitness Center" },
                      { id: "swimming_pool", label: "Swimming Pool" },
                      { id: "cctv", label: "CCTV Surveillance" },
                      { id: "security", label: "Security Guard" },
                      { id: "garden", label: "Garden" },
                      { id: "childrens_play_area", label: "Children's Play Area" },
                      { id: "furnished", label: "Furnished" },
                      { id: "semi_furnished", label: "Semi-Furnished" },
                      { id: "air_conditioning", label: "Air Conditioning" }
                    ];

                    const presentAmenities = amenitiesList.filter(am => amData[am.id] === true);

                    if (presentAmenities.length > 0) {
                      return presentAmenities.map(am => (
                        <div key={am.id} className="flex items-center space-x-2 text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span>{am.label}</span>
                        </div>
                      ));
                    } else if (Object.keys(amData).length > 0) {
                      return (
                        <div className="col-span-2 sm:col-span-3 md:col-span-4">
                          <span className="text-muted-foreground italic">No amenities marked</span>
                        </div>
                      );
                    } else {
                      return (
                        <div className="col-span-2 sm:col-span-3 md:col-span-4">
                          <span className="text-muted-foreground italic">Amenities not specified</span>
                        </div>
                      );
                    }
                  })()}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Tenant Preferences Accordion */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="tenant_preferences" className="border rounded-xl px-6 bg-card shadow-sm mt-4">
              <AccordionTrigger className="hover:no-underline font-semibold text-lg py-5">
                Tenant Preferences
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-sm pb-6 pt-2">
                  {(() => {
                    const tpData = (property as any)?.tenantPreferencesData || {};
                    const allowedList = [
                      { id: "bachelors_allowed", label: "Bachelors Allowed" },
                      { id: "students_allowed", label: "Students Allowed" },
                      { id: "pets_allowed", label: "Pets Allowed" },
                      { id: "smoking_allowed", label: "Smoking Allowed" },
                      { id: "drinking_allowed", label: "Drinking Allowed" },
                    ];

                    const presentAllowed = allowedList.filter(al => tpData[al.id] === true);

                    let elements = [];

                    if (tpData.preferred_tenant_type) {
                      elements.push(
                        <div key="preferred_tenant_type" className="col-span-2 sm:col-span-3 md:col-span-4 mb-2">
                          <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Preferred Tenant Type</span>
                          <span className="font-medium text-base">{tpData.preferred_tenant_type}</span>
                        </div>
                      );
                    }

                    if (tpData.maximum_occupants) {
                      elements.push(
                        <div key="maximum_occupants" className="col-span-2 sm:col-span-3 md:col-span-4 mb-4">
                          <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Maximum Occupants</span>
                          <span className="font-medium text-base">{tpData.maximum_occupants}</span>
                        </div>
                      );
                    }

                    if (presentAllowed.length > 0) {
                      elements.push(...presentAllowed.map(al => (
                        <div key={al.id} className="flex items-center space-x-2 text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span>{al.label}</span>
                        </div>
                      )));
                    } else if (Object.keys(tpData).length > 0 && elements.length === 0) {
                      elements.push(
                        <div key="no_pref" className="col-span-2 sm:col-span-3 md:col-span-4">
                          <span className="text-muted-foreground italic">No specific preferences marked</span>
                        </div>
                      );
                    } else if (elements.length === 0) {
                      elements.push(
                        <div key="no_data" className="col-span-2 sm:col-span-3 md:col-span-4">
                          <span className="text-muted-foreground italic">Tenant preferences not specified</span>
                        </div>
                      );
                    }

                    return elements;
                  })()}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Utility Information Accordion */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="utility_info" className="border rounded-xl px-6 bg-card shadow-sm mt-4">
              <AccordionTrigger className="hover:no-underline font-semibold text-lg py-5">
                Utility Information
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-sm pb-6 pt-2">
                  {(() => {
                    const utData = (property as any)?.utilitiesData || {};
                    let elements = [];

                    if (utData.water_supply) {
                      elements.push(
                        <div key="water_supply" className="col-span-2 sm:col-span-3 md:col-span-4 mb-2">
                          <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Water Supply</span>
                          <span className="font-medium text-base">{utData.water_supply}</span>
                        </div>
                      );
                    }
                    if (utData.electricity_connection) {
                      elements.push(
                        <div key="electricity_connection" className="col-span-2 sm:col-span-3 md:col-span-4 mb-4">
                          <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Electricity Connection</span>
                          <span className="font-medium text-base">{utData.electricity_connection}</span>
                        </div>
                      );
                    }

                    const utBools = [
                      { id: "internet_available", label: "Internet Available" },
                      { id: "gas_connection", label: "Gas Connection" },
                      { id: "sewage_connection", label: "Sewage Connection" }
                    ];

                    const present = utBools.filter(b => utData[b.id] === true);
                    if (present.length > 0) {
                      elements.push(...present.map(b => (
                        <div key={b.id} className="flex items-center space-x-2 text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span>{b.label}</span>
                        </div>
                      )));
                    } else if (Object.keys(utData).length > 0 && elements.length === 0) {
                      elements.push(
                        <div key="no_utils" className="col-span-2 sm:col-span-3 md:col-span-4">
                          <span className="text-muted-foreground italic">No utilities specified</span>
                        </div>
                      );
                    } else if (elements.length === 0) {
                      elements.push(
                        <div key="no_data_utils" className="col-span-2 sm:col-span-3 md:col-span-4">
                          <span className="text-muted-foreground italic">Utility information not specified</span>
                        </div>
                      );
                    }

                    return elements;
                  })()}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Nearby Facilities Accordion */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="nearby_facilities" className="border rounded-xl px-6 bg-card shadow-sm mt-4">
              <AccordionTrigger className="hover:no-underline font-semibold text-lg py-5">
                Nearby Facilities
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-sm pb-6 pt-2">
                  {(() => {
                    const nfData = (property as any)?.nearbyFacilitiesData || {};
                    let elements = [];

                    const distances = [
                      { id: "school_distance", label: "School" },
                      { id: "college_distance", label: "College" },
                      { id: "hospital_distance", label: "Hospital" },
                      { id: "bus_stop_distance", label: "Bus Stop" },
                      { id: "railway_station_distance", label: "Railway Station" },
                      { id: "airport_distance", label: "Airport" },
                      { id: "supermarket_distance", label: "Supermarket" },
                      { id: "bank_distance", label: "Bank/ATM" }
                    ];

                    distances.forEach(d => {
                      if (nfData[d.id]) {
                        elements.push(
                          <div key={d.id} className="col-span-2 sm:col-span-1 md:col-span-1 mb-2">
                            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">{d.label}</span>
                            <span className="font-medium text-base">{nfData[d.id]} km</span>
                          </div>
                        );
                      }
                    });

                    if (elements.length === 0) {
                      elements.push(
                        <div key="no_data_nf" className="col-span-2 sm:col-span-3 md:col-span-4">
                          <span className="text-muted-foreground italic">Nearby facilities not specified</span>
                        </div>
                      );
                    }

                    return elements;
                  })()}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Property Documents Accordion */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="property_documents" className="border rounded-xl px-6 bg-card shadow-sm mt-4">
              <AccordionTrigger className="hover:no-underline font-semibold text-lg py-5">
                Property Documents
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-sm pb-6 pt-2">
                  {(() => {
                    const docData = (property as any)?.documentsData || {};
                    let elements = [];

                    const docs = [
                      { id: "ownership_proof", label: "Ownership Proof" },
                      { id: "tax_receipt", label: "Tax Receipt" },
                      { id: "electricity_bill", label: "Electricity Bill" },
                      { id: "encumbrance_certificate", label: "Encumbrance Certificate" },
                      { id: "occupancy_certificate", label: "Occupancy Certificate" },
                      { id: "property_insurance", label: "Property Insurance" },
                      { id: "owner_government_id", label: "Owner Government ID" }
                    ];

                    docs.forEach(d => {
                      if (docData[d.id]) {
                        elements.push(
                          <div key={d.id} className="col-span-2 sm:col-span-1 md:col-span-1 mb-2">
                            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">{d.label}</span>
                            <a href={docData[d.id]} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium text-base truncate block w-full">View Document</a>
                          </div>
                        );
                      }
                    });

                    if (elements.length === 0) {
                      elements.push(
                        <div key="no_data_doc" className="col-span-2 sm:col-span-3 md:col-span-4">
                          <span className="text-muted-foreground italic">Property documents not specified</span>
                        </div>
                      );
                    }

                    return elements;
                  })()}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Contact Details Accordion */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="contact_details" className="border rounded-xl px-6 bg-card shadow-sm mt-4 mb-4">
              <AccordionTrigger className="hover:no-underline font-semibold text-lg py-5">
                Contact Details
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-sm pb-6 pt-2">
                  {(() => {
                    const contactData = (property as any)?.contactDetailsData || {};
                    let elements = [];

                    if (contactData.landlord_name) {
                      elements.push(
                        <div key="landlord_name" className="col-span-2 sm:col-span-1 md:col-span-1 mb-2">
                          <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Landlord Name</span>
                          <span className="font-medium text-base">{contactData.landlord_name}</span>
                        </div>
                      );
                    }
                    if (contactData.mobile_number) {
                      elements.push(
                        <div key="mobile_number" className="col-span-2 sm:col-span-1 md:col-span-1 mb-2">
                          <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Mobile Number</span>
                          <span className="font-medium text-base">{contactData.mobile_number}</span>
                        </div>
                      );
                    }
                    if (contactData.email) {
                      elements.push(
                        <div key="email" className="col-span-2 sm:col-span-1 md:col-span-1 mb-2">
                          <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Email</span>
                          <span className="font-medium text-base">{contactData.email}</span>
                        </div>
                      );
                    }
                    if (contactData.preferred_contact_time) {
                      elements.push(
                        <div key="preferred_contact_time" className="col-span-2 sm:col-span-1 md:col-span-1 mb-2">
                          <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Preferred Time</span>
                          <span className="font-medium text-base">{contactData.preferred_contact_time}</span>
                        </div>
                      );
                    }
                    if (contactData.whatsapp_number) {
                      elements.push(
                        <div key="whatsapp_number" className="col-span-2 sm:col-span-1 md:col-span-1 mb-2">
                          <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">WhatsApp Number</span>
                          <span className="font-medium text-base">{contactData.whatsapp_number}</span>
                        </div>
                      );
                    }

                    if (elements.length === 0) {
                      elements.push(
                        <div key="no_data_contact" className="col-span-2 sm:col-span-3 md:col-span-4">
                          <span className="text-muted-foreground italic">Contact details not specified</span>
                        </div>
                      );
                    }

                    return elements;
                  })()}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Availability Accordion */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="availability" className="border rounded-xl px-6 bg-card shadow-sm mt-4 mb-4">
              <AccordionTrigger className="hover:no-underline font-semibold text-lg py-5">
                Availability
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm pb-6 pt-2">
                  {(property as any).availabilityData ? (
                    <>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Available From</span>
                        <span className="font-medium text-base">{(property as any).availabilityData.available_from || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Visit Timing</span>
                        <span className="font-medium text-base">{(property as any).availabilityData.visit_timing || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Open House Date</span>
                        <span className="font-medium text-base">{(property as any).availabilityData.open_house_date || "—"}</span>
                      </div>
                    </>
                  ) : (
                    <div className="sm:col-span-2 md:col-span-3">
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Availability</span>
                      <span className="font-medium text-base text-muted-foreground italic">Not specified</span>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Additional Information Accordion */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="additional_information" className="border rounded-xl px-6 bg-card shadow-sm mt-4 mb-4">
              <AccordionTrigger className="hover:no-underline font-semibold text-lg py-5">
                Additional Information
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm pb-6 pt-2">
                  {(property as any).additionalInformationData ? (
                    <>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">House Rules</span>
                        <span className="font-medium text-base">{(property as any).additionalInformationData.house_rules || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Noise Restrictions</span>
                        <span className="font-medium text-base">{(property as any).additionalInformationData.noise_restrictions || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Visitor Policy</span>
                        <span className="font-medium text-base">{(property as any).additionalInformationData.visitor_policy || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Society Rules</span>
                        <span className="font-medium text-base">{(property as any).additionalInformationData.society_rules || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Pets Policy</span>
                        <span className="font-medium text-base">{(property as any).additionalInformationData.pets_policy || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Smoking Policy</span>
                        <span className="font-medium text-base">{(property as any).additionalInformationData.smoking_policy || "—"}</span>
                      </div>
                      <div className="md:col-span-3">
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Maintenance Instructions</span>
                        <span className="font-medium text-base">{(property as any).additionalInformationData.maintenance_instructions || "—"}</span>
                      </div>
                    </>
                  ) : (
                    <div className="sm:col-span-2 md:col-span-3">
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Additional Information</span>
                      <span className="font-medium text-base text-muted-foreground italic">Not specified</span>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="verification" className="border rounded-xl px-6 bg-card shadow-sm mt-4 mb-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-lg">Verification Status (Admin)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="grid gap-6 sm:grid-cols-2 mt-2">
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Property Verified</span>
                    <span className="font-medium text-base">{(property as any)?.property_verification?.[0]?.property_verified ? "Yes" : "No"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Admin Approval</span>
                    <span className="font-medium text-base">{(property as any)?.property_verification?.[0]?.['admin approval'] || "Pending"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Featured Property</span>
                    <span className="font-medium text-base">{(property as any)?.property_verification?.[0]?.featured_property ? "Yes" : "No"}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </motion.div>
    </motion.div>
  );
}
