import { useEffect, useState } from "react";
import type { Role } from "./roles";
import { users as mockUsers } from "./mock-data";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role | string;
  status: "Active" | "Pending" | "Declined" | "Invited";
  joined: string;
}

const KEY = "homesure.users";

const listeners = new Set<() => void>();
let currentUsers: User[] = [];
let initialized = false;

function load(): User[] {
  if (typeof window === "undefined") return mockUsers as User[];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      return JSON.parse(raw) as User[];
    }
    // Initialize with mock users
    localStorage.setItem(KEY, JSON.stringify(mockUsers));
    return mockUsers as User[];
  } catch {
    return mockUsers as User[];
  }
}

function ensureInit() {
  if (initialized) return;
  currentUsers = load();
  initialized = true;
}

export function getUsers(): User[] {
  ensureInit();
  return currentUsers;
}

export function saveUsers(users: User[]) {
  currentUsers = users;
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(users));
  }
  listeners.forEach((l) => l());
}

export function subscribeToUsers(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function registerUser(name: string, email: string, role: Role): User {
  ensureInit();
  const newUser: User = {
    id: `U-${Math.floor(100 + Math.random() * 900)}`,
    name,
    email,
    role,
    status: role === "super_admin" ? "Active" : "Pending",
    joined: new Date().toISOString().split("T")[0],
  };
  const updated = [newUser, ...currentUsers];
  saveUsers(updated);
  return newUser;
}

export function approveUser(id: string) {
  ensureInit();
  const updated = currentUsers.map((u) =>
    u.id === id ? { ...u, status: "Active" as const } : u
  );
  saveUsers(updated);
}

export function declineUser(id: string) {
  ensureInit();
  const updated = currentUsers.map((u) =>
    u.id === id ? { ...u, status: "Declined" as const } : u
  );
  saveUsers(updated);
}

export function useUsers(): User[] {
  const [u, setU] = useState<User[]>(() => getUsers());
  useEffect(() => {
    const fn = () => setU(getUsers());
    listeners.add(fn);
    fn();
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return u;
}
