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
}

// Convert mock data to our SupabaseProperty shape
let properties: Property[] = [...initialProperties].map((p, index) => ({
  property_id: parseInt(p.id.replace("P-", "")) || 1000 + index,
  landlord_id: 2,
  property_name: p.name,
  property_type: p.type,
  address: p.address,
  rent_amount: p.rent,
  availability_status: p.status,
  image_url: JSON.stringify([p.image]),
}));

export const getProperties = () => properties;

export const addProperty = (newProperty: Omit<Property, "property_id" | "landlord_id">) => {
  const property_id = Math.max(...properties.map(p => p.property_id), 1000) + 1;
  const property: Property = {
    ...newProperty,
    property_id,
    landlord_id: 2,
  };
  properties = [property, ...properties];
  window.dispatchEvent(new Event("properties-updated"));
  return { error: null, data: property };
};

export const updateProperty = (id: number, updates: Partial<Property>) => {
  properties = properties.map((p) => (p.property_id === id ? { ...p, ...updates } : p));
  window.dispatchEvent(new Event("properties-updated"));
  return { error: null };
};

export const deleteProperty = (id: number) => {
  properties = properties.filter((p) => p.property_id !== id);
  window.dispatchEvent(new Event("properties-updated"));
  return { error: null };
};

export const useProperties = () => {
  const [data, setData] = useState(properties);
  
  useEffect(() => {
    const listener = () => setData(getProperties());
    window.addEventListener("properties-updated", listener);
    return () => window.removeEventListener("properties-updated", listener);
  }, []);
  
  return data;
};
