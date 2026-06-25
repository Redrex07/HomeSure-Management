import { useState, useEffect } from "react";
import { tenants as initialTenants } from "./mock-data";

export interface Tenant {
  onboarding_id: string;
  tenant_id: string;
  property_id: string;
  onboarding_status: string;
  onboarding_date: string;
  email: string;
}

const STORAGE_KEY = "homesure_tenants";

const isBrowser = typeof window !== "undefined";

// Convert mock data to match the expected format
const getInitialTenants = (): Tenant[] =>
  [...initialTenants].map((t, index) => ({
    onboarding_id: String(5000 + index),
    tenant_id: t.id.replace("T-", ""),
    property_id: "104" + index, // Mock property id
    onboarding_status: t.status === "Active" ? "Completed" : t.status === "Onboarding" ? "Pending" : "Active",
    onboarding_date: t.leaseStart !== "—" ? t.leaseStart : new Date().toISOString().split("T")[0],
    email: t.email,
  }));

// Load from localStorage (client only), falling back to mock data
const loadTenants = (): Tenant[] => {
  if (isBrowser) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // localStorage unavailable or corrupted
    }
  }
  return getInitialTenants();
};

// Save to localStorage (client only)
const saveTenants = (data: Tenant[]) => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable
  }
};

// In-memory store
let tenants: Tenant[] = loadTenants();

// Ensure client-side rehydration happens
let clientHydrated = false;
const ensureClientHydration = () => {
  if (isBrowser && !clientHydrated) {
    clientHydrated = true;
    tenants = loadTenants();
    if (!localStorage.getItem(STORAGE_KEY)) {
      saveTenants(tenants);
    }
  }
};

export const getTenants = () => {
  ensureClientHydration();
  return tenants;
};

export const addTenant = (newTenant: Omit<Tenant, "onboarding_id">) => {
  ensureClientHydration();
  const onboarding_id = String(Math.max(...tenants.map(t => parseInt(t.onboarding_id)), 5000) + 1);
  const tenant: Tenant = {
    ...newTenant,
    onboarding_id,
  };
  tenants = [tenant, ...tenants];
  saveTenants(tenants);
  window.dispatchEvent(new Event("tenants-updated"));
  return { error: null, data: tenant };
};

export const updateTenant = (id: string, updates: Partial<Tenant>) => {
  ensureClientHydration();
  tenants = tenants.map((t) => (t.onboarding_id === id ? { ...t, ...updates } : t));
  saveTenants(tenants);
  window.dispatchEvent(new Event("tenants-updated"));
  return { error: null };
};

export const deleteTenant = (id: string) => {
  ensureClientHydration();
  tenants = tenants.filter((t) => t.onboarding_id !== id);
  saveTenants(tenants);
  window.dispatchEvent(new Event("tenants-updated"));
  return { error: null };
};

export const useTenants = () => {
  const [data, setData] = useState(() => getTenants());

  useEffect(() => {
    ensureClientHydration();
    setData([...getTenants()]);

    const listener = () => setData([...getTenants()]);
    window.addEventListener("tenants-updated", listener);
    return () => window.removeEventListener("tenants-updated", listener);
  }, []);

  return data;
};
