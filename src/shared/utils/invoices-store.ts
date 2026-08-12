import { useState, useEffect } from "react";
import { invoices as initialInvoices } from "./mock-data";

// In-memory store initialized with mock data
let invoices = [...initialInvoices].map(i => ({ ...i, reason: "", receipt: "" }));

export const getInvoices = async () => invoices;
export const getTenantInvoices = async (tId: number, sId?: number | null) => invoices;

export const updateInvoice = async (id: string, updates: any) => {
  invoices = invoices.map(i => (i.id === id ? { ...i, ...updates } : i));
  window.dispatchEvent(new Event("invoices-updated"));
};

export const createInvoice = async (invoice: any) => {
  const newId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
  invoices = [{ id: newId, status: "Pending", issued: new Date().toISOString().split("T")[0], due: "2026-12-31", ...invoice }, ...invoices];
  window.dispatchEvent(new Event("invoices-updated"));
  return { id: newId };
};

export const deleteInvoice = async (id: string) => {
  invoices = invoices.filter(i => i.id !== id);
  window.dispatchEvent(new Event("invoices-updated"));
};

export const useInvoices = () => {
  const [data, setData] = useState(invoices);
  
  useEffect(() => {
    const listener = () => setData(invoices);
    window.addEventListener("invoices-updated", listener);
    return () => window.removeEventListener("invoices-updated", listener);
  }, []);
  
  return data;
};
