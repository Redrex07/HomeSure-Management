export type Role =
  | "super_admin"
  | "service_admin"
  | "landlord"
  | "tenant"
  | "contractor"
  | "realtor";

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  service_admin: "Service Admin",
  landlord: "Landlord",
  tenant: "Tenant",
  contractor: "Contractor",
  realtor: "Realtor",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: "Full platform control & revenue analytics",
  service_admin: "Manage service requests & contractors",
  landlord: "Properties, tenants, leases & rent",
  tenant: "Pay rent, request maintenance, view lease",
  contractor: "Jobs, estimates & invoices",
  realtor: "Listings, readiness & onboarding",
};
