import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Logo } from "@/shared/components/brand/Logo";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Wrench,
  Users,
  Calendar,
  Receipt,
  ShieldCheck,
  Star,
  Check,
  Sparkles,
  BarChart3,
  Bell,
  Menu,
  X,
  Mail,
  Phone,
  BriefcaseBusiness,
  BadgeCheck,
  HardHat,
  Facebook,
  Twitter,
  Linkedin,
  Github,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HomeSure Management — Property & Home Warranty Platform" },
      {
        name: "description",
        content:
          "Manage properties, leases, maintenance, and home warranty services in one unified platform.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Building2,
    title: "Property portfolio",
    body: "Track properties, units, occupancy and rent in one elegant dashboard.",
  },
  {
    icon: Wrench,
    title: "Maintenance workflow",
    body: "Create, assign, and resolve service requests with full audit trail.",
  },
  {
    icon: Users,
    title: "Multi-role access",
    body: "Six tailored experiences: Super Admin, Service Admin, Landlord, Tenant, Contractor, Realtor.",
  },
  {
    icon: Calendar,
    title: "Appointment calendar",
    body: "Schedule contractor visits with reminders and rescheduling.",
  },
  {
    icon: Receipt,
    title: "Invoicing & rent",
    body: "Track payments, overdue invoices and revenue across the platform.",
  },
  {
    icon: ShieldCheck,
    title: "Warranty coverage",
    body: "Bundle home warranty plans into your management workflow.",
  },
  {
    icon: BarChart3,
    title: "Real-time analytics",
    body: "Revenue, request volume, completion rates and tenant insights.",
  },
  {
    icon: Bell,
    title: "Notification center",
    body: "Real-time alerts across email, in-app, and mobile.",
  },
];

