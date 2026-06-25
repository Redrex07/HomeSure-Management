import { useState, useEffect } from "react";
import { invoices as initialInvoices } from "./mock-data";

const STORAGE_KEY = "homesure_invoices";

// Convert mock data to include the reason field
const getInitialInvoices = () =>
  [...initialInvoices].map(i => ({ ...i, reason: "" }));

// Load from localStorage, falling back to mock data
const loadInvoices = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // localStorage unavailable or corrupted — fall back to mock data
  }
  const initial = getInitialInvoices();
  saveInvoices(initial);
  return initial;
};

// Save to localStorage
const saveInvoices = (data: any[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silent fail
  }
};

// In-memory store initialized from localStorage or mock data
let invoices = loadInvoices();

export const getInvoices = () => invoices;

export const updateInvoice = (id: string, updates: any) => {
  invoices = invoices.map(i => (i.id === id ? { ...i, ...updates } : i));
  saveInvoices(invoices);
  window.dispatchEvent(new Event("invoices-updated"));
};

export const useInvoices = () => {
  const [data, setData] = useState(invoices);
  
  useEffect(() => {
    const listener = () => setData([...getInvoices()]);
    window.addEventListener("invoices-updated", listener);
    return () => window.removeEventListener("invoices-updated", listener);
  }, []);
  
  return data;
};
