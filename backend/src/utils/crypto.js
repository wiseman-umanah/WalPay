import { randomBytes, pbkdf2Sync, createHash } from "node:crypto";
import { appConfig } from "../config.js";

const PASSWORD_SALT_BYTES = 16;
const PASSWORD_ITERATIONS = 120000;
const PASSWORD_KEYLEN = 64;
const PASSWORD_DIGEST = "sha512";

export function generateRandomString(byteLength = appConfig.tokenByteLength) {
  return randomBytes(byteLength).toString("base64url");
}

export function hashSha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function hashPassword(password) {
  const salt = randomBytes(PASSWORD_SALT_BYTES).toString("base64");
  const derivedKey = pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEYLEN, PASSWORD_DIGEST).toString(
    "base64"
  );
  return `${PASSWORD_ITERATIONS}.${salt}.${derivedKey}`;
}

export function verifyPassword(password, storedHash) {
  const parts = storedHash.split(".");
  if (parts.length !== 3) return false;
  const [iterationsStr, salt, storedKey] = parts;
  const iterations = Number(iterationsStr);
  const derived = pbkdf2Sync(password, salt, iterations, PASSWORD_KEYLEN, PASSWORD_DIGEST).toString("base64");
  return slowEquals(storedKey, derived);
}

export function generateOtpCode(length) {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < length; i += 1) {
    const idx = randomBytes(1)[0] % digits.length;
    code += digits[idx];
  }
  return code;
}

function slowEquals(a, b) {
  const len = Math.max(a.length, b.length);
  let result = 0;
  for (let i = 0; i < len; i += 1) {
    const codeA = a.charCodeAt(i) || 0;
    const codeB = b.charCodeAt(i) || 0;
    result |= codeA ^ codeB;
  }
  return result === 0 && a.length === b.length;
}

