import { getDb } from "../db.js";
import { appConfig } from "../config.js";
import { generateOtpCode, hashSha256 } from "../utils/crypto.js";
import { minutesFromNow } from "../utils/time.js";
import { sendOtpEmail } from "./emailService.js";

const PURPOSES = {
  SIGNUP: "signup",
  LOGIN: "login",
  RESET: "reset",
};

export { PURPOSES as OTP_PURPOSES };

export async function createOtp({ email, sellerId, purpose, ttlMinutes = appConfig.otpTtlMinutes }) {
  const code = generateOtpCode(appConfig.otpLength);
  const db = getDb();
  const now = new Date();
  const expiresAt = minutesFromNow(ttlMinutes);
  await db.collection("otps").insertOne({
    email,
    sellerId,
    purpose,
    codeHash: hashSha256(code),
    createdAt: now,
    expiresAt,
    consumedAt: null,
  });
  await sendOtpEmail({
    to: email,
    code,
    purpose,
    expiresAt,
  });
  return { code, expiresAt };
}

export async function verifyOtp({ email, code, purpose }) {
  const db = getDb();
  const hashed = hashSha256(code);
  const otpDoc = await db
    .collection("otps")
    .findOne({ email, purpose, consumedAt: null }, { sort: { createdAt: -1 } });
  if (!otpDoc) {
    return { valid: false, reason: "OTP not found" };
  }
  if (otpDoc.codeHash !== hashed) {
    return { valid: false, reason: "Invalid OTP" };
  }
  if (otpDoc.expiresAt < new Date()) {
    return { valid: false, reason: "OTP expired" };
  }
  await db.collection("otps").updateOne({ _id: otpDoc._id }, { $set: { consumedAt: new Date() } });
  return { valid: true, otp: otpDoc };
}
