// import Test
// import "FlowToken"
// import "FungibleToken"

// access(all) var treasury: Test.Account? = nil
// access(all) var seller: Test.Account? = nil
// access(all) var buyer: Test.Account? = nil

// access(all) fun setup() {
//     Test.reset()

//     treasury = Test.createAccount(name: "Treasury")
//     seller = Test.createAccount(name: "Seller")
//     buyer = Test.createAccount(name: "Buyer")

//     let treasuryAccount = treasury!
//     Test.deployContract(
//         name: "WalPay",
//         code: Test.readFile("./cadence/contracts/WalPay.cdc"),
//         arguments: [treasuryAccount.address]
//     )

//     Test.setContractAddress("WalPay", treasuryAccount.address)

//     ensureFlowVault(account: treasuryAccount)
//     ensureFlowVault(account: seller!)
//     ensureFlowVault(account: buyer!)

//     Test.mintFlowTokens(account: buyer!, amount: 1000.0)
// }

// access(contract) fun ensureFlowVault(account: Test.Account) {
//     if !account.capabilities.exists(/public/flowTokenReceiver) {
//         account.storage.save(<- FlowToken.createEmptyVault(), to: /storage/flowTokenVault)
//         account.capabilities.publish<&{FungibleToken.Receiver}>(
//             /public/flowTokenReceiver,
//             target: /storage/flowTokenVault
//         )
//         account.capabilities.publish<&{FungibleToken.Balance}>(
//             /public/flowTokenBalance,
//             target: /storage/flowTokenVault
//         )
//     }
// }

// access(all) fun beforeEach() {
//     Test.restartEmulator()
//     setup()
// }

// access(all) fun testCreatePayment() {
//     let sellerAccount = seller!

//     let result = Test.transaction(
//         code: Test.readFile("./cadence/transactions/create_payment.cdc"),
//         arguments: [
//             Test.string("payment-1"),
//             Test.ufix64(100.0),
//             Test.ufix64(200.0)
//         ],
//         signers: [sellerAccount]
//     )

//     Test.expect(result.succeeded, result.errorMessage)
// }

// access(all) fun testPayEmitsEvent() {
//     testCreatePayment()

//     let buyerAccount = buyer!

//     let result = Test.transaction(
//         code: Test.readFile("./cadence/transactions/pay.cdc"),
//         arguments: [
//             Test.string("payment-1"),
//             Test.optional(Test.string("invoice-123"))
//         ],
//         signers: [buyerAccount]
//     )

//     Test.expect(result.succeeded, result.errorMessage)

//     let events = result.events.filter(fun (evt: Test.Event): Bool {
//         return evt.type == "A.".concat(Test.address("WalPay")).concat(".WalPay.PaymentPaid")
//     })

//     Test.expect(events.length == 1, "expected PaymentPaid emitted")
// }
