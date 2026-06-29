import crypto from "node:crypto";
import { getSupabaseAdmin } from "@/core/db/supabase-admin.server";
import { ROLE_LABELS, type Role } from "@/features/auth/utils/roles";

export type TokenType = "verification" | "password_reset";

export function generateRawToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function createEmailToken(params: {
  type: TokenType;
  email: string;
  metadata?: Record<string, unknown>;
  expiresInHours: number;
}): Promise<string> {
  const admin = getSupabaseAdmin();
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + params.expiresInHours * 60 * 60 * 1000).toISOString();

  // Invalidate previous unused tokens of the same type for this email
  await admin
    .from("email_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("email", params.email)
    .eq("type", params.type)
    .is("used_at", null);

  const { error } = await admin.from("email_tokens").insert({
    token_hash: tokenHash,
    type: params.type,
    email: params.email,
    metadata: params.metadata ?? {},
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(`Failed to create ${params.type} token: ${error.message}`);
  }

  return rawToken;
}

export async function validateEmailToken(rawToken: string, type: TokenType) {
  const admin = getSupabaseAdmin();
  const tokenHash = hashToken(rawToken);

  const { data, error } = await admin
    .from("email_tokens")
    .select("*")
    .eq("token_hash", tokenHash)
    .eq("type", type)
    .maybeSingle();

  if (error || !data) {
    return { valid: false as const, reason: "Invalid or unknown token." };
  }

  if (data.used_at) {
    return { valid: false as const, reason: "This link has already been used." };
  }

  if (new Date(data.expires_at).getTime() < Date.now()) {
    return { valid: false as const, reason: "This link has expired." };
  }

  return { valid: true as const, token: data };
}

export async function markEmailTokenUsed(rawToken: string, type: TokenType): Promise<void> {
  const admin = getSupabaseAdmin();
  const tokenHash = hashToken(rawToken);

  const { error } = await admin
    .from("email_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("token_hash", tokenHash)
    .eq("type", type);

  if (error) {
    throw new Error(`Failed to invalidate token: ${error.message}`);
  }
}

export async function createInvitation(params: {
  email: string;
  name: string;
  role: Role;
}): Promise<{ rawToken: string; resent: boolean }> {
  const admin = getSupabaseAdmin();
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data: existing } = await admin
    .from("invitations")
    .select("id")
    .eq("email", params.email.toLowerCase())
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("invitations")
      .update({
        name: params.name,
        role: params.role,
        token_hash: tokenHash,
        expires_at: expiresAt,
      })
      .eq("id", existing.id);

    if (error) {
      throw new Error(`Failed to refresh invitation: ${error.message}`);
    }

    return { rawToken, resent: true };
  }

  const { error } = await admin.from("invitations").insert({
    email: params.email.toLowerCase(),
    name: params.name,
    role: params.role,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(`Failed to create invitation: ${error.message}`);
  }

  return { rawToken, resent: false };
}

export async function validateInvitation(rawToken: string) {
  const admin = getSupabaseAdmin();
  const tokenHash = hashToken(rawToken);

  const { data, error } = await admin
    .from("invitations")
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data) {
    return { valid: false as const, reason: "Invalid invitation link." };
  }

  if (data.accepted_at) {
    return { valid: false as const, reason: "This invitation has already been used." };
  }

  if (new Date(data.expires_at).getTime() < Date.now()) {
    return { valid: false as const, reason: "This invitation has expired." };
  }

  return {
    valid: true as const,
    invitation: {
      ...data,
      roleLabel: ROLE_LABELS[data.role as Role] || data.role,
    },
  };
}

export async function markInvitationAccepted(rawToken: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const tokenHash = hashToken(rawToken);

  const { error } = await admin
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("token_hash", tokenHash);

  if (error) {
    throw new Error(`Failed to mark invitation accepted: ${error.message}`);
  }
}

export async function getInvitationPreview(rawToken: string) {
  const result = await validateInvitation(rawToken);
  if (!result.valid) return null;

  return {
    email: result.invitation.email,
    name: result.invitation.name,
    role: result.invitation.role as Role,
    roleLabel: result.invitation.roleLabel,
  };
}
