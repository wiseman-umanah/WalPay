import "FungibleToken"
import "FlowToken"
import "WalPay"

transaction(id: String, clientRef: String?) {

    prepare(signer: auth(SaveValue, LoadValue, BorrowValue) &Account) {
        let payment = WalPay.getPayment(id: id)
            ?? panic("Payment not found")

        if !payment.isActive() {
            panic("Payment is inactive")
        }

        let fee: UFix64 = payment.amountFlow * payment.feeBps / 10000.0
        let expectedTotal: UFix64 = payment.amountFlow + fee

        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("FLOW Vault not found in signer storage")

        let paymentVault <- vaultRef.withdraw(amount: expectedTotal)

        WalPay.pay(
            id: id,
            payer: signer.address,
            vault: <- paymentVault,
            clientRef: clientRef
        )
    }
}
