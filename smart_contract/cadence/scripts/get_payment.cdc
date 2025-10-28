import "WalPay"

access(all) fun main(id: String): WalPay.Payment? {
    return WalPay.getPayment(id: id)
}
