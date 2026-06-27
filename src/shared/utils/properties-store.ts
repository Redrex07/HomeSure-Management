import { useState, useEffect } from "react";
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
  amenities?: string;
}

const STORAGE_KEY = "homesure_properties";

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
    amenities: p.amenities || "",
  }));

// Load from localStorage, falling back to mock data
const loadProperties = (): Property[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      let parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Clean up any old blob URLs that might be saved in localStorage
        parsed = parsed.map(p => {
          if (p.image_url) {
            try {
              let urls = JSON.parse(p.image_url);
              if (Array.isArray(urls)) {
                urls = urls.filter(u => !u.startsWith("blob:"));
                p.image_url = urls.length > 0 ? JSON.stringify(urls) : undefined;
              } else if (typeof urls === "string" && urls.startsWith("blob:")) {
                p.image_url = undefined;
              }
            } catch {
              if (p.image_url.startsWith("blob:")) {
                p.image_url = undefined;
              }
            }
          }
          return p;
        });
        return parsed;
      }
    }
  } catch {
    // localStorage unavailable or corrupted — fall back to mock data
  }
  const initial = getInitialProperties();
  saveProperties(initial);
  return initial;
};

// Save to localStorage
const saveProperties = (data: Property[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silent fail
  }
};

let properties: Property[] = loadProperties();

export const getProperties = () => properties;

export const addProperty = (newProperty: Omit<Property, "property_id" | "landlord_id">) => {
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
  properties = properties.map((p) => (p.property_id === id ? { ...p, ...updates } : p));
  saveProperties(properties);
  window.dispatchEvent(new Event("properties-updated"));
  return { error: null };
};

export const deleteProperty = (id: number) => {
  properties = properties.filter((p) => p.property_id !== id);
  saveProperties(properties);
  window.dispatchEvent(new Event("properties-updated"));
  return { error: null };
};

export const useProperties = () => {
  const [data, setData] = useState(properties);
  
  useEffect(() => {
    const listener = () => setData([...getProperties()]);
    window.addEventListener("properties-updated", listener);
    return () => window.removeEventListener("properties-updated", listener);
  }, []);
  
  return data;
};
