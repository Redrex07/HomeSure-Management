import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { ROLE_LABELS, type Role } from "@/features/auth/utils/roles";
import { registerAccount, getInviteDetails } from "@/core/api/auth.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>) => ({
    invite: (search.invite as string) || "",
  }),
  head: () => ({
    meta: [
      { title: "Create your account — HomeSure" },
      { name: "description", content: "Start your 14-day free trial." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const nav = useNavigate();
  const { invite } = useSearch({ from: "/signup" });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [role, setRole] = useState<Role>("landlord");
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLocked, setInviteLocked] = useState(false);

  useEffect(() => {
    if (!invite) return;

    getInviteDetails({ data: { token: invite } })
      .then((details) => {
        setName(details.name);
        setEmail(details.email);
        setRole(details.role);
        setInviteLocked(true);
      })
      .catch((err: Error) => {
        toast.error(err.message || "Invalid invitation link.");
      });
  }, [invite]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await registerAccount({
        data: {
          email,
          password: pw,
          name,
          role,
          inviteToken: invite || undefined,
        },
      });

      if (result.needsVerification) {
        toast.success("Account created! Please check your email to confirm your account.");
        nav({ to: "/verify-email", search: { email } });
      } else {
        toast.success("Account created! You can sign in now.");
        nav({ to: "/login" });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title={invite ? "Accept your invitation" : "Create your account"}
      subtitle={
        invite
          ? "Complete your profile to join HomeSure."
          : "14-day free trial. No credit card required."
      }
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            required
            readOnly={inviteLocked}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@company.com"
            required
            readOnly={inviteLocked}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Password</Label>
          <Input
            id="pw"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <div className="space-y-1.5">
          <Label>I am a</Label>
          <Select
            value={role}
            onValueChange={(v) => setRole(v as Role)}
            disabled={inviteLocked}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating account..." : invite ? "Join HomeSure" : "Create account"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          By signing up you agree to our Terms and Privacy Policy.
        </p>
      </form>
    </AuthShell>
  );
}
