import { createServerFn } from "@tanstack/react-start";
import nodemailer from "nodemailer";

export const sendTenantInviteEmail = createServerFn({ method: "POST" })
  .validator((data: { email: string; propertyId: string; status: string }) => data)
  .handler(async ({ data }) => {
    try {
      // Create a test account for ethereal email
      const testAccount = await nodemailer.createTestAccount();

      // Create reusable transporter object using the default SMTP transport
      const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });

      // send mail with defined transport object
      const info = await transporter.sendMail({
        from: '"HomeSure Management" <noreply@homesure.app>',
        to: data.email,
        subject: "Welcome to HomeSure - Tenant Invite",
        text: `Hello! You have been invited to property #${data.propertyId}. Your current status is: ${data.status}.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #333;">Welcome to HomeSure!</h2>
            <p>Hello,</p>
            <p>You have been invited as a tenant for <strong>Property #${data.propertyId}</strong>.</p>
            <p>Your onboarding status is currently: <span style="background-color: #f0fdf4; color: #166534; padding: 4px 8px; border-radius: 4px;">${data.status}</span></p>
            <br/>
            <p>Please log in to the tenant portal to complete your profile.</p>
            <br/>
            <p style="color: #888; font-size: 12px;">This is an automated message from HomeSure Management.</p>
          </div>
        `,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", previewUrl);

      return {
        success: true,
        previewUrl,
      };
    } catch (error) {
      console.error("Error sending email:", error);
      return { success: false, error: String(error) };
    }
  });
