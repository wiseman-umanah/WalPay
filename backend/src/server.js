import { createServer } from "node:http";
import { appHandler } from "./app.js";
import { connectToDatabase } from "./db.js";
import { appConfig, validateConfig } from "./config.js";
import { logger } from "./utils/logger.js";

let didValidate = false;
let connectPromise;

async function ensureAppReady() {
  if (!didValidate) {
    validateConfig();
    didValidate = true;
  }
  if (!connectPromise) {
    connectPromise = connectToDatabase().catch((err) => {
      connectPromise = undefined;
      throw err;
    });
  }
  return connectPromise;
}

export async function startServer() {
  await ensureAppReady();
  const server = createServer((req, res) => {
    appHandler(req, res);
  });
  server.listen(appConfig.port, () => {
    logger.info(`Backend listening on port ${appConfig.port}`);
  });
  return server;
}

export default async function handler(req, res) {
  try {
    await ensureAppReady();
  } catch (err) {
    logger.error("Failed to initialize serverless handler", err);
    res.statusCode = 500;
    res.end("Internal Server Error");
    return;
  }
  return appHandler(req, res);
}
