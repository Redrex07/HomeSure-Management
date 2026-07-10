import { useRef, useState, useEffect } from "react";
import { supabase } from "@/core/db/supabase";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!s?.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          name,
          email,
          phone,
        })
        .eq("auth_user_id", s.id);

      if (error) {
        const { error: altError } = await supabase
          .from("users")
          .update({
            name,
            email,
            phone,
          })
          .eq("email", s.email);

        if (altError) throw altError;
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
