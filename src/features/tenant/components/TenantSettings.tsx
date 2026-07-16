import { useRef, useState, useEffect } from "react";
import { supabase } from "@/core/db/supabase";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { useSession, setSession } from "@/features/auth/store/auth-store";
import { toast } from "sonner";
import { Textarea } from "@/shared/components/ui/textarea";

export function TenantSettings() {
  const s = useSession();
  
  // Tenant Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [accountStatus, setAccountStatus] = useState("Active");
  const [createdAt, setCreatedAt] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  // TenantProfile Fields
  const [occupation, setOccupation] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [nationality, setNationality] = useState("");
  const [preferredCity, setPreferredCity] = useState("");
  const [preferredLocality, setPreferredLocality] = useState("");
  const [preferredPropertyType, setPreferredPropertyType] = useState("");
  const [preferredBudget, setPreferredBudget] = useState("");
  const [preferredBhk, setPreferredBhk] = useState("");
  const [familyMembers, setFamilyMembers] = useState("");
  const [pets, setPets] = useState("");
  const [smoking, setSmoking] = useState("");
  const [drinking, setDrinking] = useState("");
  const [bio, setBio] = useState("");

  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (s?.email) {
      const loadProfile = async () => {
        setIsLoading(true);
        try {
          // Load Tenant
          const { data: tenantData, error: tenantError } = await supabase
            .from("tenant")
            .select("*")
            .eq("email", s.email)
            .single();

          if (tenantData) {
            setFirstName(tenantData.first_name || "");
            setLastName(tenantData.last_name || "");
            setEmail(tenantData.email || s.email);
            setMobileNumber(tenantData.mobile_number || "");
            setGender(tenantData.gender || "");
            setDateOfBirth(tenantData.date_of_birth || "");
            setProfilePhoto(tenantData.profile_photo || localStorage.getItem("homesure.tenant_profile_photo") || "");
            setAccountStatus(tenantData.account_status || "Active");
            setCreatedAt(tenantData.created_at || "");
            setUpdatedAt(tenantData.updated_at || "");

            // Load TenantProfile
            const { data: profileData } = await supabase
              .from("tenant_profile")
              .select("*")
              .eq("tenant_id", tenantData.tenant_id)
              .single();

            if (profileData) {
              setOccupation(profileData.occupation || "");
              setCompanyName(profileData.company_name || "");
              setAnnualIncome(profileData.annual_income?.toString() || "");
              setMaritalStatus(profileData.marital_status || "");
              setNationality(profileData.nationality || "");
              setPreferredCity(profileData.preferred_city || "");
              setPreferredLocality(profileData.preferred_locality || "");
              setPreferredPropertyType(profileData.preferred_property_type || "");
              setPreferredBudget(profileData.preferred_budget?.toString() || "");
              setPreferredBhk(profileData.preferred_bhk || "");
              setFamilyMembers(profileData.family_members?.toString() || "");
              setPets(profileData.pets || "");
              setSmoking(profileData.smoking || "");
              setDrinking(profileData.drinking || "");
              setBio(profileData.bio || "");
            }
          } else {
             setEmail(s.email);
          }
        } catch (err) {
          console.error("Error loading tenant details:", err);
        } finally {
          setIsLoading(false);
        }
      };
      loadProfile();
    }
  }, [s?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!s?.email) return;
    setIsSaving(true);
    try {
      // Get tenant to find tenant_id
      const { data: tenantData } = await supabase
        .from("tenant")
        .select("tenant_id")
        .eq("email", s.email)
        .maybeSingle();
      
      let tenantId = tenantData?.tenant_id;

      if (password) {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
      }

      const tenantPayload = {
        first_name: firstName,
        last_name: lastName,
        mobile_number: mobileNumber,
        gender,
        date_of_birth: dateOfBirth || null,
        updated_at: new Date().toISOString(),
      };

      if (tenantId) {
        const { error: tError } = await supabase.from("tenant").update(tenantPayload).eq("tenant_id", tenantId);
        if (tError) throw tError;
      } else {
        const { data: newTenant, error: tError } = await supabase.from("tenant").insert([{
          email: s.email,
          ...tenantPayload
        }]).select().single();
        if (tError) throw tError;
        tenantId = newTenant.tenant_id;
      }

      if (tenantId) {
        const profilePayload = {
          occupation,
          company_name: companyName,
          annual_income: annualIncome ? Number(annualIncome) : null,
          marital_status: maritalStatus,
          nationality,
          preferred_city: preferredCity,
          preferred_locality: preferredLocality,
          preferred_property_type: preferredPropertyType,
          preferred_budget: preferredBudget ? Number(preferredBudget) : null,
          preferred_bhk: preferredBhk,
          family_members: familyMembers ? Number(familyMembers) : null,
          pets,
          smoking,
          drinking,
          bio,
        };

        const { data: existProfile } = await supabase.from("tenant_profile").select("profile_id").eq("tenant_id", tenantId).maybeSingle();
        if (existProfile) {
          const { error: pError } = await supabase.from("tenant_profile").update(profilePayload).eq("tenant_id", tenantId);
          if (pError) throw pError;
        } else {
          const { error: pError } = await supabase.from("tenant_profile").insert([{ tenant_id: tenantId, ...profilePayload }]);
          if (pError) throw pError;
        }
      }

      if (s) {
         setSession({
           ...s,
           name: firstName + (lastName ? " " + lastName : ""),
         });
      }

      toast.success("Profile updated successfully!");
      setPassword("");
    } catch (err: any) {
      toast.error("Failed to update profile: " + (err.message || String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !s?.email) return;

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      toast.error("Please upload a PNG or JPG image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Profile photo must be 2MB or smaller.");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const ext = file.type === "image/png" ? "png" : "jpg";
      const path = `tenant_${s.id || s.email}/profile.${ext}`;
      const upload = await supabase.storage
        .from("profile-photos")
        .upload(path, file, { upsert: true, contentType: file.type });

      let photoUrl = "";
      if (!upload.error) {
        const { data: publicUrl } = supabase.storage.from("profile-photos").getPublicUrl(path);
        photoUrl = publicUrl.publicUrl;
        await supabase.from("tenant").update({ profile_photo: photoUrl }).eq("email", s.email);
      } else {
        photoUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
      }

      localStorage.setItem("homesure.tenant_profile_photo", photoUrl);
      setProfilePhoto(photoUrl);
      toast.success("Profile photo updated.");
    } catch (err: any) {
      toast.error("Failed to upload photo: " + (err.message || String(err)));
    } finally {
      setIsUploadingPhoto(false);
      event.target.value = "";
    }
  };

  if (isLoading) {
    return <div className="flex h-48 items-center justify-center animate-pulse">Loading profile...</div>;
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Card className="border-border/70 shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Personal Information</CardTitle>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
               Status: <span className="font-semibold text-foreground">{accountStatus}</span>
               {createdAt && <span>| Joined: {new Date(createdAt).toLocaleDateString()}</span>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              {profilePhoto && <AvatarImage src={profilePhoto} alt="Profile photo" />}
              <AvatarFallback className="bg-primary text-primary-foreground">
                {firstName ? firstName[0].toUpperCase() : "T"}
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
                type="button"
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>First name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Last name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} disabled />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile number</Label>
              <Input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Input value={gender} onChange={(e) => setGender(e.target.value)} placeholder="Male, Female, Other" />
            </div>
            <div className="space-y-1.5">
              <Label>Date of birth</Label>
              <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>New Password (leave blank to keep current)</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Tenant Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Occupation</Label>
              <Input value={occupation} onChange={(e) => setOccupation(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Company name</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Annual income</Label>
              <Input type="number" value={annualIncome} onChange={(e) => setAnnualIncome(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Marital status</Label>
              <Input value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Nationality</Label>
              <Input value={nationality} onChange={(e) => setNationality(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Family members</Label>
              <Input type="number" value={familyMembers} onChange={(e) => setFamilyMembers(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Pets</Label>
              <Input value={pets} onChange={(e) => setPets(e.target.value)} placeholder="Yes / No (Specify)" />
            </div>
            <div className="space-y-1.5">
              <Label>Smoking</Label>
              <Input value={smoking} onChange={(e) => setSmoking(e.target.value)} placeholder="Yes / No" />
            </div>
            <div className="space-y-1.5">
              <Label>Drinking</Label>
              <Input value={drinking} onChange={(e) => setDrinking(e.target.value)} placeholder="Yes / No" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Preferred city</Label>
              <Input value={preferredCity} onChange={(e) => setPreferredCity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Preferred locality</Label>
              <Input value={preferredLocality} onChange={(e) => setPreferredLocality(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Preferred property type</Label>
              <Input value={preferredPropertyType} onChange={(e) => setPreferredPropertyType(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Preferred budget</Label>
              <Input type="number" value={preferredBudget} onChange={(e) => setPreferredBudget(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Preferred BHK</Label>
              <Input value={preferredBhk} onChange={(e) => setPreferredBhk(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
