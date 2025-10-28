import "WalPay"

access(all) fun main(seller: Address): UFix64 {
    return WalPay.getSellerEarnings(seller: seller)
}
