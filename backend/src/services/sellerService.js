import { ObjectId } from "mongodb";
import { getDb } from "../db.js";
import { hashPassword, verifyPassword } from "../utils/crypto.js";
import { appConfig } from "../config.js";

export async function createSeller({ email, password, businessName, country, address }) {
  const db = getDb();
  const now = new Date();
  const sellerDoc = {
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    businessName,
    country: country || appConfig.defaultCountry,
    address: address || null,
    joinedAt: now,
    verifiedAt: null,
    deletedAt: null,
  };

  const result = await db.collection("sellers").insertOne(sellerDoc);
  sellerDoc._id = result.insertedId;
  return sellerDoc;
}

export async function findSellerByEmail(email) {
  const db = getDb();
  return db.collection("sellers").findOne({ email: email.toLowerCase(), deletedAt: null });
}

export async function verifySellerPassword(seller, password) {
  return verifyPassword(password, seller.passwordHash);
}

export async function markSellerVerified(sellerId) {
  const db = getDb();
  const { value } = await db
    .collection("sellers")
    .findOneAndUpdate(
      { _id: sellerId, deletedAt: null },
      { $set: { verifiedAt: new Date() } },
      { returnDocument: "after" }
    );
  return value;
}

export async function updateSellerPassword(sellerId, password) {
  const db = getDb();
  const { value } = await db
    .collection("sellers")
    .findOneAndUpdate(
      { _id: sellerId, deletedAt: null },
      { $set: { passwordHash: hashPassword(password), updatedAt: new Date() } },
      { returnDocument: "after" }
    );
  return value;
}

export async function updateSellerProfile(sellerId, { businessName, country }) {
  const db = getDb();
  const updates = {};
  if (businessName) updates.businessName = businessName;
  if (country) updates.country = country;
  if (!Object.keys(updates).length) return await db.collection("sellers").findOne({ _id: sellerId });

  updates.updatedAt = new Date();

  const { value } = await db
    .collection("sellers")
    .findOneAndUpdate({ _id: sellerId, deletedAt: null }, { $set: updates }, { returnDocument: "after" });
  return value;
}

export async function deleteSellerAndData(sellerId) {
  const db = getDb();
  const now = new Date();
  await db.collection("sellers").updateOne({ _id: sellerId }, { $set: { deletedAt: now } });
  await db.collection("payments").updateMany({ sellerId: sellerId.toString() }, { $set: { deletedAt: now } });
  await db.collection("transactions").updateMany({ sellerId: sellerId.toString() }, { $set: { deletedAt: now } });
  await db.collection("sessions").updateMany({ sellerId }, { $set: { revokedAt: now } });
}

export function serializeSeller(seller) {
  const { passwordHash, ...rest } = seller;
  return {
    id: seller._id?.toString(),
    email: seller.email,
    businessName: seller.businessName,
    country: seller.country,
    address: seller.address,
    joinedAt: seller.joinedAt,
    verifiedAt: seller.verifiedAt,
  };
}
