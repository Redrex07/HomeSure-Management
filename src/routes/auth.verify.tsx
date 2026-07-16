import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { Button } from "@/shared/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { verifyEmailAddress } from "@/core/api/auth.functions";

export const Route = createFileRoute("/auth/verify")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || "",
  }),
  head: () => ({
    meta: [
      { title: "Verify email — HomeSure" },
      { name: "description", content: "Verify your HomeSure account email." },
    ],
  }),
  component: AuthVerifyPage,
});

function AuthVerifyPage() {
  const { token } = Route.useSearch();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Verification link is missing or invalid.");
      return;
    }

    let cancelled = false;

    verifyEmailAddress({ data: { token } })
      .then(() => {
        if (!cancelled) setStatus("success");
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(err.message || "Verification failed.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === "loading") {
    return (
      <AuthShell title="Verifying your email" subtitle="Please wait while we confirm your account.">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying your email address...</p>
        </div>
      </AuthShell>
    );
  }

  if (status === "error") {
    return (
      <AuthShell
        title="Verification failed"
        subtitle="We couldn't verify your email address."
        footer={
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm">
            <div className="flex items-center gap-2 font-medium text-destructive">
              <XCircle className="h-4 w-4" /> Verification failed
            </div>
            <p className="mt-2 text-muted-foreground">{errorMessage}</p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link to="/verify-email" search={(prev: any) => prev}>Request a new confirmation email</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Email verified!"
      subtitle="Your account is now active. Welcome to HomeSure."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      }
    >
      <div className="rounded-lg border border-success/20 bg-success/10 p-4 text-sm">
        <div className="flex items-center gap-2 font-medium text-success">
          <CheckCircle2 className="h-4 w-4" /> Your email has been verified
        </div>
        <p className="mt-2 text-muted-foreground">
          A welcome email has been sent. You can now sign in with your email and password.
        </p>
      </div>
    </AuthShell>
  );
}
