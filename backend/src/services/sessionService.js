import { getDb } from "../db.js";
import { appConfig } from "../config.js";
import { daysFromNow, minutesFromNow } from "../utils/time.js";
import { generateRandomString, hashSha256 } from "../utils/crypto.js";

export async function createSession(sellerId) {
  const accessToken = generateRandomString(32);
  const refreshToken = generateRandomString(48);

  const accessExpiresAt = minutesFromNow(appConfig.accessTokenTtlMinutes);
  const refreshExpiresAt = daysFromNow(appConfig.refreshTokenTtlDays);
  const sessionExpiresAt = daysFromNow(appConfig.sessionMaxLifeDays);
  const now = new Date();

  const db = getDb();
  const { insertedId } = await db.collection("sessions").insertOne({
    sellerId,
    accessTokenHash: hashSha256(accessToken),
    refreshTokenHash: hashSha256(refreshToken),
    accessExpiresAt,
    refreshExpiresAt,
    sessionExpiresAt,
    createdAt: now,
    updatedAt: now,
    revokedAt: null,
    rotationCount: 0,
  });

  return {
    sessionId: insertedId,
    accessToken,
    refreshToken,
    accessExpiresAt,
    refreshExpiresAt,
  };
}

export async function authenticateAccessToken(token) {
  const db = getDb();
  const hashed = hashSha256(token);
  const session = await db.collection("sessions").findOne({
    accessTokenHash: hashed,
    revokedAt: null,
    accessExpiresAt: { $gt: new Date() },
  });
  if (!session) return null;
  return session;
}

export async function refreshSession(refreshToken) {
  const db = getDb();
  const hashed = hashSha256(refreshToken);
  const session = await db.collection("sessions").findOne({
    refreshTokenHash: hashed,
    revokedAt: null,
    refreshExpiresAt: { $gt: new Date() },
    sessionExpiresAt: { $gt: new Date() },
  });
  if (!session) return null;

  const newAccessToken = generateRandomString(32);
  const newRefreshToken = generateRandomString(48);
  const now = new Date();
  const updated = await db.collection("sessions").findOneAndUpdate(
    { _id: session._id },
    {
      $set: {
        accessTokenHash: hashSha256(newAccessToken),
        refreshTokenHash: hashSha256(newRefreshToken),
        accessExpiresAt: minutesFromNow(appConfig.accessTokenTtlMinutes),
        refreshExpiresAt: daysFromNow(appConfig.refreshTokenTtlDays),
        updatedAt: now,
      },
      $inc: { rotationCount: 1 },
    },
    { returnDocument: "after" }
  );

  return {
    session: updated.value,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function revokeSessionById(sessionId) {
  const db = getDb();
  await db
    .collection("sessions")
    .updateOne({ _id: sessionId }, { $set: { revokedAt: new Date(), updatedAt: new Date() } });
}

export async function revokeSessionByAccessToken(token) {
  const db = getDb();
  const hashed = hashSha256(token);
  await db
    .collection("sessions")
    .updateOne({ accessTokenHash: hashed, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

