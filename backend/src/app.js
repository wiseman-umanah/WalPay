import { handleRequest } from "./router.js";
import { resolveAuthContext } from "./middleware/auth.js";
import "./routes/authRoutes.js";
import "./routes/paymentRoutes.js";
import "./routes/profileRoutes.js";
import { sendJson } from "./utils/http.js";
import { logger } from "./utils/logger.js";
import { applyCors, handlePreflight } from "./middleware/cors.js";

export async function appHandler(req, res) {
  try {
    applyCors(req, res);
    if (handlePreflight(req, res)) {
      return;
    }
    const context = await resolveAuthContext(req);
    await handleRequest(req, res, context);
  } catch (err) {
    logger.error("Unhandled app error", err);
    sendJson(res, 500, { error: "Internal Server Error" });
  }
}
