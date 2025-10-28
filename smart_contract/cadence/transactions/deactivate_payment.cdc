import "WalPay"

transaction(id: String) {

    prepare(signer: auth(SaveValue, LoadValue, BorrowValue) &Account) {
        WalPay.deactivatePayment(
            id: id,
            seller: signer.address
        )
    }
}
