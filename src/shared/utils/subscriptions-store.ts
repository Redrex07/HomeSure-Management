import { useState, useEffect } from "react";
import { subscriptions as initialSubscriptions } from "./mock-data";

export interface Subscription {
  id: string;
  customer: string;
  plan: string;
  seats: number;
  mrr: number;
  status: string;
  renews: string;
}

const STORAGE_KEY = "homesure_subscriptions";

// Load from localStorage, falling back to mock data
const loadSubscriptions = (): Subscription[] => {
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
  const initial = [...initialSubscriptions];
  saveSubscriptions(initial);
  return initial;
};

// Save to localStorage
const saveSubscriptions = (data: Subscription[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silent fail
  }
};

let subscriptions: Subscription[] = loadSubscriptions();

export const getSubscriptions = () => subscriptions;

export const addSubscription = (newSub: Omit<Subscription, "id">) => {
  // Simple numeric ID generator from existing SUB-XXXX
  const maxId = subscriptions.reduce((max, s) => {
    const num = parseInt(s.id.replace("SUB-", ""), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 9000);
  
  const sub: Subscription = {
    ...newSub,
    id: `SUB-${maxId + 1}`,
  };
  subscriptions = [sub, ...subscriptions];
  saveSubscriptions(subscriptions);
  window.dispatchEvent(new Event("subscriptions-updated"));
  return { error: null, data: sub };
};

export const updateSubscription = (id: string, updates: Partial<Subscription>) => {
  subscriptions = subscriptions.map((s) => (s.id === id ? { ...s, ...updates } : s));
  saveSubscriptions(subscriptions);
  window.dispatchEvent(new Event("subscriptions-updated"));
  return { error: null };
};

export const deleteSubscription = (id: string) => {
  subscriptions = subscriptions.filter((s) => s.id !== id);
  saveSubscriptions(subscriptions);
  window.dispatchEvent(new Event("subscriptions-updated"));
  return { error: null };
};

export const useSubscriptions = () => {
  const [data, setData] = useState(subscriptions);
  
  useEffect(() => {
    const listener = () => setData([...getSubscriptions()]);
    window.addEventListener("subscriptions-updated", listener);
    return () => window.removeEventListener("subscriptions-updated", listener);
  }, []);
  
  return data;
};
