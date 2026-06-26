import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { Button } from "@/shared/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/core/db/supabase";
import { setSession } from "@/features/auth/store/auth-store";
import { ROLE_BY_ID } from "@/features/auth/utils/roles";

export const Route = createFileRoute("/auth/confirm")({
  head: () => ({
    meta: [
      { title: "Confirming email — HomeSure" },
      { name: "description", content: "Confirm your HomeSure account email." },
    ],
  }),
  component: AuthConfirmPage,
});

function AuthConfirmPage() {
  const nav = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function confirmEmail() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            if (!cancelled) {
              setStatus("error");
              setErrorMessage(exchangeError.message);
            }
            return;
          }
        }

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          if (!cancelled) {
            setStatus("error");
            setErrorMessage(sessionError.message);
          }
          return;
        }

        const authUser = sessionData.session?.user;
        if (!authUser?.email_confirmed_at) {
          if (!cancelled) {
            setStatus("error");
            setErrorMessage(
              "Email confirmation failed or the link has expired. Please try signing up again or request a new confirmation email."
            );
          }
          return;
        }

        await supabase
          .from("users")
          .update({ status: "Active" })
          .eq("auth_user_id", authUser.id);

        const { data: userProfiles, error: userError } = await supabase
          .from("users")
          .select("name, role_id, status")
          .eq("auth_user_id", authUser.id)
          .limit(1);

        if (userError || !userProfiles?.length) {
          if (!cancelled) {
            setStatus("error");
            setErrorMessage("Account confirmed but profile data was not found. Please contact support.");
          }
          return;
        }

        const userData = userProfiles[0];
        const role = ROLE_BY_ID[userData.role_id];

        if (!role) {
          if (!cancelled) {
            setStatus("error");
            setErrorMessage("Invalid role configuration. Please contact support.");
          }
          return;
        }

        setSession({
          email: authUser.email || "",
          name: userData.name,
          role,
          status: "Active",
        });

        if (!cancelled) {
          setStatus("success");
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
        }
      }
    }

    confirmEmail();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <AuthShell title="Confirming your email" subtitle="Please wait while we verify your account.">
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
        title="Confirmation failed"
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
            <Link to="/verify-email">Request a new confirmation email</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Email confirmed!"
      subtitle="Your account is now active. Welcome to HomeSure."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-success/20 bg-success/10 p-4 text-sm">
          <div className="flex items-center gap-2 font-medium text-success">
            <CheckCircle2 className="h-4 w-4" /> Your email has been verified
          </div>
          <p className="mt-2 text-muted-foreground">
            You can now sign in with your email and password.
          </p>
        </div>
        <Button className="w-full" onClick={() => nav({ to: "/app/dashboard" })}>
          Go to dashboard
        </Button>
      </div>
    </AuthShell>
  );
}
