import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export function sendEmail({ to, subject, text, html }: SendEmailOptions): void {
  const from = process.env.SMTP_FROM ?? "noreply@example.com";

  transporter.sendMail({ from, to, subject, text, html }).catch((err) => {
    console.error("[email] Failed to send email:", err);
  });
}
