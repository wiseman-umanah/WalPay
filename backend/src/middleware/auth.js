import { parseBearerToken } from "../utils/http.js";
import { authenticateAccessToken } from "../services/sessionService.js";
import { getDb } from "../db.js";
import { logger } from "../utils/logger.js";

export async function resolveAuthContext(req) {
  const rawAuth = req.headers && (req.headers.authorization || req.headers.Authorization || null);
  logger.debug && logger.debug("resolveAuthContext: raw authorization header", { header: rawAuth });

  const token = parseBearerToken(rawAuth);
  if (!token) {
    logger.debug && logger.debug("resolveAuthContext: no bearer token found");
    return { currentSeller: null, session: null, token: null };
  }

  const session = await authenticateAccessToken(token);
  if (!session) {
    logger.info && logger.info("resolveAuthContext: token failed to authenticate", { tokenPreview: String(token).slice(0, 8) + "..." });
    return { currentSeller: null, session: null, token: null };
  }

  const db = getDb();
  const seller = await db.collection("sellers").findOne({ _id: session.sellerId, deletedAt: null });
  if (!seller) {
    logger.info && logger.info("resolveAuthContext: session found but seller missing", { sellerId: session.sellerId });
    return { currentSeller: null, session: null, token: null };
  }
  logger.debug && logger.debug("resolveAuthContext: authenticated seller", { sellerId: seller._id?.toString() });
  return { currentSeller: seller, session, token };
}

