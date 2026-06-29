import { createFileRoute } from "@tanstack/react-router";
import { sendTestEmail } from "@/core/email/email.service.server";

/**
 * TEMPORARY: Remove this route before production deployment.
 * POST /api/test-email — sends a test email via Resend.
 */
export const Route = createFileRoute("/api/test-email")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { email?: string };

          if (!body.email) {
            return Response.json({ success: false, error: "Email address is required." }, { status: 400 });
          }

          const result = await sendTestEmail(body.email);

          if (!result.success) {
            return Response.json({ success: false, error: result.error }, { status: 500 });
          }

          return Response.json({
            success: true,
            message: `Test email sent to ${body.email}`,
            id: result.id,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unexpected server error";
          console.error("[TestEmail] Error:", message);
          return Response.json({ success: false, error: message }, { status: 500 });
        }
      },
    },
  },
});
