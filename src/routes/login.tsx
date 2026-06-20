import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setSession } from "@/lib/auth-store";
import { getUsers } from "@/lib/users-store";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — HomeSure" }, { name: "description", content: "Sign in to your HomeSure account." }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("demo@homesure.app");
  const [password, setPassword] = useState("demo1234");
  const [role, setRole] = useState<Role>("landlord");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const users = getUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    if (found) {
      // Support matching roles (in mock data it might be capitalized, normalize it)
      const mappedRole = (found.role.toLowerCase().replace(" ", "_")) as Role;
      setSession({
        email: found.email,
        name: found.name,
        role: mappedRole,
        status: found.status,
      });
      toast.success(`Welcome back, signing in as ${found.name} (${ROLE_LABELS[mappedRole]})`);
    } else {
      // Fallback for new demo emails
      setSession({ email, name: "Alex Morgan", role, status: "Active" });
      toast.success(`Welcome back, signing in as ${ROLE_LABELS[role]}`);
    }
    nav({ to: "/app/dashboard" });
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your HomeSure workspace."
      footer={<>Don't have an account? <Link to="/signup" className="font-medium text-primary hover:underline">Create one</Link></>}
    >
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="pw">Password</Label>
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot?</Link>
          </div>
          <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Sign in as (demo)</Label>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="w-full">Sign in</Button>
      </form>
    </AuthShell>
  );
}
