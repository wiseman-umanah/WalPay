import { v2 as cloudinary } from "cloudinary";
import { appConfig } from "../config.js";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const { cloudName, apiKey, apiSecret } = appConfig.cloudinary;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary credentials missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.");
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  configured = true;
}

export async function uploadPaymentImage(base64Data) {
  if (!base64Data) return null;
  ensureConfigured();
  const data = normalizeBase64(base64Data);
  const result = await cloudinary.uploader.upload(data, {
    folder: appConfig.cloudinary.folder,
    overwrite: false,
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

export async function deletePaymentImage(publicId) {
  if (!publicId) return;
  ensureConfigured();
  await cloudinary.uploader.destroy(publicId, { invalidate: true });
}

function normalizeBase64(input) {
  if (!input.startsWith("data:")) return input;
  return input;
}