const plans = [
  {
    name: "Starter",
    price: 49,
    blurb: "For new landlords getting organized.",
    features: [
      "Up to 5 properties",
      "Tenant & lease management",
      "Maintenance requests",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: 149,
    blurb: "For growing portfolios and teams.",
    features: [
      "Up to 50 properties",
      "Contractor marketplace",
      "Estimates & invoicing",
      "Advanced analytics",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: 599,
    blurb: "For property management firms.",
    features: [
      "Unlimited properties",
      "All Pro features",
      "Custom roles & SSO",
      "Dedicated CSM",
      "SLA & audit logs",
    ],
  },
];

const testimonials = [
  {
    name: "Daniel Ortiz",
    role: "Owner, Ortiz Holdings",
    initials: "DO",
    quote:
      "We cut maintenance turnaround by 38% in the first quarter. The contractor workflow alone paid for the platform.",
  },
  {
    name: "Priya Raman",
    role: "Landlord, 22 units",
    initials: "PR",
    quote:
      "Finally a tool that doesn't feel like a spreadsheet. Tenants actually use the app to pay rent on time.",
  },
  {
    name: "Linda Park",
    role: "Realtor, Park & Co.",
    initials: "LP",
    quote:
      "Listing analytics and tenant onboarding in the same dashboard is a game changer for our team.",
  },
];

function AnimatedCounter({ value, duration = 1000, suffix = "" }: { value: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.span
      onViewportEnter={() => {
        if (hasAnimated) return;
        setHasAnimated(true);
        if (shouldReduceMotion) {
          setCount(value);
          return;
        }
        let start = 0;
        const end = value;
        if (start === end) return;

        const totalSteps = 30;
        const stepTime = Math.abs(Math.floor(duration / totalSteps));
        const increment = (end - start) / totalSteps;

        const timer = setInterval(() => {
          start += increment;
          if (start >= end) {
            setCount(end);
            clearInterval(timer);
          } else {
            setCount(Math.floor(start));
          }
        }, stepTime);
      }}
      viewport={{ once: true, amount: 0.2 }}
    >
      {count.toLocaleString()}{suffix}
    </motion.span>
  );
}

function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [activeScreen, setActiveScreen] = useState<"dashboard" | "contractors" | "appointments" | "invoices" | "settings">("dashboard");
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-cycle dashboard preview screens
  useEffect(() => {
    const screens: ("dashboard" | "contractors" | "appointments" | "invoices" | "settings")[] = [
      "dashboard",
      "contractors",
      "appointments",
      "invoices",
      "settings",
    ];
    const timer = setInterval(() => {
      setActiveScreen((prev) => {
        const idx = screens.indexOf(prev);
        return screens[(idx + 1) % screens.length];
      });
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Auto-cycle testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const calculatePrice = (basePrice: number) => {
    if (billingCycle === "yearly") {
      return Math.round(basePrice * 0.8);
    }
    return basePrice;
  };

  const containerVariants = useMemo(() => ({
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.04,
      },
    },
  }), []);

  const itemVariants = useMemo(() => ({
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as any },
    },
  }), [shouldReduceMotion]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    toast.success("Subscribed successfully! Welcome to the HomeSure newsletter.");
    setNewsletterEmail("");
  };

  const verifiedBadge = (
    <span className="inline-flex items-center justify-center rounded-full bg-blue-50 p-0.5 text-blue-600 ml-1.5" title="Verified Customer">
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    </span>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 selection:bg-blue-100 selection:text-blue-700">
      {/* Navigation */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 border-b ${
          scrolled
            ? "bg-white/80 backdrop-blur-md border-slate-200/80 shadow-sm"
            : "bg-transparent border-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-blue-600 transition-colors relative group py-2">
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-250 group-hover:w-full" />
            </a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors relative group py-2">
              Pricing
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-250 group-hover:w-full" />
            </a>
            <a href="#testimonials" className="hover:text-blue-600 transition-colors relative group py-2">
              Customers
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-250 group-hover:w-full" />
            </a>
            <a href="#contact" className="hover:text-blue-600 transition-colors relative group py-2">
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-250 group-hover:w-full" />
            </a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="font-medium hover:text-blue-600 hover:bg-blue-50/50">
                Sign in
              </Button>
            </Link>
            <Link to="/signup" search={{ invite: "" }}>
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white gap-1.5 font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all border border-blue-600/10">
                Start free <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <button
            className="flex p-2 text-slate-600 hover:text-slate-900 md:hidden focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-16 left-0 right-0 z-40 bg-white border-b border-slate-200 shadow-lg px-6 py-6 flex flex-col gap-3 md:hidden"
          >
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-800 hover:text-blue-600 transition-colors py-2 border-b border-slate-100"
            >
              Features
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-800 hover:text-blue-600 transition-colors py-2 border-b border-slate-100"
            >
              Pricing
            </a>
            <a
              href="#testimonials"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-800 hover:text-blue-600 transition-colors py-2 border-b border-slate-100"
            >
              Customers
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-800 hover:text-blue-600 transition-colors py-2"
            >
              Contact
            </a>
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-100">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-center">
                  Sign in
                </Button>
              </Link>
              <Link to="/signup" search={{ invite: "" }} onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full justify-center bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                  Start free trial
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24 border-b border-slate-100 bg-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.06),transparent_65%)] bg-[linear-gradient(to_right,rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="mx-auto max-w-7xl px-6 text-center">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="mx-auto max-w-3xl"
          >
            <Badge
              variant="outline"
              className="mb-6 gap-1.5 border-blue-200/60 bg-blue-50/60 text-blue-600 px-3 py-1 font-semibold text-xs shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" /> New: Home Warranty Module 2026
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl leading-[1.1]">
              Property management{" "}
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-700 bg-clip-text text-transparent">
                that actually feels modern.
              </span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              HomeSure unifies properties, tenants, contractors and warranty services for landlords,
              realtors and managers — in one beautifully designed dashboard.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/signup" search={{ invite: "" }}>
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all w-full sm:w-auto relative overflow-hidden group border border-blue-600/10">
                  <span className="relative flex items-center gap-2">
                    Start free trial <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white shadow-sm hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200">
                  Live demo
                </Button>
              </Link>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
              <Check className="h-4 w-4 text-emerald-500" /> 14-day free trial · No credit card required
            </div>
          </motion.div>

          {/* Optimized Product Showcase */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="relative mx-auto mt-16 max-w-5xl"
            style={{ willChange: "opacity" }}
          >
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 opacity-10 blur-xl -z-10" />
            <div className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-elegant ring-1 ring-slate-100">
              <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="ml-3 text-xs font-semibold text-slate-400 hidden sm:inline select-none">
                      app.homesure.com/{activeScreen}
                    </span>
                  </div>
                  {/* Tabs Selector */}
                  <div className="flex gap-2">
                    {["dashboard", "contractors", "appointments", "invoices", "settings"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setActiveScreen(s as any)}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded transition-all ${
                          activeScreen === s
                            ? "bg-blue-50 text-blue-600 border border-blue-100/50"
                            : "text-slate-400 hover:text-slate-600 border border-transparent"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 min-h-[220px]">
                  <AnimatePresence mode="wait">
                    {activeScreen === "dashboard" && (
                      <motion.div
                        key="dashboard"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="grid gap-3 sm:grid-cols-4">
                          {[
                            { l: "Properties", v: "128", d: "+12%" },
                            { l: "Active tenants", v: "412", d: "+4%" },
                            { l: "Open requests", v: "37", d: "-8%" },
                            { l: "MRR", v: "₹71.9k", d: "+18%" },
                          ].map((s) => (
                            <div key={s.l} className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm text-left">
                              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{s.l}</div>
                              <div className="mt-1 text-xl font-bold text-slate-800">{s.v}</div>
                              <div className="mt-1 text-[9px] font-semibold text-emerald-600 flex items-center gap-1">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                {s.d} vs last month
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="col-span-2 h-36 rounded-xl border border-slate-100 bg-white p-4 shadow-sm text-left">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Revenue trend</div>
                            <svg viewBox="0 0 400 120" className="h-24 w-full mt-2">
                              <defs>
                                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.12" />
                                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                                </linearGradient>
                              </defs>
                              <path d="M0,90 C50,80 80,60 120,55 C170,48 200,70 240,52 C290,30 320,20 400,12 L400,120 L0,120 Z" fill="url(#g)" />
                              <path d="M0,90 C50,80 80,60 120,55 C170,48 200,70 240,52 C290,30 320,20 400,12" fill="none" strokeWidth="2.5" className="stroke-blue-600" />
                            </svg>
                          </div>
                          <div className="h-36 rounded-xl border border-slate-100 bg-white p-4 shadow-sm text-left">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Recent requests</div>
                            <ul className="mt-2 space-y-2 text-[11px]">
                              {["Leaking faucet · Maplewood", "AC not cooling · Sunset Palms", "Outlet sparks · Oakridge"].map((t) => (
                                <li key={t} className="flex items-center justify-between rounded-lg border border-slate-100 px-2 py-1 bg-slate-50/50">
                                  <span className="truncate font-medium text-slate-700">{t}</span>
                                  <span className="text-[9px] font-bold text-slate-400">2h</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeScreen === "contractors" && (
                      <motion.div
                        key="contractors"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="grid gap-3 sm:grid-cols-3 text-left"
                      >
                        {[
                          { name: "John's Plumbing", rep: "John Doe", trade: "Plumbing", rating: 4.9, jobs: 124 },
                          { name: "Eco Heating & Air", rep: "Sarah Smith", trade: "HVAC", rating: 4.8, jobs: 92 },
                          { name: "Austin Pro Electric", rep: "Dave Miller", trade: "Electrical", rating: 4.7, jobs: 108 },
                        ].map((c) => (
                          <div key={c.name} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                            <div className="font-bold text-slate-800 text-sm">{c.name}</div>
                            <div className="text-[10px] text-slate-400">Rep: {c.rep}</div>
                            <div className="mt-3 flex items-center justify-between">
                              <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 text-[9px] font-bold px-2 py-0.5 border border-blue-100/50">
                                {c.trade}
                              </Badge>
                              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                {c.rating} ({c.jobs} jobs)
                              </div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {activeScreen === "appointments" && (
                      <motion.div
                        key="appointments"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="grid gap-3 sm:grid-cols-7 text-left"
                      >
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                          <div key={day} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm min-h-[140px] flex flex-col justify-between">
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{day}</div>
                              <div className="text-lg font-extrabold text-slate-700 mt-0.5">{15 + i}</div>
                            </div>
                            {i % 3 === 0 && (
                              <div className="rounded-lg bg-blue-50 border border-blue-100 p-1.5 text-[8px] text-blue-600 font-bold leading-tight">
                                <div>10:00 AM</div>
                                <div className="truncate">AC Service</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {activeScreen === "invoices" && (
                      <motion.div
                        key="invoices"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden text-left"
                      >
                        <div className="grid grid-cols-4 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <div>Invoice</div>
                          <div>Date</div>
                          <div>Amount</div>
                          <div>Status</div>
                        </div>
                        {[
                          { id: "INV-1024", date: "June 28, 2026", amount: "₹4,500", status: "Paid", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
                          { id: "INV-1023", date: "June 25, 2026", amount: "₹12,800", status: "Pending", color: "bg-amber-50 text-amber-700 border-amber-100" },
                          { id: "INV-1022", date: "June 18, 2026", amount: "₹9,200", status: "Overdue", color: "bg-rose-50 text-rose-700 border-rose-100" },
                        ].map((inv) => (
                          <div key={inv.id} className="grid grid-cols-4 px-4 py-2.5 border-b border-slate-100 text-xs items-center font-medium">
                            <div className="font-mono font-bold text-slate-800">{inv.id}</div>
                            <div className="text-slate-400">{inv.date}</div>
                            <div className="text-slate-600">{inv.amount}</div>
                            <div>
                              <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${inv.color}`}>
                                {inv.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {activeScreen === "settings" && (
                      <motion.div
                        key="settings"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="max-w-xl mx-auto rounded-xl border border-slate-100 bg-white p-4 shadow-sm text-left grid gap-3"
                      >
                        <div className="text-xs font-bold text-slate-700">Account Profile</div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Full Name</label>
                            <div className="rounded border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600 font-medium">Super Admin</div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Email Address</label>
                            <div className="rounded border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600 font-medium truncate">admin@homesure.com</div>
                          </div>
                        </div>
                        <div className="flex justify-end mt-2">
                          <Button size="sm" className="h-8 text-xs font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white border border-blue-600/10">Save Changes</Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Grayscale Client Trust Banner */}
          <div className="mt-20 border-t border-slate-100 pt-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Trusted by leading realtors and property management groups
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 grayscale opacity-45 select-none font-medium">
              <span className="text-base font-black tracking-wider font-mono">ORIZON CAPITAL</span>
              <span className="text-base font-black tracking-wider font-mono">PARK & CO</span>
              <span className="text-base font-black tracking-wider font-mono">AUSTIN LIVING</span>
              <span className="text-base font-black tracking-wider font-mono">ORTIZ HOMES</span>
              <span className="text-base font-black tracking-wider font-mono">SURESHIELD</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats section */}
      <section className="border-b border-slate-100 bg-slate-50/50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
            {[
              { label: "Properties managed", value: 1200, suffix: "+" },
              { label: "Requests completed", value: 8500, suffix: "+" },
              { label: "Active contractors", value: 350, suffix: "+" },
              { label: "Client satisfaction", value: 99, suffix: ".6%" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                viewport={{ once: true }}
                className="space-y-1"
                style={{ willChange: "transform, opacity" }}
              >
                <div className="text-3xl font-extrabold text-slate-900 md:text-4xl tracking-tight">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-b border-slate-100 py-20 md:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 font-bold uppercase tracking-wider text-[10px] px-3 py-1 border border-blue-100/50">
              Platform Features
            </Badge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900">
              Everything you need to run a portfolio
            </h2>
            <p className="mt-4 text-slate-500 leading-relaxed">
              From day-one onboarding to long-term warranty coverage, HomeSure replaces a stack of
              disconnected tools.
            </p>
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {features.map((f) => (
              <motion.div key={f.title} variants={itemVariants} style={{ willChange: "transform, opacity" }}>
                <Card className="group border border-slate-200 bg-white shadow-card rounded-xl transition-all duration-250 hover:shadow-elegant hover:border-blue-200 hover:-translate-y-1 h-full flex flex-col justify-between">
                  <CardContent className="p-5 flex flex-col items-start h-full flex-grow justify-between">
                    <div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-transform duration-250 group-hover:scale-105">
                        <f.icon className="h-5 w-5" />
                      </div>
                      <div className="mt-4 font-bold text-slate-800 text-base">{f.title}</div>
                      <p className="mt-2 text-sm text-slate-500 leading-relaxed">{f.body}</p>
                    </div>
                    <span className="text-xs font-bold text-blue-600 group-hover:underline inline-flex items-center gap-1 mt-5">
                      Learn More <ArrowRight className="h-3 w-3" />
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="border-b border-slate-100 py-20 md:py-28 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 font-bold uppercase tracking-wider text-[10px] px-3 py-1 border border-blue-100/50">
              Pricing Plans
            </Badge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900">
              Simple plans, no surprises
            </h2>
            <p className="mt-4 text-slate-500 leading-relaxed">
              Start free for 14 days. Switch plans or cancel anytime.
            </p>

            {/* Monthly / Yearly Switcher */}
            <div className="mt-8 flex items-center justify-center gap-3">
              <span className={`text-sm font-semibold transition-colors ${billingCycle === "monthly" ? "text-slate-800" : "text-slate-400"}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                className="relative h-6 w-11 rounded-full bg-slate-200 transition-colors focus:outline-none"
                aria-label="Toggle billing cycle"
              >
                <motion.div
                  layout
                  className="h-5 w-5 rounded-full bg-blue-600 shadow-sm"
                  style={{
                    position: "absolute",
                    top: "2px",
                    left: billingCycle === "monthly" ? "2px" : "24px",
                  }}
                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                />
              </button>
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-semibold transition-colors ${billingCycle === "yearly" ? "text-slate-800" : "text-slate-400"}`}>
                  Yearly
                </span>
                <Badge className="bg-emerald-500 text-white font-bold hover:bg-emerald-500 text-[10px] px-1.5 py-0.5">
                  Save 20%
                </Badge>
              </div>
            </div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="mt-16 grid gap-6 lg:grid-cols-3 max-w-6xl mx-auto items-stretch"
          >
            {plans.map((p) => (
              <motion.div key={p.name} variants={itemVariants} className="h-full" style={{ willChange: "transform, opacity" }}>
                <Card
                  className={`border transition-all duration-300 rounded-2xl h-full flex flex-col justify-between hover:shadow-elegant ${
                    p.popular
                      ? "relative border-blue-500 shadow-elegant bg-white ring-2 ring-blue-500/10 lg:scale-105 z-10"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {p.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white font-bold hover:bg-blue-600 uppercase tracking-wider text-[9px] px-2 py-0.5 border border-blue-600/10">
                        Most popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-8 flex flex-col justify-between h-full flex-1">
                    <div>
                      <div className="text-xl font-bold text-slate-800">{p.name}</div>
                      <p className="mt-2 text-sm text-slate-500 leading-relaxed">{p.blurb}</p>
                      <div className="mt-6 flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                          ${calculatePrice(p.price)}
                        </span>
                        <span className="text-sm font-medium text-slate-400">/month</span>
                      </div>
                      <ul className="mt-8 space-y-3.5 text-sm text-slate-600">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Link to="/signup" search={{ invite: "" }} className="mt-8 block">
                      <Button className={`w-full h-10 shadow-sm ${p.popular ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white border border-blue-600/10" : "hover:text-blue-600 hover:border-blue-200"}`} variant={p.popular ? "default" : "outline"}>
                        Start free trial
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Comparison Table */}
          <div className="mt-20 max-w-4xl mx-auto overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hidden md:block">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Features Comparison</h3>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {[
                { name: "Max Properties", starter: "5 properties", pro: "50 properties", enterprise: "Unlimited" },
                { name: "Maintenance requests", starter: "✓", pro: "✓", enterprise: "✓" },
                { name: "Contractor Marketplace", starter: "-", pro: "✓", enterprise: "✓" },
                { name: "Invoicing & estimates", starter: "-", pro: "✓", enterprise: "✓" },
                { name: "Advanced analytics", starter: "-", pro: "✓", enterprise: "✓" },
                { name: "Dedicated CSM", starter: "-", pro: "-", enterprise: "✓" },
              ].map((row) => (
                <div key={row.name} className="grid grid-cols-4 px-6 py-3.5 items-center">
                  <div className="font-bold text-slate-700">{row.name}</div>
                  <div className="text-slate-500 font-medium">{row.starter}</div>
                  <div className="text-slate-800 font-semibold">{row.pro}</div>
                  <div className="text-slate-500 font-medium">{row.enterprise}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing FAQ Section */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h3 className="text-2xl font-extrabold text-slate-900 text-center mb-8">Frequently Asked Questions</h3>
            <div className="space-y-4">
              {[
                { q: "Can I upgrade or downgrade my plan anytime?", a: "Yes, you can upgrade, downgrade, or cancel your subscription at any time. Changes will be reflected in your next billing cycle." },
                { q: "What is your refund policy?", a: "We offer a 14-day free trial where you can explore the entire platform without a credit card. Once subscribed, we offer a 30-day money-back guarantee." },
                { q: "Does HomeSure charge setup fees?", a: "No, there are zero setup fees, contract binding commitments, or hidden charges. You pay exactly what is shown." },
              ].map((faq, i) => (
                <Card key={i} className="border border-slate-200 bg-white">
                  <CardContent className="p-5 text-left">
                    <h4 className="font-bold text-slate-800 text-sm">{faq.q}</h4>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="border-b border-slate-100 py-20 md:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 font-bold uppercase tracking-wider text-[10px] px-3 py-1 border border-blue-100/50">
              Customer Reviews
            </Badge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900">
              Loved by landlords & teams
            </h2>
          </div>

          {/* Quote Carousel */}
          <div className="mt-16 max-w-3xl mx-auto relative px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                style={{ willChange: "transform, opacity" }}
              >
                <Card className="border border-slate-200 bg-white shadow-elegant rounded-2xl p-8 relative overflow-hidden">
                  <div className="absolute top-6 right-8 text-slate-100 select-none font-serif text-8xl leading-none">
                    “
                  </div>
                  <CardContent className="p-0 flex flex-col justify-between h-full relative z-10 text-left">
                    <div className="flex gap-0.5 text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-current" />
                      ))}
                    </div>
                    <p className="mt-6 text-base md:text-lg leading-relaxed text-slate-700 font-medium">
                      "{testimonials[activeTestimonial].quote}"
                    </p>
                    <div className="mt-8 border-t border-slate-100 pt-4 flex items-center gap-3">
                      <Avatar className="h-12 w-12 border border-slate-100 shadow-sm flex-shrink-0">
                        <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-sm">
                          {testimonials[activeTestimonial].initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-bold text-slate-800 flex items-center">
                          {testimonials[activeTestimonial].name}
                          {verifiedBadge}
                        </div>
                        <div className="text-xs font-semibold text-slate-400 mt-0.5">
                          {testimonials[activeTestimonial].role}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Dots */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTestimonial(idx)}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    idx === activeTestimonial ? "bg-blue-600 w-6" : "bg-slate-300"
                  }`}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="border-b border-slate-100 py-20 md:py-28 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              style={{ willChange: "transform, opacity" }}
              className="text-left"
            >
              <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 font-bold uppercase tracking-wider text-[10px] px-3 py-1 border border-blue-100/50">
                Get In Touch
              </Badge>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900 leading-tight">Talk to our team</h2>
              <p className="mt-4 text-slate-500 leading-relaxed">
                Have questions about migrating from your current PMS or rolling out HomeSure across
                multiple regions? We'd love to chat.
              </p>
              
              <div className="border-t border-slate-200 mt-8 pt-8 grid grid-cols-2 gap-6 text-sm text-slate-600">
                <div className="space-y-1">
                  <div className="font-bold text-slate-800">Support Queue</div>
                  <div>support@homesure.app</div>
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">Typical Response: 2h</div>
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-slate-800">Sales Inquiries</div>
                  <div>sales@homesure.app</div>
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">typical response: 4h</div>
                </div>
                <div className="space-y-1 col-span-2">
                  <div className="font-bold text-slate-800">Headquarters Address</div>
                  <div>123 Property Ave, Suite 100</div>
                  <div>Austin, TX 78701</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              style={{ willChange: "transform, opacity" }}
            >
              <Card className="border border-slate-200 bg-white/70 backdrop-blur-md shadow-elegant rounded-xl">
                <CardContent className="p-6">
                  <form
                    className="grid gap-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      toast.success("Thank you! Our team will contact you shortly.");
                    }}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="fullName" className="sr-only">Full name</Label>
                        <Input
                          id="fullName"
                          placeholder="Full name"
                          required
                          className="h-10 bg-white focus:border-blue-400 focus:ring-blue-400/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="companyName" className="sr-only">Company</Label>
                        <Input
                          id="companyName"
                          placeholder="Company"
                          required
                          className="h-10 bg-white focus:border-blue-400 focus:ring-blue-400/20"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="workEmail" className="sr-only">Work email</Label>
                      <Input
                        id="workEmail"
                        placeholder="Work email"
                        type="email"
                        required
                        className="h-10 bg-white focus:border-blue-400 focus:ring-blue-400/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="message" className="sr-only">How can we help?</Label>
                      <Textarea
                        id="message"
                        rows={4}
                        placeholder="How can we help?"
                        required
                        className="bg-white focus:border-blue-400 focus:ring-blue-400/20"
                      />
                    </div>
                    <Button type="submit" className="mt-2 h-10 shadow-sm font-semibold relative overflow-hidden group bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white border border-blue-600/10">
                      Send message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-b border-slate-100 bg-gradient-to-br from-blue-600 to-blue-800 py-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_45%)]" />
        <div className="mx-auto max-w-4xl px-6 text-center relative z-10">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl leading-tight">
            Ready to modernize your portfolio?
          </h2>
          <p className="mt-4 text-white/90 font-medium max-w-xl mx-auto leading-relaxed">
            Join 1,200+ landlords and management firms running on HomeSure.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/signup" search={{ invite: "" }}>
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-slate-900 hover:bg-slate-50 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all font-semibold px-8 hover:text-blue-600"
              >
                Start free trial
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 font-semibold px-8"
              >
                Live demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-white py-16 text-left">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-slate-400 max-w-sm leading-relaxed font-medium">
              Modern property management & home warranty platform. Built to unify tenants, landlords, realtors, and maintenance teams.
            </p>
            <div className="flex gap-4 mt-6 text-slate-400">
              <a href="#" className="hover:text-blue-600 transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors" aria-label="GitHub">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Product
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-500 font-medium">
              <li>
                <a href="#features" className="hover:text-blue-600 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-blue-600 transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <Link to="/login" className="hover:text-blue-600 transition-colors">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Resources
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-500 font-medium">
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Guides
                </a>
              </li>
              <li>
                <a href="mailto:support@homesure.app" className="hover:text-blue-600 transition-colors">
                  Support
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Legal
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-500 font-medium">
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Security
                </a>
              </li>
            </ul>
          </div>
          {/* Newsletter subscription widget */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Newsletter
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Get the latest property management insights direct to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="grid gap-2">
              <Input
                type="email"
                placeholder="you@email.com"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="h-9 text-xs focus:border-blue-400 focus:ring-blue-400/20"
              />
              <Button type="submit" size="sm" className="h-9 text-xs font-bold shadow-sm bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white border border-blue-600/10">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-7xl border-t border-slate-100 px-6 pt-6 flex items-center justify-between text-xs text-slate-400 font-medium">
          <div>© 2026 HomeSure Management. All rights reserved.</div>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 hover:text-blue-600 transition-colors font-bold uppercase tracking-wider text-[10px] focus:outline-none"
            aria-label="Scroll to top"
          >
            Back to top <ChevronUp className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
