import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { requestPasswordReset } from "@/core/api/auth.functions";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — HomeSure" },
      { name: "description", content: "Reset your HomeSure password." },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await requestPasswordReset({ data: { email } });
      setSent(true);
      toast.success("If an account exists, a reset link has been sent.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send reset email.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We'll send you a reset link."
      footer={
        <>
          Remembered?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="rounded-lg border border-success/20 bg-success/10 p-4 text-sm text-foreground">
          <div className="flex items-center gap-2 font-medium text-success">
            <MailCheck className="h-4 w-4" /> Check your inbox
          </div>
          <p className="mt-1.5 text-muted-foreground">
            If an account exists for {email}, we sent a password reset link.
          </p>
        </div>
      ) : (
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
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
