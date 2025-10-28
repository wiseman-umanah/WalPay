import "WalPay"

transaction(id: String, amountFlow: UFix64) {

    prepare(signer: auth(SaveValue, LoadValue, BorrowValue) &Account) {
        WalPay.createPayment(
            id: id,
            amountFlow: amountFlow,
            seller: signer.address
        )
    }
}
