import { MongoClient } from "mongodb";
import { appConfig } from "./config.js";

let client;
let database;

export async function connectToDatabase() {
  if (database) return database;
  client = new MongoClient(appConfig.mongoUri, {
    maxPoolSize: 10,
  });
  await client.connect();
  database = client.db();
  await ensureIndexes(database);
  return database;
}

export function getDb() {
  if (!database) {
    throw new Error("Database not initialized. Call connectToDatabase() first.");
  }
  return database;
}

export async function closeDatabase() {
  if (client) {
    await client.close();
    client = undefined;
    database = undefined;
  }
}

async function ensureIndexes(db) {
  await db.collection("sellers").createIndex({ email: 1 }, { unique: true });
  await db.collection("sellers").createIndex({ address: 1 }, { sparse: true });

  await db
    .collection("otps")
    .createIndex({ email: 1, purpose: 1, expiresAt: 1, consumedAt: 1 });
  await db.collection("otps").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  await db
    .collection("sessions")
    .createIndex({ accessTokenHash: 1, revokedAt: 1, accessExpiresAt: 1 });
  await db.collection("sessions").createIndex({ refreshTokenHash: 1 });
  await db.collection("sessions").createIndex({ refreshExpiresAt: 1 });

  await db.collection("payments").createIndex({ sellerId: 1, createdAt: -1 });
  await db.collection("payments").createIndex({ paymentLink: 1 }, { unique: true });

  await db.collection("transactions").createIndex({ paymentId: 1, createdAt: -1 });
}

