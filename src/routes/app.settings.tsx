import { useState, useEffect } from "react";
import { supabase } from "@/core/db/supabase";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (s?.id) {
      const loadProfile = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from("users")
            .select("name, email, phone")
            .eq("auth_user_id", s.id)
            .single();

          if (error) {
            const { data: altData } = await supabase
              .from("users")
              .select("name, email, phone")
              .eq("email", s.email)
              .single();

            if (altData) {
              setName(altData.name || "");
              setEmail(altData.email || "");
              setPhone(altData.phone || "");
            }
          } else if (data) {
            setName(data.name || "");
            setEmail(data.email || "");
            setPhone(data.phone || "");
          }

          const savedTz = localStorage.getItem("homesure.timezone");
          if (savedTz) {
            setTimezone(savedTz);
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
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {name ? name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : "US"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    Upload photo
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
                <Button variant="outline" size="sm">
                  Change plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
