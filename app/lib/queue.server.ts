import { Queue } from "bullmq";
import type { SendEmailOptions } from "./email.server";

const connection = {
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
};

export const emailQueue = new Queue<SendEmailOptions>("email", { connection });

export async function sendEmailJob(options: SendEmailOptions) {
  await emailQueue.add("send", options, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  });
}
