import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — HomeSure" }, { name: "description", content: "Reset your HomeSure password." }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We'll send you a reset link."
      footer={<>Remembered? <Link to="/login" className="font-medium text-primary hover:underline">Back to sign in</Link></>}
    >
      {sent ? (
        <div className="rounded-lg border border-success/20 bg-success/10 p-4 text-sm text-foreground">
          <div className="flex items-center gap-2 font-medium text-success"><MailCheck className="h-4 w-4" /> Check your inbox</div>
          <p className="mt-1.5 text-muted-foreground">If an account exists for {email}, we sent a reset link.</p>
          <Link to="/reset-password" className="mt-3 inline-block text-xs font-medium text-primary hover:underline">Open reset page (demo) →</Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setSent(true); toast.success("Reset link sent"); }}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full">Send reset link</Button>
        </form>
      )}
    </AuthShell>
  );
}
