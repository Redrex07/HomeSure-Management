import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { setSession } from "@/features/auth/store/auth-store";
import { ROLE_BY_ID } from "@/features/auth/utils/roles";
import { supabase } from "@/core/db/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — HomeSure" },
      { name: "description", content: "Sign in to your HomeSure account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      const authUser = data.user;
      if (!authUser) {
        toast.error("No authenticated user returned.");
        setIsLoading(false);
        return;
      }

      if (!authUser.email_confirmed_at) {
        await supabase.auth.signOut();
        toast.error("Please confirm your email before signing in.");
        nav({ to: "/verify-email", search: { email } });
        setIsLoading(false);
        return;
      }

      const { data: userProfiles, error: userError } = await supabase
        .from("users")
        .select("name, role_id, status")
        .eq("auth_user_id", authUser.id)
        .limit(1);

      if (userError || !userProfiles || userProfiles.length === 0) {
        toast.error("User profile data not found in database.");
        setIsLoading(false);
        return;
      }

      const userData = userProfiles[0];
      const role = ROLE_BY_ID[userData.role_id];

      if (!role) {
        toast.error("Invalid role configuration.");
        setIsLoading(false);
        return;
      }

      // Activate profile if email is confirmed but status is still Pending
      let status = userData.status as "Active" | "Pending" | "Declined" | "Invited";
      if (status === "Pending" && authUser.email_confirmed_at) {
        await supabase
          .from("users")
          .update({ status: "Active" })
          .eq("auth_user_id", authUser.id);
        status = "Active";
      }

      setSession({
        id: authUser.id,
        name: userData.name,
        email: email,
        role: role,
        status: status,
      });

      toast.success(`Welcome back, signing in as ${userData.name}`);
      nav({ to: "/app/dashboard" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your HomeSure workspace."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="pw">Password</Label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot?
            </Link>
          </div>
          <Input
            id="pw"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
