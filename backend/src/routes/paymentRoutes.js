import { registerRoute } from "../router.js";
import { sendJson, HttpError } from "../utils/http.js";
import {
  createPayment,
  listPaymentsForSeller,
  findPaymentById,
  deactivatePaymentRecord,
  serializePayment,
  findPaymentBySlug,
  setPaymentBlockchainTx,
} from "../services/paymentService.js";
import { recordTransaction } from "../services/transactionService.js";
import { flowService } from "../services/flowService.js";

registerRoute(
  "POST",
  "/payments",
  async ({ res, body, seller }) => {
    if (!seller) throw new HttpError(401, "Unauthorized");
    if (!body.name) throw new HttpError(400, "name is required");
    if (body.priceFlow === undefined && body.priceUSD === undefined) {
      throw new HttpError(400, "Either priceFlow or priceUSD must be provided");
    }

    const payment = await createPayment({
      sellerId: seller._id,
      name: String(body.name),
      image: body.image || null,
      description: body.description || null,
      priceFlow: body.priceFlow !== undefined ? Number(body.priceFlow) : null,
      priceUSD: body.priceUSD ? Number(body.priceUSD) : null,
      customSuccessMessage: body.customSuccessMessage,
      redirectUrl: body.redirectUrl,
      imageBase64: body.imageBase64,
      slug: body.slug ? String(body.slug) : undefined,
    });

    if (body.blockchainTxId) {
      await setPaymentBlockchainTx(payment._id, body.blockchainTxId);
      await flowService.submitCreatePaymentTx({ txId: body.blockchainTxId, sellerAddress: seller.address });
      payment.blockchainCreateTx = body.blockchainTxId;
    }

    sendJson(res, 201, { payment: serializePayment(payment) });
  },
  { requireAuth: true }
);

registerRoute(
  "GET",
  "/payments",
  async ({ res, seller, query }) => {
    if (!seller) throw new HttpError(401, "Unauthorized");
    const limit = query.limit ? Number(query.limit) : 20;
    const offset = query.offset ? Number(query.offset) : 0;
    const payments = await listPaymentsForSeller(seller._id, { limit, offset });
    sendJson(res, 200, {
      items: payments.map(serializePayment),
      pagination: { limit, offset, count: payments.length },
    });
  },
  { requireAuth: true }
);

registerRoute(
  "GET",
  "/payments/:id",
  async ({ res, seller, params }) => {
    if (!seller) throw new HttpError(401, "Unauthorized");
    const payment = await findPaymentById(params.id);
    if (!payment || payment.sellerId !== seller._id.toString()) {
      throw new HttpError(404, "Payment not found");
    }
    sendJson(res, 200, { payment: serializePayment(payment) });
  },
  { requireAuth: true }
);

registerRoute(
  "DELETE",
  "/payments/:id",
  async ({ res, seller, params, body }) => {
    if (!seller) throw new HttpError(401, "Unauthorized");
    const payment = await findPaymentById(params.id);
    if (!payment || payment.sellerId !== seller._id.toString()) {
      throw new HttpError(404, "Payment not found");
    }
    const txId = body?.txId || null;
    if (txId) {
      await flowService.submitDeactivatePaymentTx({ txId, sellerAddress: seller.address });
    }
    const updated = await deactivatePaymentRecord(params.id, txId);
    sendJson(res, 200, { payment: serializePayment(updated) });
  },
  { requireAuth: true }
);

registerRoute(
  "POST",
  "/payments/:id/transactions",
  async ({ res, seller, params, body }) => {
    if (!seller) throw new HttpError(401, "Unauthorized");
    const payment = await findPaymentById(params.id);
    if (!payment || payment.sellerId !== seller._id.toString()) {
      throw new HttpError(404, "Payment not found");
    }
    if (!body.txId || !body.kind) throw new HttpError(400, "txId and kind are required");
    const record = await recordTransaction({
      sellerId: seller._id,
      paymentId: payment._id,
      txId: String(body.txId),
      kind: String(body.kind),
      payerAddress: body.payerAddress ? String(body.payerAddress) : null,
    });
    if (body.kind === "payment") {
      await flowService.submitPaymentTx({ txId: body.txId, sellerAddress: seller.address });
    }
    sendJson(res, 201, { transaction: record });
  },
  { requireAuth: true }
);

registerRoute("POST", "/public/payments/:id/transactions", async ({ res, params, body }) => {
  if (!body?.txId || !body.kind) {
    throw new HttpError(400, "txId and kind are required");
  }
  const payment = await findPaymentById(params.id);
  if (!payment) {
    throw new HttpError(404, "Payment not found");
  }
  const record = await recordTransaction({
    sellerId: payment.sellerId,
    paymentId: payment._id,
    txId: String(body.txId),
    kind: String(body.kind),
    payerAddress: body.payerAddress ? String(body.payerAddress) : null,
  });
  sendJson(res, 201, { transaction: record });
});

registerRoute("GET", "/public/payments/:slug", async ({ res, params }) => {
  const payment = await findPaymentBySlug(params.slug);
  if (!payment) {
    throw new HttpError(404, "Payment not found");
  }
  sendJson(res, 200, { payment: serializePayment(payment) });
});
