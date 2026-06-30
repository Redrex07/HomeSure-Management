import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import process from "node:process";

let adminClient: SupabaseClient | null = null;

function getMissingSupabaseAdminEnv(url?: string, serviceKey?: string): string[] {
  const missing: string[] = [];

  if (!url) {
    missing.push("SUPABASE_URL");
  }

  if (!serviceKey) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  return missing;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_service_role_key;
  const missing = getMissingSupabaseAdminEnv(url, serviceKey);

  if (missing.length > 0) {
    throw new Error(
      `Missing Supabase admin credentials: ${missing.join(", ")}. Set SUPABASE_SERVICE_ROLE_KEY as a server-side environment variable in Vercel Production. The legacy lowercase supabase_service_role_key name is also accepted.`
    );
  }

  adminClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return adminClient;
}
