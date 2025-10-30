import { parseBearerToken } from "../utils/http.js";
import { authenticateAccessToken } from "../services/sessionService.js";
import { getDb } from "../db.js";

export async function resolveAuthContext(req) {
  const token = parseBearerToken(req.headers.authorization);
  if (!token) return { currentSeller: null, session: null, token: null };

  const session = await authenticateAccessToken(token);
  if (!session) return { currentSeller: null, session: null, token: null };

  const db = getDb();
  const seller = await db.collection("sellers").findOne({ _id: session.sellerId, deletedAt: null });
  if (!seller) return { currentSeller: null, session: null, token: null };
  return { currentSeller: seller, session, token };
}

