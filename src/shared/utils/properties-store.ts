import { useState, useEffect, useCallback } from "react";
import { properties as initialProperties } from "./mock-data";

export interface Property {
  property_id: number;
  landlord_id: number;
  property_name: string;
  property_type: string;
  address: string;
  rent_amount: number;
  availability_status: string;
  image_url?: string;
}

const STORAGE_KEY = "homesure_properties";

const isBrowser = typeof window !== "undefined";

// Convert mock data to our Property shape
const getInitialProperties = (): Property[] =>
  [...initialProperties].map((p, index) => ({
    property_id: parseInt(p.id.replace("P-", "")) || 1000 + index,
    landlord_id: 2,
    property_name: p.name,
    property_type: p.type,
    address: p.address,
    rent_amount: p.rent,
    availability_status: p.status,
    image_url: JSON.stringify([p.image]),
  }));

// Load from localStorage (client only), falling back to mock data
const loadProperties = (): Property[] => {
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
      // localStorage unavailable or corrupted — fall back to mock data
    }
  }
  return getInitialProperties();
};

// Save to localStorage (client only)
const saveProperties = (data: Property[]) => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silent fail
  }
};

// In-memory store — on server this is mock data, on client it rehydrates from localStorage
let properties: Property[] = loadProperties();

// Ensure client-side rehydration happens (module may have been loaded on server first)
let clientHydrated = false;
const ensureClientHydration = () => {
  if (isBrowser && !clientHydrated) {
    clientHydrated = true;
    properties = loadProperties();
    // Seed localStorage if it was empty (first visit)
    if (!localStorage.getItem(STORAGE_KEY)) {
      saveProperties(properties);
    }
  }
};

export const getProperties = () => {
  ensureClientHydration();
  return properties;
};

export const addProperty = (newProperty: Omit<Property, "property_id" | "landlord_id">) => {
  ensureClientHydration();
  const property_id = Math.max(...properties.map(p => p.property_id), 1000) + 1;
  const property: Property = {
    ...newProperty,
    property_id,
    landlord_id: 2,
  };
  properties = [property, ...properties];
  saveProperties(properties);
  window.dispatchEvent(new Event("properties-updated"));
  return { error: null, data: property };
};

export const updateProperty = (id: number, updates: Partial<Property>) => {
  ensureClientHydration();
  properties = properties.map((p) => (p.property_id === id ? { ...p, ...updates } : p));
  saveProperties(properties);
  window.dispatchEvent(new Event("properties-updated"));
  return { error: null };
};

export const deleteProperty = (id: number) => {
  ensureClientHydration();
  properties = properties.filter((p) => p.property_id !== id);
  saveProperties(properties);
  window.dispatchEvent(new Event("properties-updated"));
  return { error: null };
};

export const useProperties = () => {
  const [data, setData] = useState(() => getProperties());

  useEffect(() => {
    // Rehydrate from localStorage on client mount (handles SSR → client transition)
    ensureClientHydration();
    setData([...getProperties()]);

    const listener = () => setData([...getProperties()]);
    window.addEventListener("properties-updated", listener);
    return () => window.removeEventListener("properties-updated", listener);
  }, []);

  return data;
};
