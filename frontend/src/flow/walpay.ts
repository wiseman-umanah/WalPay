import { arg, mutate, tx, t } from "@onflow/fcl";
import { flowConfig, toUFix64 } from "./config";

const CREATE_PAYMENT_TX = `
import WalPay from ${flowConfig.walpayAddress}

transaction(id: String, amount: UFix64) {
    prepare(signer: &Account) {
        WalPay.createPayment(id: id, amountFlow: amount, seller: signer.address)
    }
}
`;

const PAY_PAYMENT_TX = `
import WalPay from ${flowConfig.walpayAddress}
import FungibleToken from ${flowConfig.fungibleTokenAddress}
import FlowToken from ${flowConfig.flowTokenAddress}

transaction(id: String, total: UFix64, clientRef: String?) {
    prepare(signer: auth(SaveValue, LoadValue, BorrowValue) &Account) {
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Missing Flow vault. Run setup to create a FlowToken vault first.")

        let paymentVault <- vaultRef.withdraw(amount: total)
        WalPay.pay(id: id, payer: signer.address, vault: <- paymentVault, clientRef: clientRef)
    }
}
`;

const DEACTIVATE_PAYMENT_TX = `
import WalPay from ${flowConfig.walpayAddress}

transaction(id: String) {
    prepare(signer: auth(Account) &Account) {
        WalPay.deactivatePayment(id: id, payer: signer.address)
    }
}
`;

export async function createPaymentOnChain(params: { id: string; amountFlow: number | string }) {
  const { id, amountFlow } = params;
  const cadence = CREATE_PAYMENT_TX;
  const transactionId = await mutate({
    cadence,
    args: () => [arg(id, t.String), arg(toUFix64(amountFlow), t.UFix64)],
    limit: 100,
  });
  const result = await tx(transactionId).onceSealed();
  return { transactionId, result };
}

export async function payOnChain(params: {
  id: string;
  totalFlow: number | string;
  clientRef?: string | null;
}) {
  const { id, totalFlow, clientRef = null } = params;
  const cadence = PAY_PAYMENT_TX;
  const transactionId = await mutate({
    cadence,
    args: () => [
      arg(id, t.String),
      arg(toUFix64(totalFlow), t.UFix64),
      arg(clientRef, t.Optional(t.String)),
    ],
    limit: 200,
  });
  const result = await tx(transactionId).onceSealed();
  return { transactionId, result };
}

export async function deactivatePaymentOnChain(params: { id: string }) {
  const { id } = params;
  const cadence = DEACTIVATE_PAYMENT_TX;
  const transactionId = await mutate({
    cadence,
    args: () => [arg(id, t.String)],
    limit: 100,
  });
  const result = await tx(transactionId).onceSealed();
  return { transactionId, result };
}
