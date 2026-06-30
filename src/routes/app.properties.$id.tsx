import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getPropertyById } from "@/core/db/supabase-queries";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { Button } from "@/shared/components/ui/button";
import { ChevronLeft } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/shared/components/ui/accordion";
import { UnifiedProperty } from "./app.properties";

export const Route = createFileRoute("/app/properties/$id")({
  component: PropertyDetailsPage,
});

const ROOM_LABELS = ["Hall View", "Front View", "Bed View", "Kitchen View"] as const;

function PropertyDetailsPage() {
  const { id } = Route.useParams();
  const [property, setProperty] = useState<UnifiedProperty | null>(null);
  const [loading, setLoading] = useState(true);

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
    <div className="space-y-6 pb-12">
      <PageHeader
        title={property.property_name}
        description={`Property ID: #${property.property_id}`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/app/properties">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Properties
            </Link>
          </Button>
        }
      />

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Gallery Section */}
        {parsedImages.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Pictures</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {parsedImages.map((url, idx) => (
                <div
                  key={idx}
                  className="relative group overflow-hidden rounded-xl border border-border aspect-square bg-muted"
                >
                  <img
                    src={url}
                    alt={ROOM_LABELS[idx] ?? `Image ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <span className="text-white text-sm font-medium drop-shadow-md">
                      {ROOM_LABELS[idx] ?? `Image ${idx + 1}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-muted/30 rounded-xl border border-border/50 text-muted-foreground">
            No pictures uploaded for this property.
          </div>
        )}

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
          <Accordion type="multiple" defaultValue={["basic", "location"]} className="w-full space-y-4">
            
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
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Rent Amount</span>
                    <span className="font-medium text-base">
                      {property.rent_amount ? `₹${Number(property.rent_amount).toLocaleString('en-IN')}` : "—"}
                    </span>
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
                  <div className="sm:col-span-2 md:col-span-3">
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Amenities</span>
                    <span className="font-medium text-base">{property.amenities || "—"}</span>
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
