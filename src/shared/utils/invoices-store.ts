import { useState, useEffect } from "react";
import { invoices as initialInvoices } from "./mock-data";

const STORAGE_KEY = "homesure_invoices";

const isBrowser = typeof window !== "undefined";

// Convert mock data to include the reason field
const getInitialInvoices = () =>
  [...initialInvoices].map(i => ({ ...i, reason: "" }));

// Load from localStorage (client only), falling back to mock data
const loadInvoices = () => {
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
  return getInitialInvoices();
};

// Save to localStorage (client only)
const saveInvoices = (data: any[]) => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable
  }
};

// In-memory store
let invoices = loadInvoices();

// Ensure client-side rehydration happens
let clientHydrated = false;
const ensureClientHydration = () => {
  if (isBrowser && !clientHydrated) {
    clientHydrated = true;
    invoices = loadInvoices();
    if (!localStorage.getItem(STORAGE_KEY)) {
      saveInvoices(invoices);
    }
  }
};

export const getInvoices = () => {
  ensureClientHydration();
  return invoices;
};

export const updateInvoice = (id: string, updates: any) => {
  ensureClientHydration();
  invoices = invoices.map(i => (i.id === id ? { ...i, ...updates } : i));
  saveInvoices(invoices);
  window.dispatchEvent(new Event("invoices-updated"));
};

export const useInvoices = () => {
  const [data, setData] = useState(() => getInvoices());

  useEffect(() => {
    ensureClientHydration();
    setData([...getInvoices()]);

    const listener = () => setData([...getInvoices()]);
    window.addEventListener("invoices-updated", listener);
    return () => window.removeEventListener("invoices-updated", listener);
  }, []);

  return data;
};
