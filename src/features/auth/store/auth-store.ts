import { useEffect, useState, useSyncExternalStore } from "react";
import type { Role } from "./roles";

const KEY = "homesure.session";

export interface Session {
  email: string;
  name: string;
  role: Role;
}

const listeners = new Set<() => void>();
let current: Session | null = null;
let initialized = false;

function load(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  current = load();
  initialized = true;
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
    return () => { listeners.delete(fn); };
  }, []);
  return s;
}
