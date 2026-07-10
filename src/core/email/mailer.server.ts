import * as nodemailer from "nodemailer";
import { getEmailConfig } from "./email.config.server";

type MailTransporter = ReturnType<typeof nodemailer.createTransport>;

let transporter: MailTransporter | undefined;

function getTransporter(): MailTransporter {
  if (transporter) {
    return transporter;
  }

  const config = getEmailConfig();

  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: config.emailUser,
      pass: config.emailPass,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });

  return transporter;
}

export async function sendMail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ messageId?: string }> {
  const config = getEmailConfig();
  const info = await getTransporter().sendMail({
    from: config.emailFrom,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  return { messageId: info.messageId };
}
