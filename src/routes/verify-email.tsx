import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { Button } from "@/shared/components/ui/button";
import { MailCheck } from "lucide-react";
import { supabase } from "@/core/db/supabase";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: (search.email as string) || "",
  }),
  head: () => ({
    meta: [
      { title: "Verify your email — HomeSure" },
      { name: "description", content: "Confirm your email to access HomeSure." },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email } = useSearch({ from: "/verify-email" });
  const [isResending, setIsResending] = useState(false);

  const resend = async () => {
    if (!email) {
      toast.error("No email address found. Please sign up again.");
      return;
    }
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Confirmation email sent. Please check your inbox.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to resend email.";
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthShell
      title="Check your email"
      subtitle="We sent a confirmation link to complete your registration."
      footer={
        <>
          Already confirmed?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
          <div className="flex items-center gap-2 font-medium text-primary">
            <MailCheck className="h-4 w-4" /> Verify your email address
          </div>
          <p className="mt-2 text-muted-foreground">
            {email
              ? `We sent a confirmation link to ${email}. Open your email, click the link to confirm, then return here and sign in.`
              : "We sent a confirmation link to your email. Click the link to confirm, then return and sign in."}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            After clicking the email link, you can close that tab and sign in on this site.
          </p>
        </div>
        {email && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isResending}
            onClick={resend}
          >
            {isResending ? "Sending..." : "Resend confirmation email"}
          </Button>
        )}
      </div>
    </AuthShell>
  );
}
