import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { resetAccountPassword } from "@/core/api/auth.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || "",
  }),
  head: () => ({
    meta: [
      { title: "Reset password — HomeSure" },
      { name: "description", content: "Choose a new password." },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const nav = useNavigate();
  const { token } = Route.useSearch();
  const [pw, setPw] = useState("");
  const [c, setC] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Reset link is invalid or missing.");
      return;
    }

    if (pw !== c) {
      toast.error("Passwords don't match");
      return;
    }

    setIsLoading(true);

    try {
      await resetAccountPassword({ data: { token, password: pw } });
      toast.success("Password updated successfully");
      nav({ to: "/login" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reset password.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell
        title="Invalid reset link"
        subtitle="This password reset link is missing or expired."
        footer={
          <Link to="/forgot-password" className="font-medium text-primary hover:underline">
            Request a new reset link
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground">
          Please request a new password reset email and try again.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Use at least 8 characters with a mix of letters and numbers."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-1.5">
          <Label htmlFor="pw">New password</Label>
          <Input
            id="pw"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c">Confirm password</Label>
          <Input
            id="c"
            type="password"
            value={c}
            onChange={(e) => setC(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Updating..." : "Update password"}
        </Button>
      </form>
    </AuthShell>
  );
}
