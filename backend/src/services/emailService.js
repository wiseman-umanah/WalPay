import nodemailer from "nodemailer";
import { appConfig } from "../config.js";
import { logger } from "../utils/logger.js";

let transporter;

function ensureTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: appConfig.email.host,
    port: appConfig.email.port,
    secure: appConfig.email.secure,
    auth: {
      user: appConfig.email.user,
      pass: appConfig.email.pass,
    },
  });
  return transporter;
}

export async function sendOtpEmail({ to, code, purpose, expiresAt }) {
  const transport = ensureTransporter();
  const subject = otpSubject(purpose);
  const body = otpBody({ code, purpose, expiresAt });
  try {
    await transport.sendMail({
      from: appConfig.email.defaultFrom,
      to,
      subject,
      html: body,
    });
    logger.info("OTP email queued", { to, purpose });
  } catch (error) {
    logger.error("Failed to send OTP email", error);
    throw error;
  }
}

function otpSubject(purpose) {
  switch (purpose) {
    case "login":
      return "Your WalPay login code";
    case "reset":
      return "Reset your WalPay password";
    default:
      return "Verify your WalPay account";
  }
}

function otpBody({ code, purpose, expiresAt }) {
  const expiryText = expiresAt ? new Date(expiresAt).toLocaleString() : "soon";
  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <h2 style="color:#0f9d58;">WalPay</h2>
    <p>Use the verification code below for your ${purpose} request.</p>
    <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 24px 0;">${code}</div>
    <p>This code will expire at <strong>${expiryText}</strong>. If you did not request this, you can ignore this email.</p>
    <p style="margin-top: 32px;">Thanks,<br/>The WalPay team</p>
  </div>
  `;
}
