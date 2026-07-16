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
import { getSystemSettings, updateSystemSettings } from "@/core/api/users.functions";
import { ShieldAlert, Server, Mail, CreditCard, Lock, Sliders, Database, EyeOff, Eye } from "lucide-react";

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
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // System Configuration state
  const [sysSettings, setSysSettings] = useState<any[]>([]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Individual system configs
  const [platformName, setPlatformName] = useState("HomeSure");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [gateway, setGateway] = useState("razorpay");
  const [taxRate, setTaxRate] = useState(18);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [minPasswordLength, setMinPasswordLength] = useState(8);
  const [requireSpecialChar, setRequireSpecialChar] = useState(true);

  // Contractor details states
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
      try {
        const data = await getContractorProfile(contractorId);
        if (data) {
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
        }
      } catch (err) {
        console.error("Error loading contractor details:", err);
      }
    };
    if (s?.role === "contractor") {
      loadContractor();
    }
  }, [s?.role]);

  useEffect(() => {
    if (s?.role === "super_admin") {
      getSystemSettings().then((data) => {
        if (data && data.length > 0) {
          setSysSettings(data);
          
          const general = data.find(x => x.key === "general")?.value || {};
          setPlatformName(general.platformName || "HomeSure");
          setMaintenanceMode(general.maintenanceMode || false);

          const smtp = data.find(x => x.key === "smtp")?.value || {};
          setSmtpHost(smtp.host || "");
          setSmtpPort(Number(smtp.port || 587));
          setSmtpUser(smtp.user || "");
          setSmtpPass(smtp.pass || "");
          setSmtpSecure(smtp.secure !== false);

          const payment = data.find(x => x.key === "payment")?.value || {};
          setGateway(payment.gateway || "razorpay");
          setTaxRate(Number(payment.taxRate || 18));

          const security = data.find(x => x.key === "security")?.value || {};
          setSessionTimeout(Number(security.sessionTimeoutMinutes || 30));
          setMinPasswordLength(Number(security.minPasswordLength || 8));
          setRequireSpecialChar(security.requireSpecialChar !== false);
        }
      });
    }
  }, [s?.role]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const fileName = `${contractorId}-${Date.now()}-${file.name}`;

    try {
      const { error } = await supabase.storage
        .from("contractor-photos")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage
        .from("contractor-photos")
        .getPublicUrl(fileName);

      setProfilePhoto(data.publicUrl);
      toast.success("Photo uploaded successfully!");
    } catch (err: any) {
      toast.error("Failed to upload photo: " + err.message);
    }
  };

  const handlePhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !s?.id) return;

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
      const path = `${s.id}/profile.${ext}`;
      const upload = await supabase.storage
        .from("profile-photos")
        .upload(path, file, { upsert: true, contentType: file.type });

      let photoUrl = "";
      if (!upload.error) {
        const { data: publicUrl } = supabase.storage.from("profile-photos").getPublicUrl(path);
        photoUrl = publicUrl.publicUrl;
        await supabase.from("users").update({ profile_photo: photoUrl }).eq("auth_user_id", s.id);
      } else {
        photoUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
      }

      localStorage.setItem("homesure.profile_photo", photoUrl);
      setProfilePhoto(photoUrl);
      toast.success("Profile photo updated.");
    } catch (err: any) {
      toast.error("Failed to upload photo: " + (err.message || String(err)));
    } finally {
      setIsUploadingPhoto(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Update users table
      const { error } = await supabase
        .from("users")
        .update({
          name,
          email,
          phone,
        })
        .eq("auth_user_id", s?.id);

      if (error) {
        const { error: altError } = await supabase
          .from("users")
          .update({
            name,
            email,
            phone,
          })
          .eq("email", s?.email);

        if (altError) throw altError;
      }

      // 2. Update contractor specific tables if role is contractor
      if (s?.role === "contractor") {
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
      }

      localStorage.setItem("homesure.timezone", timezone);
      if (s) {
        setSession({
          ...s,
          name,
          email,
        });
      }

      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error("Failed to update profile: " + (err.message || String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      
      toast.success("Password changed successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error("Failed to change password: " + (err.message || String(err)));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveSystemConfig = async (key: string, value: any) => {
    setIsSavingSettings(true);
    try {
      await updateSystemSettings({
        data: {
          key,
          value,
          adminEmail: s?.email,
          adminName: s?.name,
          adminRole: s?.role
        }
      });
      toast.success(`System Configuration [${key.toUpperCase()}] updated.`);
    } catch (err: any) {
      toast.error(`Failed to save configuration: ${err.message || String(err)}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePlanChange = (plan: string) => {
    setCurrentPlan(plan);
    localStorage.setItem("homesure.plan", plan);
    setShowPlanDialog(false);
    toast.success(`Plan changed to ${plan}.`);
  };

  const isSuperAdmin = s?.role === "super_admin";

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your profile, workspace and platform system configurations."
      />
      <Tabs defaultValue="profile">
        <TabsList className="bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="system_config" className="flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5" /> System Config</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile">
          {s?.role === "tenant" ? (
            <TenantSettings />
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2 space-y-6">
                <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-slate-800">Profile</CardTitle>
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

                        {s?.role === "contractor" && (
                          <div className="sm:col-span-2 border-t pt-4 mt-2 space-y-4">
                            <h4 className="text-sm font-semibold text-slate-800">Contractor Details</h4>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-1.5">
                                <Label>Company Name</Label>
                                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Contact Person</Label>
                                <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Contractor Type</Label>
                                <Input value={contractorType} onChange={(e) => setContractorType(e.target.value)} />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Service Area</Label>
                                <Input value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Business License</Label>
                                <Input value={businessLicense} onChange={(e) => setBusinessLicense(e.target.value)} />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Hourly Rate (₹)</Label>
                                <Input value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} type="number" />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="sm:col-span-2">
                          <Button type="submit" disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save changes"}
                          </Button>
                        </div>
                      </form>
                    )}
                  </CardContent>
                </Card>

                {/* Password Change Section */}
                <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-slate-800">Change Password</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 max-w-md">
                      <div className="space-y-1.5 relative">
                        <Label htmlFor="new-password">New Password</Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input
                          id="confirm-password"
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          required
                        />
                      </div>
                      <Button type="submit" disabled={isChangingPassword} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {isChangingPassword ? "Updating..." : "Change password"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Account Details Card */}
              <div>
                <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-slate-800">Account details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-slate-500">Role</span>
                        <span className="font-medium text-slate-800 capitalize">{(s?.role || "user").replace("_", " ")}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-slate-500">Status</span>
                        <span className="font-medium text-emerald-600">Active</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-slate-500">App Version</span>
                        <span className="font-medium text-slate-700">v1.2.0</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-500 text-xs">User ID</span>
                        <span className="font-mono text-[10px] bg-slate-50 p-1.5 rounded text-slate-600 break-all">{s?.id || "Unavailable"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
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

        {isSuperAdmin && (
          <TabsContent value="system_config">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1 space-y-2">
                <Card className="border border-slate-200 shadow-sm bg-white p-3 rounded-xl">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Config Modules</div>
                  <div className="flex flex-col gap-1">
                    <button className="flex items-center gap-2 p-2 rounded-lg text-left text-sm font-medium text-slate-700 bg-slate-50 border border-slate-100 hover:bg-slate-100"><Sliders className="h-4 w-4" /> General Settings</button>
                    <button className="flex items-center gap-2 p-2 rounded-lg text-left text-sm font-medium text-slate-600 hover:bg-slate-50"><Mail className="h-4 w-4" /> SMTP Settings</button>
                    <button className="flex items-center gap-2 p-2 rounded-lg text-left text-sm font-medium text-slate-600 hover:bg-slate-50"><CreditCard className="h-4 w-4" /> Payment Settings</button>
                    <button className="flex items-center gap-2 p-2 rounded-lg text-left text-sm font-medium text-slate-600 hover:bg-slate-50"><Lock className="h-4 w-4" /> Security Policies</button>
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-6">
                {/* General Settings */}
                <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
                  <CardHeader className="flex flex-row items-center gap-2">
                    <Server className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-sm font-semibold text-slate-800">General Settings & Platform Branding</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="platform-name">Platform Name</Label>
                      <Input id="platform-name" value={platformName} onChange={(e) => setPlatformName(e.target.value)} />
                    </div>
                    <div className="flex items-center justify-between border-t pt-4 mt-2">
                      <div>
                        <Label htmlFor="maintenance-mode" className="font-semibold">Maintenance Mode</Label>
                        <p className="text-xs text-muted-foreground">Block non-admin users from accessing platform dashboards.</p>
                      </div>
                      <Switch id="maintenance-mode" checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                    </div>
                    <Button disabled={isSavingSettings} onClick={() => handleSaveSystemConfig("general", { platformName, maintenanceMode })} className="w-fit mt-2">
                      Save General Config
                    </Button>
                  </CardContent>
                </Card>

                {/* SMTP Email Settings */}
                <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
                  <CardHeader className="flex flex-row items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-sm font-semibold text-slate-800">SMTP Settings (Email Templates & Dispatch)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="smtp-host">SMTP Host</Label>
                        <Input id="smtp-host" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="smtp-port">SMTP Port</Label>
                        <Input id="smtp-port" type="number" value={smtpPort} onChange={(e) => setSmtpPort(Number(e.target.value))} placeholder="587" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="smtp-user">SMTP Username</Label>
                      <Input id="smtp-user" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="user@gmail.com" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="smtp-pass">SMTP Password</Label>
                      <Input id="smtp-pass" type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} placeholder="••••••••••••••" />
                    </div>
                    <div className="flex items-center justify-between border-t pt-4">
                      <div>
                        <Label htmlFor="smtp-secure">Force TLS Encryption</Label>
                        <p className="text-xs text-muted-foreground">Always encrypt connection with TLS protocol.</p>
                      </div>
                      <Switch id="smtp-secure" checked={smtpSecure} onCheckedChange={setSmtpSecure} />
                    </div>
                    <Button disabled={isSavingSettings} onClick={() => handleSaveSystemConfig("smtp", { host: smtpHost, port: smtpPort, user: smtpUser, pass: smtpPass, secure: smtpSecure })} className="w-fit">
                      Save SMTP Settings
                    </Button>
                  </CardContent>
                </Card>

                {/* Payment Gateway Settings */}
                <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
                  <CardHeader className="flex flex-row items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-sm font-semibold text-slate-800">Payment Gateway Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Active Gateway</Label>
                      <Input value="Razorpay" disabled className="bg-slate-50 text-slate-500" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="tax-rate">Platform Tax Rate (%)</Label>
                      <Input id="tax-rate" type="number" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} />
                    </div>
                    <Button disabled={isSavingSettings} onClick={() => handleSaveSystemConfig("payment", { gateway, taxRate })} className="w-fit">
                      Save Payment Settings
                    </Button>
                  </CardContent>
                </Card>

                {/* Security Policies */}
                <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
                  <CardHeader className="flex flex-row items-center gap-2">
                    <Lock className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-sm font-semibold text-slate-800">Security Settings & Password Policies</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="min-pwd">Min Password Length</Label>
                        <Input id="min-pwd" type="number" value={minPasswordLength} onChange={(e) => setMinPasswordLength(Number(e.target.value))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                        <Input id="session-timeout" type="number" value={sessionTimeout} onChange={(e) => setSessionTimeout(Number(e.target.value))} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t pt-4">
                      <div>
                        <Label htmlFor="pwd-char">Require Special Character</Label>
                        <p className="text-xs text-muted-foreground">Force passwords to contain symbols.</p>
                      </div>
                      <Switch id="pwd-char" checked={requireSpecialChar} onCheckedChange={setRequireSpecialChar} />
                    </div>
                    <Button disabled={isSavingSettings} onClick={() => handleSaveSystemConfig("security", { minPasswordLength, sessionTimeoutMinutes: sessionTimeout, requireSpecialChar })} className="w-fit">
                      Save Security Policies
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        )}
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
