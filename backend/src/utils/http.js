import { StringDecoder } from "node:string_decoder";

export async function readJsonBody(req) {
  const chunks = [];
  const decoder = new StringDecoder("utf8");
  for await (const chunk of req) {
    chunks.push(decoder.write(chunk));
  }
  chunks.push(decoder.end());
  const raw = chunks.join("").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new HttpError(400, "Invalid JSON body");
  }
}

export function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function parseBearerToken(headerValue) {
  if (!headerValue) return null;
  const [scheme, token] = headerValue.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token.trim();
}

