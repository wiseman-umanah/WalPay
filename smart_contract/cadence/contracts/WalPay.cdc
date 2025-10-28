// WalPay.cdc
//
// WalletPay payment processor with per-payment feeBps.
//
// - Sellers create payment links (Payment) with price in FLOW and feeBps (e.g. 200 = 2%)
// - Buyers pay exactly (price + fee)
// - Fee -> platform treasury, net -> seller
// - Track seller lifetime net earnings
// - Sellers can deactivate links

import "FungibleToken"
import "FlowToken"

access(all) contract WalPay {

    // Platform FlowToken receiver capability (treasury)
    access(all) let platformTreasuryAddress: Address

	// Platform Fee charges
	access(all) let platformFeeBps: UFix64

    // One "link" / product config
    access(all) struct Payment {
        access(all) let id: String
        access(all) let seller: Address
        access(all) let amountFlow: UFix64   // price (excl. fee)
        access(all) let totalFlow: UFix64       // total ie amount + fee
        access(contract) var active: Bool

        init(id: String, seller: Address, amountFlow: UFix64, totalFlow: UFix64) {
            self.id = id
            self.seller = seller
            self.amountFlow = amountFlow
            self.totalFlow = totalFlow
            self.active = true
        }

        access(all) fun isActive(): Bool {
            return self.active
        }

        access(contract) fun deactivate() {
            self.active = false
        }
    }

    // Storage
    access(self) var payments: {String: Payment}
    access(self) var sellerEarnings: {Address: UFix64}   // total NET sent to seller via this contract

    // Events
    access(all) event PaymentCreated(
        id: String,
        seller: Address,
        amountFlow: UFix64,
        totalFlow: UFix64
    )

    access(all) event PaymentDeactivated(
        id: String,
        seller: Address
    )

    access(all) event PaymentPaid(
        id: String,
        payer: Address,
        seller: Address,
        priceFlow: UFix64,
        feeFlow: UFix64,
        totalFlow: UFix64,
        clientRef: String?
    )

    // -------- Reads --------

    access(all) fun getPayment(id: String): Payment? {
        return self.payments[id]
    }

    access(all) fun getSellerEarnings(seller: Address): UFix64 {
        return self.sellerEarnings[seller] ?? 0.0
    }

    // -------- Utils --------
    // Calculate the fee amount for a given price and percentage (percent expressed as 0-100)
    access(all) fun calculateFees(price: UFix64, percent: UFix64): UFix64 {
        return price * percent / 100.0
    }

    // -------- Writers (call from transactions; enforce signer in TX) --------

    // TX must assert signer.address == seller
    access(all) fun createPayment(id: String, amountFlow: UFix64, seller: Address) {
        pre {
            amountFlow > 0.0: "Amount must be > 0"
            self.payments[id] == nil: "Payment id already exists"
        }

        let feeAmount = self.calculateFees(price: amountFlow, percent: self.platformFeeBps)
        let totalFlow = amountFlow + feeAmount

        let p = Payment(id: id, seller: seller, amountFlow: amountFlow, totalFlow: totalFlow)
        self.payments[id] = p

        emit PaymentCreated(id: id, seller: seller, amountFlow: amountFlow, totalFlow: totalFlow)
    }

    // TX must assert signer.address == seller
    access(all) fun deactivatePayment(id: String, seller: Address) {
        let existing = self.payments[id] ?? panic("Payment not found")

        if existing.seller != seller {
            panic("Only the seller can deactivate this payment")
        }

        if !existing.isActive() {
            panic("Payment already inactive")
        }

        var updated = existing
        updated.deactivate()
        self.payments[id] = updated

        emit PaymentDeactivated(id: id, seller: seller)
    }

    // Buyer pays by sending total = price + fee(price, feeBps)
    // TX passes its signer.address as `payer`
    access(all) fun pay(
        id: String,
        payer: Address,
        vault: @{FungibleToken.Vault},
        clientRef: String?
    ) {
        let existing = self.payments[id] ?? panic("Payment not found")
        if !existing.isActive() {
            panic("This payment link is inactive")
        }

        let price: UFix64 = existing.amountFlow
        let totalFlow: UFix64 = existing.totalFlow
		let fee: UFix64 = totalFlow - price

        if vault.balance != totalFlow {
            panic("Incorrect amount. Must send price + fee")
        }

        // 1) fee -> platform
        let platformAccount = getAccount(self.platformTreasuryAddress)
        let platformReceiver = platformAccount.capabilities.borrow<&{FungibleToken.Receiver}>(
            /public/flowTokenReceiver
        ) ?? panic("Platform treasury receiver capability is invalid")
        let feePortion <- vault.withdraw(amount: fee)
        platformReceiver.deposit(from: <- feePortion)

        // 2) net -> seller
        let sellerAccount = getAccount(existing.seller)
        let sellerReceiver = sellerAccount.capabilities.borrow<&{FungibleToken.Receiver}>(
            /public/flowTokenReceiver
        ) ?? panic("Seller missing /public/flowTokenReceiver")
        let sellerPortion <- vault.withdraw(amount: price)
        sellerReceiver.deposit(from: <- sellerPortion)

        // vault should be empty now
        destroy vault

        let cur = self.sellerEarnings[existing.seller] ?? 0.0
        self.sellerEarnings[existing.seller] = cur + price

        emit PaymentPaid(
            id: id,
            payer: payer,
            seller: existing.seller,
            priceFlow: price,
            feeFlow: fee,
            totalFlow: totalFlow,
            clientRef: clientRef
        )
    }

    // -------- Init --------

    init(platformTreasury: Address, platformFeeBps: UFix64) {
        self.platformTreasuryAddress = platformTreasury
        self.payments = {}
        self.sellerEarnings = {}
		self.platformFeeBps = platformFeeBps  // % expressed as 0-100 in Bps (basis points) for flexibility
    }
}
