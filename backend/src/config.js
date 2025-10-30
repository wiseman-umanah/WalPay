import { env } from "node:process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  const raw = readFileSync(envPath, "utf8");
  raw.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key && !(key in env)) {
      env[key] = value;
    }
  });
}

const DEFAULT_PORT = 4000;
const DEFAULT_MONGO_URI = env.DB_URI;

export const appConfig = {
  port: Number(env.PORT || DEFAULT_PORT),
  mongoUri: env.MONGO_URI || DEFAULT_MONGO_URI,
  platformFeePercent: Number(env.PLATFORM_FEE_PERCENT || 2),
  accessTokenTtlMinutes: Number(env.ACCESS_TOKEN_TTL_MINUTES || 15),
  refreshTokenTtlDays: Number(env.REFRESH_TOKEN_TTL_DAYS || 30),
  sessionMaxLifeDays: Number(env.SESSION_MAX_LIFE_DAYS || 60),
  otpTtlMinutes: Number(env.OTP_TTL_MINUTES || 10),
  otpLength: Number(env.OTP_LENGTH || 6),
  tokenByteLength: Number(env.TOKEN_BYTE_LENGTH || 48),
  defaultCountry: env.DEFAULT_COUNTRY || "Nigeria",
  allowedOrigins: parseOrigins(env.CORS_ORIGINS),
  email: {
    host: env.MAIL_HOST || "",
    port: env.MAIL_PORT ? Number(env.MAIL_PORT) : 587,
    secure: env.MAIL_SECURE === "true",
    user: env.MAIL_USER || "",
    pass: env.MAIL_PASSWORD || "",
    defaultFrom: env.MAIL_FROM || env.MAIL_USER || "",
  },
  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: env.CLOUDINARY_API_KEY || "",
    apiSecret: env.CLOUDINARY_API_SECRET || "",
    folder: env.CLOUDINARY_FOLDER || "walp",
  },
};

export function validateConfig() {
  if (!appConfig.mongoUri) {
    throw new Error("Missing MongoDB connection string. Set MONGO_URI.");
  }
  if (!appConfig.email.host || !appConfig.email.user || !appConfig.email.pass) {
    throw new Error("Missing mail configuration. Set MAIL_HOST, MAIL_USER and MAIL_PASSWORD.");
  }
  if (!appConfig.email.defaultFrom) {
    throw new Error("Missing outbound email sender. Set MAIL_FROM or MAIL_USER.");
  }
}

function parseOrigins(originEnv) {
  if (!originEnv) return ["*"];
  return originEnv.split(",").map((value) => value.trim()).filter(Boolean);
}
