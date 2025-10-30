import { createServer } from "node:http";
import { appHandler } from "./app.js";
import { connectToDatabase } from "./db.js";
import { appConfig, validateConfig } from "./config.js";
import { logger } from "./utils/logger.js";

export async function startServer() {
  validateConfig();
  await connectToDatabase();
  const server = createServer((req, res) => {
    appHandler(req, res);
  });
  server.listen(appConfig.port, () => {
    logger.info(`Backend listening on port ${appConfig.port}`);
  });
  return server;
}

