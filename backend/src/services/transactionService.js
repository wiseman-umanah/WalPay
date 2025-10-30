import { getDb } from "../db.js";

export async function recordTransaction({ sellerId, paymentId, txId, kind, payerAddress }) {
  const db = getDb();
  const doc = {
    sellerId: sellerId.toString(),
    paymentId: paymentId.toString(),
    txId,
    kind,
    payerAddress: payerAddress || null,
    createdAt: new Date(),
  };
  const { insertedId } = await db.collection("transactions").insertOne(doc);
  doc._id = insertedId;
  return doc;
}

export async function listTransactionsForPayment(paymentId) {
  const db = getDb();
  return db.collection("transactions").find({ paymentId: paymentId.toString() }).sort({ createdAt: -1 }).toArray();
}
