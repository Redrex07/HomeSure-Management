import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sendInvitationEmail as sendInviteViaResend } from "@/core/email/email.service.server";
import { getAppUrl } from "@/core/email/email.config.server";

export const sendTenantInviteEmail = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      propertyId: z.string(),
      status: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const appUrl = getAppUrl();
    const invitationLink = `${appUrl}/login`;

    const result = await sendInviteViaResend({
      recipientEmail: data.email,
      recipientName: data.email.split("@")[0],
      role: `Tenant — Property #${data.propertyId}`,
      invitationLink,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true };
  });
