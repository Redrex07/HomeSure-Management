import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy route — redirects to the token-based verification flow. */
export const Route = createFileRoute("/auth/confirm")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || "",
  }),
  beforeLoad: ({ search }) => {
    if (search.token) {
      throw redirect({ to: "/auth/verify", search: { token: search.token } });
    }
    throw redirect({ to: "/verify-email", search: (prev: any) => prev });
  },
});
