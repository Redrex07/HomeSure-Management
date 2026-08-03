import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { Card } from "@/shared/components/ui/card";
import { Heart, ChevronRight, Home, MapPin, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "@/features/auth/store/auth-store";
import { getAllProperties, getFavoriteProperties, removeFavoriteProperty } from "@/core/db/supabase-queries";
import { toast } from "sonner";
import { useTenantContext } from "@/features/tenant/hooks/useTenantContext";
import { formatINR } from "@/shared/utils/utils";
import { Input } from "@/shared/components/ui/input";

export const Route = createFileRoute("/app/favorite-properties")({
  head: () => ({ meta: [{ title: "Favorite Properties — HomeSure" }] }),
  component: FavoritePropertiesPage,
});

function FavoritePropertiesPage() {
  const session = useSession();
  const tenantContext = useTenantContext();
  const tenantId = tenantContext.tenantId;

  const [properties, setProperties] = useState<any[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [allProps, favs] = await Promise.all([
        getAllProperties(),
        getFavoriteProperties(tenantId)
      ]);
      setProperties(allProps || []);
      setFavoriteIds(favs.map((f: any) => Number(f.property_id)));
    } catch (err: any) {
      toast.error("Error loading favorite properties: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchData();
    }
  }, [tenantId]);

  const handleRemoveFavorite = async (propertyId: number) => {
    if (!tenantId) return;
    try {
      await removeFavoriteProperty({ tenant_id: tenantId, property_id: propertyId });
      setFavoriteIds(favoriteIds.filter(id => id !== propertyId));
      toast.success("Removed from favorites");
    } catch (err: any) {
      toast.error("Failed to remove favorite: " + err.message);
    }
  };

  const getPropertyNumericId = (p: any) => {
    if (p.property_id && typeof p.property_id === "number") return p.property_id;
    if (p.id) return Number(p.id);
    return 0;
  };

  const formatUsd = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  const getRent = (p: any) => {
    const r = p.property_rent_details?.[0] || p.property_rent_details;
    if (r?.expected_rent) return formatUsd.format(Number(r.expected_rent));
    return "$0";
  };

  const favoriteProps = properties.filter(p => favoriteIds.includes(getPropertyNumericId(p)));
  const filteredProps = favoriteProps.filter(p => {
    if (!search) return true;
    const name = p.property_name?.toLowerCase() || "";
    const city = p.city?.toLowerCase() || "";
    const q = search.toLowerCase();
    return name.includes(q) || city.includes(q);
  });

  if (!tenantId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Please complete your tenant profile to view favorites.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 overflow-x-hidden">
      <PageHeader
        title="Favorite Properties"
        description="Properties you've saved for later."
      />

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search favorites by name or city..." 
            className="pl-9 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <span className="text-muted-foreground">Loading favorites...</span>
        </div>
      ) : filteredProps.length === 0 ? (
        <div className="text-center p-12 bg-card rounded-xl border border-dashed border-border/60">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-3" />
          <h3 className="text-lg font-medium text-foreground">No favorite properties found</h3>
          <p className="text-muted-foreground mt-1 max-w-md mx-auto">
            {search ? "No properties match your search." : "You haven't saved any properties yet."}
          </p>
          {!search && (
            <Button asChild className="mt-4" variant="outline">
              <Link to="/app/properties">Browse Properties</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProps.map(p => {
            const numId = getPropertyNumericId(p);
            const coverImage = p.property_documents?.[0]?.images?.[0] || p.property_documents?.images?.[0] || null;
            return (
              <Card key={numId} className="overflow-hidden flex flex-col group/card hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
                <div className="relative h-48 w-full overflow-hidden bg-muted">
                  {coverImage ? (
                    <img src={coverImage} alt={p.property_name} className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-muted-foreground bg-primary/5">
                      <Home className="h-10 w-10 opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 z-10">
                    <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-sm" onClick={() => handleRemoveFavorite(numId)}>
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold bg-primary text-primary-foreground shadow-sm">
                      {getRent(p)}/mo
                    </div>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-lg line-clamp-1 mb-1">{p.property_name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-3 line-clamp-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    {p.locality ? `${p.locality}, ` : ""}{p.city}
                  </p>
                  <Button className="w-full mt-auto" variant="outline" asChild>
                    <Link to="/app/property/$id" params={{ id: String(numId) }}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
