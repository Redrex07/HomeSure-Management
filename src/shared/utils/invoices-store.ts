import { useState, useEffect } from "react";
import { invoices as initialInvoices } from "./mock-data";

// In-memory store initialized with mock data
let invoices = [...initialInvoices].map(i => ({ ...i, reason: "" }));

export const getInvoices = () => invoices;

export const updateInvoice = (id: string, updates: any) => {
  invoices = invoices.map(i => (i.id === id ? { ...i, ...updates } : i));
  window.dispatchEvent(new Event("invoices-updated"));
};

export const useInvoices = () => {
  const [data, setData] = useState(invoices);
  
  useEffect(() => {
    const listener = () => setData(getInvoices());
    window.addEventListener("invoices-updated", listener);
    return () => window.removeEventListener("invoices-updated", listener);
  }, []);
  
  return data;
};
