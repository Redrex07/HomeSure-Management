import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Logo } from "@/shared/components/brand/Logo";
import {
  ArrowRight, Building2, Wrench, Users, Calendar, Receipt, ShieldCheck,
  Star, Check, Sparkles, BarChart3, Bell,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HomeSure Management — Property & Home Warranty Platform" },
      { name: "description", content: "Manage properties, leases, maintenance, and home warranty services in one unified platform." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Building2, title: "Property portfolio", body: "Track properties, units, occupancy and rent in one elegant dashboard." },
  { icon: Wrench, title: "Maintenance workflow", body: "Create, assign, and resolve service requests with full audit trail." },
  { icon: Users, title: "Multi-role access", body: "Six tailored experiences: Super Admin, Service Admin, Landlord, Tenant, Contractor, Realtor." },
  { icon: Calendar, title: "Appointment calendar", body: "Schedule contractor visits with reminders and rescheduling." },
  { icon: Receipt, title: "Invoicing & rent", body: "Track payments, overdue invoices and revenue across the platform." },
  { icon: ShieldCheck, title: "Warranty coverage", body: "Bundle home warranty plans into your management workflow." },
  { icon: BarChart3, title: "Real-time analytics", body: "Revenue, request volume, completion rates and tenant insights." },
  { icon: Bell, title: "Notification center", body: "Real-time alerts across email, in-app, and mobile." },
];

const plans = [
  { name: "Starter", price: 49, blurb: "For new landlords getting organized.", features: ["Up to 5 properties", "Tenant & lease management", "Maintenance requests", "Email support"] },
  { name: "Pro", price: 149, blurb: "For growing portfolios and teams.", features: ["Up to 50 properties", "Contractor marketplace", "Estimates & invoicing", "Advanced analytics", "Priority support"], popular: true },
  { name: "Enterprise", price: 599, blurb: "For property management firms.", features: ["Unlimited properties", "All Pro features", "Custom roles & SSO", "Dedicated CSM", "SLA & audit logs"] },
];

