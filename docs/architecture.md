# Architecture Overview

WalPay is split into three subsystems—frontend, backend, and Flow smart contracts—that collaborate to create, manage, and settle payment links. This document captures how those pieces fit together along with the key data models and request lifecycles.

## High-level topology
- **Client (React/Vite)**  
  Renders the seller dashboard, orchestrates Flow wallet interactions with `@onflow/fcl`, and calls the REST API for persistence. Uses browser storage for short-lived auth tokens and Cloudinary for image uploads via the backend.
- **API (Node.js)**  
  Handles authentication, payment metadata, fee computation, transaction logging, and email notifications. MongoDB stores sellers, sessions, payments, and transaction history.
- **Cadence contract (`WalPay`)**  
  Owns the canonical list of payment links, enforces platform fees, and keeps lifetime seller earnings. Transactions are triggered by the client and verified/recorded through the backend.

```
Browser ──REST──▶ Backend ──MongoDB
   │                │
   │                └─▶ Flow (Cadence contract)
   └─FCL/Wallet─────┘
```

## Core data models
- **Seller** (`backend.sellers`) – email, hashed password, Flow address, KYC metadata, verification status.
- **Payment** (`backend.payments` + Cadence `Payment`) – name, pricing (FLOW + fee), image, redirect URL, blockchain tx references, active flag.
- **Transaction** (`backend.transactions`) – records payment, creation, and deactivation transaction ids, payer address, and timestamps.
- **Session/OTP** – secure login flow with access/refresh tokens, OTP tables, TTL indices.

## Sequence flows

### Seller creates a payment link
1. Seller signs in on the frontend; the API issues access/refresh tokens.
2. Seller fills the “Create link” modal, including optional image.  
   - Image base64 payload is sent to the backend, which uploads to Cloudinary.
3. Backend computes Flow fee/total, persists the payment document, and returns the REST payload.
4. Frontend optionally triggers `WalPay.createPayment` via FCL.  
5. The transaction id is reported back to `/payments/:id/transactions`, where the backend records it and invokes `flowService.submitCreatePaymentTx`.
6. Dashboard refreshes `/payments` to display the newly created link.

### Buyer pays via public link
1. Public page loads `/public/payments/:slug` to fetch pricing and seller metadata.
2. Buyer connects a Flow wallet and signs the `WalPay.pay` transaction.  
3. On success, the frontend calls `/public/payments/:id/transactions` with the tx id.
4. Backend logs the payment, updates analytics, and (future) dispatches notifications/webhooks.
5. Seller earnings can be verified on-chain with `getSellerEarnings`.

### Deactivating a payment
1. Seller requests delete from the dashboard; backend checks ownership.
2. Frontend runs `WalPay.deactivatePayment` transaction.
3. Backend receives the tx id via `DELETE /payments/:id`, marks the payment inactive, and prevents further public retrieval.

## Environment and deployment considerations
- **Backend**
  - `PLATFORM_FEE_PERCENT` must match the Cadence `platformFeeBps` used during deployment (basis points, e.g. `2` → 2%).
  - `FLOW_USD_RATE` powers fiat conversions; update via cron job or admin UI.
  - Configure `MAIL_*` and `CLOUDINARY_*` for OTP delivery and image hosting.
- **Frontend**
  - `VITE_WALPAY_ADDRESS`, `VITE_FLOW_TOKEN_ADDRESS`, and `VITE_FUNGIBLE_TOKEN_ADDRESS` must align with the active network (Emulator/Testnet/Mainnet).
  - `VITE_API_URL` points to the deployed backend (e.g. Vercel/Render).
- **Smart contract**
  - `platformTreasury` address must expose `/public/flowTokenReceiver`. Rotate carefully—requires redeployment and config updates.
  - Maintain version notes for contract migrations; include capability rollovers in `docs/`.

## Extensibility roadmap
- **Webhooks:** Extend `transactionService` to push Flow events to partner systems.
- **Analytics:** Add MongoDB aggregation pipelines (or a data warehouse sync) for revenue reporting.
- **Multi-tenant fees:** Allow per-seller overrides by storing fee bp in Mongo and passing it to Cadence via transaction arguments.
- **Security hardening:** Replace placeholder Flow service with signature verification, rate limiting, and audit logs.

Keep this document updated whenever interface contracts, data models, or deployment steps change.
