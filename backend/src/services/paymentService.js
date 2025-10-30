import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";
import { appConfig } from "../config.js";
import { uploadPaymentImage } from "./cloudinaryService.js";

function generateSlug(length = 10) {
  return randomBytes(length).toString("base64url").slice(0, length);
}

function calculateFee(priceFlow) {
  const feePercent = appConfig.platformFeePercent;
  return Number(((priceFlow * feePercent) / 100).toFixed(6));
}

export async function createPayment({
  sellerId,
  name,
  image,
  description,
  priceFlow,
  priceUSD,
  customSuccessMessage,
  redirectUrl,
  imageBase64,
  slug,
}) {
  if (!priceFlow && !priceUSD) {
    throw new Error("Either priceFlow or priceUSD must be provided");
  }
  const flowAmount = priceFlow
    ? Number(priceFlow)
    : convertUsdToFlow(priceUSD, process.env.FLOW_USD_RATE);
  const feeFlow = calculateFee(flowAmount);
  const totalFlow = Number((flowAmount + feeFlow).toFixed(6));
  const now = new Date();
  const db = getDb();

  const resolvedSlug = await resolvePaymentSlug(db, slug);

  let uploadedImage = null;
  if (imageBase64) {
    uploadedImage = await uploadPaymentImage(imageBase64);
  }

  const paymentDoc = {
    sellerId: sellerId.toString(),
    name,
    image: uploadedImage?.url || image || null,
    imagePublicId: uploadedImage?.publicId || null,
    description: description || null,
    customSuccessMessage: customSuccessMessage || "Thank you for your purchase!",
    redirectUrl: redirectUrl || null,
    priceFlow: flowAmount,
    priceUSD: priceUSD || null,
    feeFlow,
    totalFlow,
    paymentLink: resolvedSlug,
    status: "active",
    createdAt: now,
    updatedAt: now,
    blockchainCreateTx: null,
    blockchainDeactivateTx: null,
  };

  const { insertedId } = await db.collection("payments").insertOne(paymentDoc);
  paymentDoc._id = insertedId;
  return paymentDoc;
}

export async function setPaymentBlockchainTx(paymentId, txId) {
  const db = getDb();
  await db
    .collection("payments")
    .updateOne({ _id: toObjectId(paymentId) }, { $set: { blockchainCreateTx: txId, updatedAt: new Date() } });
}

export async function deactivatePaymentRecord(paymentId, txId) {
  const db = getDb();
  const { value } = await db
    .collection("payments")
    .findOneAndUpdate(
      { _id: toObjectId(paymentId) },
      {
        $set: {
          status: "inactive",
          blockchainDeactivateTx: txId || null,
          deactivatedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );
  return value;
}

export async function findPaymentById(paymentId) {
  const db = getDb();
  return db.collection("payments").findOne({ _id: toObjectId(paymentId), deletedAt: null });
}

export async function findPaymentBySlug(slug) {
  const db = getDb();
  return db.collection("payments").findOne({ paymentLink: slug, deletedAt: null, status: "active" });
}

export async function listPaymentsForSeller(sellerId, { limit = 20, offset = 0 } = {}) {
  const db = getDb();
  return db
    .collection("payments")
    .find({ sellerId: sellerId.toString(), deletedAt: null })
    .skip(offset)
    .limit(limit)
    .sort({ createdAt: -1 })
    .toArray();
}

function convertUsdToFlow(priceUSD, rateEnv) {
  if (!priceUSD) return null;
  const rate = Number(rateEnv || 0);
  if (!rate) {
    throw new Error("Flow/USD rate not configured. Set FLOW_USD_RATE env or provide priceFlow.");
  }
  return Number((priceUSD / rate).toFixed(6));
}

export function serializePayment(paymentDoc) {
  return {
    id: paymentDoc._id?.toString(),
    name: paymentDoc.name,
    image: paymentDoc.image,
    description: paymentDoc.description,
    customSuccessMessage: paymentDoc.customSuccessMessage,
    redirectUrl: paymentDoc.redirectUrl,
    priceFlow: paymentDoc.priceFlow,
    priceUSD: paymentDoc.priceUSD,
    feeFlow: paymentDoc.feeFlow,
    totalFlow: paymentDoc.totalFlow,
    paymentLink: paymentDoc.paymentLink,
    status: paymentDoc.status,
    createdAt: paymentDoc.createdAt,
    updatedAt: paymentDoc.updatedAt,
    blockchainCreateTx: paymentDoc.blockchainCreateTx,
    blockchainDeactivateTx: paymentDoc.blockchainDeactivateTx,
    imagePublicId: paymentDoc.imagePublicId,
  };
}

function toObjectId(id) {
  if (id instanceof ObjectId) return id;
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid payment identifier");
  }
  return new ObjectId(id);
}

async function resolvePaymentSlug(db, providedSlug) {
  if (providedSlug) {
    const normalized = normalizeSlug(providedSlug);
    if (!normalized) {
      throw new Error("Invalid payment link slug");
    }
    const existing = await db.collection("payments").findOne({ paymentLink: normalized });
    if (existing) {
      throw new Error("Payment link slug already in use");
    }
    return normalized;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateSlug(16);
    const exists = await db.collection("payments").findOne({ paymentLink: candidate });
    if (!exists) return candidate;
  }
  throw new Error("Unable to generate unique payment link");
}

function normalizeSlug(value) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}
