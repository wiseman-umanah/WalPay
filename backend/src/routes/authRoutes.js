import { registerRoute } from "../router.js";
import { sendJson, HttpError } from "../utils/http.js";
import {
  createSeller,
  findSellerByEmail,
  verifySellerPassword,
  markSellerVerified,
  updateSellerPassword,
  serializeSeller,
} from "../services/sellerService.js";
import { createOtp, verifyOtp, OTP_PURPOSES } from "../services/otpService.js";
import { createSession, refreshSession, revokeSessionByAccessToken } from "../services/sessionService.js";
import { appConfig } from "../config.js";
import { logger } from "../utils/logger.js";

function requireFields(fields, body) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === "");
  if (missing.length) {
    throw new HttpError(400, `Missing required fields: ${missing.join(", ")}`);
  }
}

registerRoute("POST", "/auth/signup", async ({ res, body }) => {
  requireFields(["email", "password", "businessName"], body);
  const email = String(body.email).toLowerCase();
  const existing = await findSellerByEmail(email);
  let seller = existing;
  if (existing && existing.verifiedAt) {
    throw new HttpError(409, "Seller already exists");
  }

  if (!seller) {
    seller = await createSeller({
      email,
      password: String(body.password),
      businessName: String(body.businessName),
      country: body.country ? String(body.country) : appConfig.defaultCountry,
      address: body.address ? String(body.address) : null,
    });
  }

  const otp = await createOtp({
    email,
    sellerId: seller._id,
    purpose: OTP_PURPOSES.SIGNUP,
  });

  logger.info("Generated signup OTP", { email });

  sendJson(res, 201, {
    message: "Signup initiated. OTP sent.",
    otpExpiresAt: otp.expiresAt,
  });
});

registerRoute("POST", "/auth/signup/verify", async ({ res, body }) => {
  requireFields(["email", "code"], body);
  const email = String(body.email).toLowerCase();
  const seller = await findSellerByEmail(email);
  if (!seller) {
    throw new HttpError(404, "Seller not found");
  }

  const result = await verifyOtp({ email, code: String(body.code), purpose: OTP_PURPOSES.SIGNUP });
  if (!result.valid) {
    throw new HttpError(400, result.reason || "OTP invalid");
  }

  let verifiedSeller = seller;
  if (!seller.verifiedAt) {
    const updated = await markSellerVerified(seller._id);
    if (updated) verifiedSeller = updated;
    else verifiedSeller = { ...seller, verifiedAt: new Date() };
  }

  const session = await createSession(seller._id);

  sendJson(res, 200, {
    message: "Signup verified",
    seller: serializeSeller(verifiedSeller),
    tokens: {
      accessToken: session.accessToken,
      accessExpiresAt: session.accessExpiresAt,
      refreshToken: session.refreshToken,
      refreshExpiresAt: session.refreshExpiresAt,
    },
  });
});

registerRoute("POST", "/auth/otp/resend", async ({ res, body }) => {
  requireFields(["email", "purpose"], body);
  const purpose = String(body.purpose);
  if (!Object.values(OTP_PURPOSES).includes(purpose)) {
    throw new HttpError(400, "Invalid OTP purpose");
  }
  const email = String(body.email).toLowerCase();
  const seller = await findSellerByEmail(email);
  if (!seller) {
    throw new HttpError(404, "Seller not found");
  }
  const otp = await createOtp({ email, sellerId: seller._id, purpose });
  sendJson(res, 200, { message: "OTP resent", otpExpiresAt: otp.expiresAt });
});

registerRoute("POST", "/auth/login", async ({ res, body }) => {
  requireFields(["email", "password"], body);
  const email = String(body.email).toLowerCase();
  const seller = await findSellerByEmail(email);
  if (!seller) throw new HttpError(404, "Seller not found");
  if (!seller.verifiedAt) throw new HttpError(403, "Seller email not verified");

  const ok = await verifySellerPassword(seller, String(body.password));
  if (!ok) throw new HttpError(401, "Invalid credentials");

  const session = await createSession(seller._id);

  sendJson(res, 200, {
    message: "Login successful",
    seller: serializeSeller(seller),
    tokens: {
      accessToken: session.accessToken,
      accessExpiresAt: session.accessExpiresAt,
      refreshToken: session.refreshToken,
      refreshExpiresAt: session.refreshExpiresAt,
    },
  });
});

registerRoute("POST", "/auth/login/otp/request", async ({ res, body }) => {
  requireFields(["email"], body);
  const email = String(body.email).toLowerCase();
  const seller = await findSellerByEmail(email);
  if (!seller) throw new HttpError(404, "Seller not found");

  await createOtp({ email, sellerId: seller._id, purpose: OTP_PURPOSES.LOGIN });
  sendJson(res, 200, { message: "Login OTP sent" });
});

registerRoute("POST", "/auth/login/otp/verify", async ({ res, body }) => {
  requireFields(["email", "code"], body);
  const email = String(body.email).toLowerCase();
  const seller = await findSellerByEmail(email);
  if (!seller) throw new HttpError(404, "Seller not found");

  const result = await verifyOtp({ email, code: String(body.code), purpose: OTP_PURPOSES.LOGIN });
  if (!result.valid) throw new HttpError(400, result.reason || "OTP invalid");

  const session = await createSession(seller._id);

  sendJson(res, 200, {
    message: "Login successful",
    seller: serializeSeller(seller),
    tokens: {
      accessToken: session.accessToken,
      accessExpiresAt: session.accessExpiresAt,
      refreshToken: session.refreshToken,
      refreshExpiresAt: session.refreshExpiresAt,
    },
  });
});

registerRoute("POST", "/auth/password/request", async ({ res, body }) => {
  requireFields(["email"], body);
  const email = String(body.email).toLowerCase();
  const seller = await findSellerByEmail(email);
  if (!seller) throw new HttpError(404, "Seller not found");
  const otp = await createOtp({ email, sellerId: seller._id, purpose: OTP_PURPOSES.RESET });
  sendJson(res, 200, { message: "Password reset OTP sent", otpExpiresAt: otp.expiresAt });
});

registerRoute("POST", "/auth/password/reset", async ({ res, body }) => {
  requireFields(["email", "code", "newPassword"], body);
  const email = String(body.email).toLowerCase();
  const seller = await findSellerByEmail(email);
  if (!seller) throw new HttpError(404, "Seller not found");
  const result = await verifyOtp({ email, code: String(body.code), purpose: OTP_PURPOSES.RESET });
  if (!result.valid) throw new HttpError(400, result.reason || "OTP invalid");
  await updateSellerPassword(seller._id, String(body.newPassword));
  sendJson(res, 200, { message: "Password reset successful" });
});

registerRoute(
  "POST",
  "/auth/logout",
  async ({ res, session, authToken }) => {
    if (!session) throw new HttpError(401, "Unauthorized");
    if (authToken) {
      await revokeSessionByAccessToken(authToken);
    }
    sendJson(res, 200, { message: "Logged out" });
  },
  { requireAuth: true }
);

registerRoute("POST", "/auth/refresh", async ({ res, body }) => {
  requireFields(["refreshToken"], body);
  const refreshed = await refreshSession(String(body.refreshToken));
  if (!refreshed) throw new HttpError(401, "Invalid refresh token");
  sendJson(res, 200, {
    message: "Token refreshed",
    tokens: {
      accessToken: refreshed.accessToken,
      accessExpiresAt: refreshed.session.accessExpiresAt,
      refreshToken: refreshed.refreshToken,
      refreshExpiresAt: refreshed.session.refreshExpiresAt,
    },
  });
});
