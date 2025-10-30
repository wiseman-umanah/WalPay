import { logger } from "../utils/logger.js";

/**
 * Placeholder Flow integration hooks. Wire these into Cadence transactions or Flow Client Library.
 */
export const flowService = {
  async submitCreatePaymentTx(payload) {
    logger.info("flowService.submitCreatePaymentTx placeholder invoked", payload);
    return { txId: payload.txId ?? "mock-create-tx" };
  },
  async submitDeactivatePaymentTx(payload) {
    logger.info("flowService.submitDeactivatePaymentTx placeholder invoked", payload);
    return { txId: payload.txId ?? "mock-deactivate-tx" };
  },
  async submitPaymentTx(payload) {
    logger.info("flowService.submitPaymentTx placeholder invoked", payload);
    return { txId: payload.txId ?? "mock-pay-tx" };
  },
};

