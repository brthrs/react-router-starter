import "dotenv/config";
import "../app/lib/worker.server";
import { logger } from "../app/lib/logger.server";

const log = logger.child({ module: "worker" });
log.info("Email worker started");

process.on("SIGTERM", () => {
  log.info("Shutting down email worker");
  process.exit(0);
});
