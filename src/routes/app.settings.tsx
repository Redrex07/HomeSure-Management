import { useRef, useState, useEffect } from "react";
import { supabase } from "@/core/db/supabase";
import { getContractorProfile } from "@/core/db/supabase-queries";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { useSession, setSession } from "@/features/auth/store/auth-store";
import { toast } from "sonner";
import { TenantSettings } from "@/features/tenant/components/TenantSettings";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings — HomeSure" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const s = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [currentPlan, setCurrentPlan] = useState("Pro");
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contractorType, setContractorType] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [experience, setExperience] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [certification, setCertification] = useState("");
  const [availableDays, setAvailableDays] = useState("");
  const [availableTime, setAvailableTime] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [chargeType, setChargeType] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [businessLicense, setBusinessLicense] = useState("");
  const [emergencyService, setEmergencyService] = useState(false);
  const contractorId = 3001;
  const [contractor, setContractor] = useState<any>(null);

  useEffect(() => {
    if (s?.id) {
      const loadProfile = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from("users")
            .select("name, email, phone, profile_photo")
            .eq("auth_user_id", s.id)
            .single();

          if (error) {
            const { data: altData } = await supabase
              .from("users")
              .select("name, email, phone, profile_photo")
              .eq("email", s.email)
              
              .single();

            if (altData) {
              setName(altData.name || "");
              setEmail(altData.email || "");
              setPhone(altData.phone || "");
              setProfilePhoto(altData.profile_photo || localStorage.getItem("homesure.profile_photo") || "");
            }
          } else if (data) {
            setName(data.name || "");
            setEmail(data.email || "");
            setPhone(data.phone || "");
            setProfilePhoto(data.profile_photo || localStorage.getItem("homesure.profile_photo") || "");
          }

          const savedTz = localStorage.getItem("homesure.timezone");
          if (savedTz) {
            setTimezone(savedTz);
          }
          const savedPlan = localStorage.getItem("homesure.plan");
          if (savedPlan) {
            setCurrentPlan(savedPlan);
          }
        } catch (err) {
          console.error("Error loading profile details:", err);
        } finally {
          setIsLoading(false);
        }
      };
      loadProfile();
    }
  }, [s?.id, s?.email]);
useEffect(() => {
  const loadContractor = async () => {
    const data = await getContractorProfile(contractorId);

    setContractor(data);

    setCompanyName(data.company_name || "");
    setContactPerson(data.contact_person || "");
    setContractorType(data.contractor_type || "");
    setServiceArea(data.service_area || "");
    setExperience(String(data.years_of_experience || ""));
    setSpecialization(data.specialization || "");
    setCertification(data.certification || "");
    setAvailableDays(data.available_days || "");
    setAvailableTime(data.available_time || "");
    setHourlyRate(String(data.hourly_rate || ""));
    setChargeType(data.service_charge_type || "");
    setEmergencyService(data.emergency_service || false);
    setBusinessLicense(data.business_license || "");
    setProfilePhoto(data.profile_photo || "");
setCreatedAt(data.created_at || "");
setUpdatedAt(data.updated_at || "");
  };

  loadContractor();
}, []);
const handlePhotoUpload = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  if (!e.target.files?.length) return;

  const file = e.target.files[0];

  const fileName = `${contractorId}-${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("contractor-photos")
    .upload(fileName, file, {
      upsert: true,
    });

  if (error) {
    toast.error(error.message);
    return;
  }

  const { data } = supabase.storage
    .from("contractor-photos")
    .getPublicUrl(fileName);

  setProfilePhoto(data.publicUrl);

  toast.success("Photo uploaded");
};
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSaving(true);

  try {
    // Update users table
    await supabase
      .from("users")
      .update({
        name,
        email,
        phone,
      })
      .eq("auth_user_id", s?.id);

    // Update Contractor table
   await supabase
  .from("Contractor")
  .update({
    company_name: companyName,
    contact_person: contactPerson,
    email,
    mobile_number: phone,
    contractor_type: contractorType,
    service_area: serviceArea,
    business_license: businessLicense,
    profile_photo: profilePhoto,
  })
  .eq("contractor_id", contractorId);

    // Update ContractorProfile table
    await supabase
      .from("ContractorProfile")
      .update({
        years_of_experience: Number(experience),
        specialization,
        certification,
        available_days: availableDays,
        available_time: availableTime,
        hourly_rate: Number(hourlyRate),
        service_charge_type: chargeType,
        emergency_service: emergencyService,
      })
      .eq("contractor_id", contractorId);

      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error("Failed to update profile: " + (err.message || String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlanChange = (plan: string) => {
    setCurrentPlan(plan);
    localStorage.setItem("homesure.plan", plan);
    setShowPlanDialog(false);
    toast.success(`Plan changed to ${plan}.`);
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your profile, workspace and notifications."
      />
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          {s?.role === "tenant" ? (
            <TenantSettings />
          ) : (
            <Card className="border-border/70 shadow-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    {profilePhoto && <AvatarImage src={profilePhoto} alt={name || "Profile photo"} />}
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {name ? name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : "US"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={handlePhotoSelected}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                    >
                      {isUploadingPhoto ? "Uploading..." : "Upload photo"}
                    </Button>
                    <div className="mt-1 text-xs text-muted-foreground">PNG or JPG, max 2MB.</div>
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="flex h-48 items-center justify-center">
                    <p className="text-xs text-muted-foreground animate-pulse">Loading profile...</p>
                  </div>
                ) : (
                  <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
                    <div className="space-y-1.5">
                      <Label>Full name</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-0100" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Timezone</Label>
                      <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save changes"}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="workspace">
          <Card className="border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Workspace</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Workspace name</Label>
                <Input defaultValue="Ortiz Holdings" />
              </div>
              <div className="space-y-1.5">
                <Label>Region</Label>
                <Input defaultValue="United States" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card className="border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {[
                "New service requests",
                "Invoice paid / overdue",
                "Lease renewals (90d)",
                "Weekly summary email",
              ].map((label) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="text-sm">{label}</div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="billing">
          <Card className="border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Current plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary-soft p-4">
                <div>
                  <div className="text-base font-semibold">Pro · ₹149/month</div>
                  <div className="text-xs text-muted-foreground">Renews July 1, 2026</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowPlanDialog(true)}>
                  Change plan
                </Button>
              </div>
            </CardContent>
            
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change plan</DialogTitle>
            <DialogDescription>Current plan: {currentPlan}. Select a new plan for your HomeSure workspace.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {[
              { name: "Starter", price: "INR 49/month" },
              { name: "Pro", price: "INR 149/month" },
              { name: "Enterprise", price: "Custom" },
            ].map((plan) => (
              <button
                key={plan.name}
                type="button"
                onClick={() => handlePlanChange(plan.name)}
                className="flex items-center justify-between rounded-lg border border-border p-3 text-left hover:bg-muted"
              >
                <span className="font-medium">{plan.name}</span>
                <span className="text-sm text-muted-foreground">{plan.price}</span>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
