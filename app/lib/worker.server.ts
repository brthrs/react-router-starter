import { Worker } from "bullmq";
import type { SendEmailOptions } from "./email.server";
import { transporter } from "./email.server";
import { logger } from "./logger.server";

const log = logger.child({ module: "email-worker" });

const connection = {
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
};

export const emailWorker = new Worker<SendEmailOptions>(
  "email",
  async (job) => {
    const { to, subject, text, html } = job.data;
    const from = process.env.SMTP_FROM ?? "noreply@example.com";

    log.info({ to, subject, jobId: job.id }, "Processing email job");
    await transporter.sendMail({ from, to, subject, text, html });
    log.info({ to, subject, jobId: job.id }, "Email sent successfully");
  },
  {
    connection,
    concurrency: 5,
  },
);

emailWorker.on("failed", (job, err) => {
  log.error({ err, jobId: job?.id, to: job?.data.to }, "Email job failed");
});