const testimonials = [
  { name: "Daniel Ortiz", role: "Owner, Ortiz Holdings", quote: "We cut maintenance turnaround by 38% in the first quarter. The contractor workflow alone paid for the platform." },
  { name: "Priya Raman", role: "Landlord, 22 units", quote: "Finally a tool that doesn't feel like a spreadsheet. Tenants actually use the app to pay rent on time." },
  { name: "Linda Park", role: "Realtor, Park & Co.", quote: "Listing analytics and tenant onboarding in the same dashboard is a game changer for our team." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/"><Logo /></Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#testimonials" className="hover:text-foreground">Customers</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/signup"><Button size="sm" className="gap-1">Start free <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,oklch(0.95_0.04_260),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-6 gap-1.5 border-primary/30 bg-primary-soft text-primary">
              <Sparkles className="h-3 w-3" /> New: Home Warranty Module 2026
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Property management <span className="bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">that actually feels modern.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              HomeSure unifies properties, tenants, contractors and warranty services for landlords, realtors and managers — in one beautifully designed dashboard.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/signup"><Button size="lg" className="gap-2">Start free trial <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link to="/login"><Button size="lg" variant="outline">Live demo</Button></Link>
            </div>
            <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-success" /> 14-day free trial · No credit card required
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="rounded-2xl border border-border bg-card p-2 shadow-elegant ring-1 ring-primary/5">
              <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
                <div className="flex items-center gap-1.5 border-b border-border bg-background/80 px-3 py-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-success/70" />
                  <div className="ml-3 text-xs text-muted-foreground">app.homesure.com/dashboard</div>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-4">
                  {[
                    { l: "Properties", v: "128", d: "+12%" },
                    { l: "Active tenants", v: "412", d: "+4%" },
                    { l: "Open requests", v: "37", d: "-8%" },
                    { l: "MRR", v: "$71.9k", d: "+18%" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-lg border border-border bg-card p-3">
                      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{s.l}</div>
                      <div className="mt-1 text-xl font-semibold">{s.v}</div>
                      <div className="mt-1 text-[10px] text-success">{s.d} vs last month</div>
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 px-4 pb-4 sm:grid-cols-3">
                  <div className="col-span-2 h-40 rounded-lg border border-border bg-gradient-to-br from-primary-soft via-background to-info/5 p-3">
                    <div className="text-xs font-semibold text-foreground">Revenue trend</div>
                    <svg viewBox="0 0 400 120" className="mt-2 h-28 w-full">
                      <defs>
                        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M0,90 C50,80 80,60 120,55 C170,48 200,70 240,52 C290,30 320,20 400,12 L400,120 L0,120 Z" fill="url(#g)" className="text-primary" />
                      <path d="M0,90 C50,80 80,60 120,55 C170,48 200,70 240,52 C290,30 320,20 400,12" fill="none" strokeWidth="2" className="stroke-primary" />
                    </svg>
                  </div>
                  <div className="h-40 rounded-lg border border-border bg-card p-3">
                    <div className="text-xs font-semibold text-foreground">Recent requests</div>
                    <ul className="mt-2 space-y-2 text-xs">
                      {["Leaking faucet · Maplewood", "AC not cooling · Sunset", "Outlet sparks · Oakridge"].map((t) => (
                        <li key={t} className="flex items-center justify-between rounded-md border border-border/60 px-2 py-1.5">
                          <span className="truncate">{t}</span>
                          <span className="text-[10px] text-muted-foreground">2h</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-border/60 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-sm font-semibold uppercase tracking-wider text-primary">Platform</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to run a portfolio</h2>
            <p className="mt-4 text-muted-foreground">From day-one onboarding to long-term warranty coverage, HomeSure replaces a stack of disconnected tools.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <Card key={f.title} className="border-border/70 transition-shadow hover:shadow-elegant">
                <CardContent className="p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 font-semibold">{f.title}</div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-border/60 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-sm font-semibold uppercase tracking-wider text-primary">Pricing</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Simple plans, no surprises</h2>
            <p className="mt-4 text-muted-foreground">Start free for 14 days. Switch plans or cancel anytime.</p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {plans.map((p) => (
              <Card key={p.name} className={p.popular ? "relative border-primary/40 shadow-elegant ring-1 ring-primary/20" : "border-border/70"}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most popular</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="text-lg font-semibold">{p.name}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${p.price}</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                  <Link to="/signup" className="mt-5 block">
                    <Button className="w-full" variant={p.popular ? "default" : "outline"}>Start free trial</Button>
                  </Link>
                  <ul className="mt-6 space-y-2.5 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="border-b border-border/60 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-sm font-semibold uppercase tracking-wider text-primary">Customers</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Loved by landlords & teams</h2>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-border/70">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 text-warning">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-foreground">"{t.quote}"</p>
                  <div className="mt-5 border-t border-border pt-4">
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="border-b border-border/60 py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wider text-primary">Contact</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Talk to our team</h2>
            <p className="mt-4 text-muted-foreground">Have questions about migrating from your current PMS or rolling out HomeSure across multiple regions? We'd love to chat.</p>
            <div className="mt-6 space-y-2 text-sm">
              <div><span className="font-medium text-foreground">Sales:</span> sales@homesure.app</div>
              <div><span className="font-medium text-foreground">Support:</span> support@homesure.app</div>
              <div><span className="font-medium text-foreground">Phone:</span> +1 (888) 555-HOME</div>
            </div>
          </div>
          <Card className="border-border/70 shadow-elegant">
            <CardContent className="p-6">
              <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); }}>
                <div className="grid grid-cols-2 gap-3">
                  <input className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2" placeholder="Full name" />
                  <input className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2" placeholder="Company" />
                </div>
                <input className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2" placeholder="Work email" type="email" />
                <textarea rows={4} className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2" placeholder="How can we help?" />
                <Button type="submit" className="mt-2">Send message</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-border/60 bg-gradient-to-br from-primary to-info py-20 text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to modernize your portfolio?</h2>
          <p className="mt-4 text-primary-foreground/85">Join 1,200+ landlords and management firms running on HomeSure.</p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/signup"><Button size="lg" variant="secondary" className="bg-background text-foreground hover:bg-background/90">Start free trial</Button></Link>
            <Link to="/login"><Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">Live demo</Button></Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-4 sm:px-6">
          <div>
            <Logo />
            <p className="mt-3 text-xs text-muted-foreground">Modern property management & home warranty platform.</p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-foreground">Product</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
              <li><Link to="/login" className="hover:text-foreground">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-foreground">Company</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>About</li><li>Customers</li><li>Careers</li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-foreground">Legal</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Privacy</li><li>Terms</li><li>Security</li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-7xl border-t border-border px-4 pt-6 text-xs text-muted-foreground sm:px-6">
          © 2026 HomeSure Management. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
