import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
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
  const [pw, setPw] = useState("");
  const [c, setC] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== c) return toast.error("Passwords don't match");
    toast.success("Password updated");
    nav({ to: "/login" });
  };

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
        <Button type="submit" className="w-full">
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}
