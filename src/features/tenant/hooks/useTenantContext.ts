import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/features/auth/store/auth-store";
import { getTenantByEmail } from "@/core/db/supabase-queries";

export function useTenantContext() {
  const session = useSession();
  const isTenant = session?.role === "tenant";

  const {
    data: tenant,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tenant-context", session?.email, session?.id],
    queryFn: () => getTenantByEmail(session!.email, session?.id),
    enabled: isTenant && !!session?.email,
  });

  return {
    isTenant,
    tenant,
    tenantId: tenant?.tenant_id ?? null,
    propertyId: tenant?.activePropertyId ?? null,
    isLoading: isTenant && isLoading,
    error,
    session,
  };
}
