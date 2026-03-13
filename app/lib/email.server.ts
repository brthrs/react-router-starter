import nodemailer from "nodemailer";
import { logger } from "./logger.server";
import { renderEmail } from "./email-templates.server";

const log = logger.child({ module: "email" });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SendEmailWithTemplate {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, string>;
}

export type SendEmailInput = SendEmailOptions | SendEmailWithTemplate;

function isTemplateEmail(input: SendEmailInput): input is SendEmailWithTemplate {
  return "template" in input;
}

function resolveEmail(input: SendEmailInput): SendEmailOptions {
  if (!isTemplateEmail(input)) return input;

  const { html, text } = renderEmail(input.template, input.variables);
  return { to: input.to, subject: input.subject, html, text };
}

export function sendEmail(input: SendEmailInput): void {
  const options = resolveEmail(input);

  if (process.env.QUEUE_EMAILS === "true") {
    import("./queue.server").then(({ sendEmailJob }) => {
      sendEmailJob(options).catch((err) => {
        log.error({ err, to: options.to, subject: options.subject }, "Failed to queue email");
      });
    });
    return;
  }

  const from = process.env.SMTP_FROM ?? "noreply@example.com";
  transporter.sendMail({ from, ...options }).catch((err) => {
    log.error({ err, to: options.to, subject: options.subject }, "Failed to send email");
  });
}

export { transporter };
