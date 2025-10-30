import { getDb } from "../db.js";

export async function recordTransaction({
  sellerId,
  paymentId,
  txId,
  kind,
  payerAddress,
  paymentName,
  paymentSlug,
}) {
  const db = getDb();
  const doc = {
    sellerId: sellerId.toString(),
    paymentId: paymentId.toString(),
    txId,
    kind,
    payerAddress: payerAddress || null,
    paymentName: paymentName || null,
    paymentSlug: paymentSlug || null,
    createdAt: new Date(),
  };
  const { insertedId } = await db.collection("transactions").insertOne(doc);
  doc._id = insertedId;
  return doc;
}

export async function listTransactionsForSeller(sellerId, { limit = 25, offset = 0 } = {}) {
  const db = getDb();
  return db
    .collection("transactions")
    .find({ sellerId: sellerId.toString() })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .toArray();
}

export async function listTransactionsForPayment(paymentId) {
  const db = getDb();
  return db.collection("transactions").find({ paymentId: paymentId.toString() }).sort({ createdAt: -1 }).toArray();
}
