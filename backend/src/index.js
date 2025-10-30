import { startServer } from "./server.js";
import { logger } from "./utils/logger.js";

startServer().catch((err) => {
  logger.error("Failed to start server", err);
  process.exit(1);
});

