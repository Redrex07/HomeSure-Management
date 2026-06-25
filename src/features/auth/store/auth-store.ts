import { useEffect, useState } from "react";
import type { Role } from "@/features/auth/utils/roles";
import { getUsers, subscribeToUsers } from "./users-store";

const KEY = "homesure.session";

export interface Session {
  id?: string;
  email: string;
  name: string;
  role: Role;
  status?: "Active" | "Pending" | "Declined" | "Invited";
}

const listeners = new Set<() => void>();
let current: Session | null = null;
let initialized = false;

function load(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s.id) s.id = "2"; // Default fallback ID
    
    // Sync status with dynamic users store
    const users = getUsers();
    const found = users.find((u) => u.email.toLowerCase() === s.email.toLowerCase());
    if (found) {
      s.status = found.status;
    } else {
      // Default mock users from list if not found
      s.status = s.status || "Active";
    }
    return s;
  } catch {
    return null;
  }
}

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  current = load();
  initialized = true;
}

// Subscribe to users updates to sync session status
if (typeof window !== "undefined") {
  subscribeToUsers(() => {
    current = load();
    listeners.forEach((l) => l());
  });
}

export function getSession(): Session | null {
  ensureInit();
  return current;
}

export function setSession(s: Session | null) {
  current = s;
  if (typeof window !== "undefined") {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  }
  listeners.forEach((l) => l());
}

export function setRole(role: Role) {
  const s = getSession();
  if (!s) return;
  setSession({ ...s, role });
}

export function useSession(): Session | null {
  const [s, setS] = useState<Session | null>(() => getSession());
  useEffect(() => {
    const fn = () => setS(getSession());
    listeners.add(fn);
    fn();
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return s;
}

