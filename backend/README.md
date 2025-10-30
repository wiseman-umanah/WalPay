# WalPay Backend

The WalPay backend is a lightweight Node.js service that powers seller authentication, payment metadata, and transaction logging. It stores state in MongoDB, integrates with Cloudinary for payment images, and exposes REST endpoints consumed by the frontend and webhooks.

## Prerequisites
- Node.js 20+
- pnpm 8+
- MongoDB 6+ (local or managed)
- Cloudinary account (for hosted payment images)
- SMTP credentials for sending OTP emails

## Installation
```bash
pnpm install
```

## Scripts
| Command        | Purpose                                           |
|----------------|---------------------------------------------------|
| `pnpm dev`     | Start nodemon with hot reload on `src/`           |
| `pnpm start`   | Run the compiled server once (production)         |

The server listens on `PORT` (default `4000`). Entry point: `src/index.js`.

## Environment variables
Create a `.env` file in this directory with the following keys:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP port | `4000` |
| `MONGO_URI` / `DB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/walpay` |
| `PLATFORM_FEE_PERCENT` | Platform fee percentage applied to Flow payments | `2` |
| `FLOW_USD_RATE` | Flow-to-USD conversion rate for fiat display | _required if `priceUSD` is used_ |
| `ACCESS_TOKEN_TTL_MINUTES` | Access token lifetime | `15` |
| `REFRESH_TOKEN_TTL_DAYS` | Refresh token lifetime | `30` |
| `SESSION_MAX_LIFE_DAYS` | Session hard expiry | `60` |
| `OTP_TTL_MINUTES` | OTP expiration window | `10` |
| `OTP_LENGTH` | OTP digit length | `6` |
| `TOKEN_BYTE_LENGTH` | Random bytes for session tokens | `48` |
| `DEFAULT_COUNTRY` | Default seller country if omitted | `Nigeria` |
| `CORS_ORIGINS` | Comma-separated list of allowed origins | `*` |
| `MAIL_HOST` | SMTP host | – |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_SECURE` | Use TLS (`true`/`false`) | `false` |
| `MAIL_USER` / `MAIL_PASSWORD` | SMTP credentials | – |
| `MAIL_FROM` | From email address for OTP/send | `MAIL_USER` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | – |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary credentials | – |
| `CLOUDINARY_FOLDER` | Folder for payment assets | `walpay` |

Call `validateConfig()` (already invoked in `src/index.js`) to enforce required variables at runtime.

## Project structure
- `src/index.js` – Bootstraps database connection and HTTP server (Vercel-friendly handler exported).
- `src/app.js` – Central request handler: CORS, auth context resolution, router.
- `src/router.js` – Minimalistic router with path params, auth guards, and error handling.
- `src/routes/*.js` – REST endpoints (`authRoutes`, `paymentRoutes`, `profileRoutes`).
- `src/services` – Domain logic (payments, sellers, OTP, Flow hooks, Cloudinary).
- `src/middleware` – CORS and authentication helpers.
- `src/utils` – Logger, HTTP helpers, crypto utilities.

## API overview
Authenticated endpoints require a bearer token (`Authorization: Bearer <accessToken>`).

| Method & Path | Description |
|---------------|-------------|
| `POST /auth/signup` | Register seller, send OTP |
| `POST /auth/signup/verify` | Verify OTP, issue tokens |
| `POST /auth/login` | Email/password login |
| `POST /auth/login/otp/request` / `verify` | OTP-only login flow |
| `POST /auth/logout` | Revoke session |
| `GET /profile/me` | Retrieve seller profile |
| `PUT /profile` | Update business details |
| `GET /payments` | List seller payment links |
| `POST /payments` | Create payment link (computes Flow fee/total) |
| `GET /payments/:id` | Fetch payment by id |
| `DELETE /payments/:id` | Deactivate payment (requires on-chain tx id) |
| `POST /payments/:id/transactions` | Record on-chain tx (create, deactivate, payment) |
| `GET /transactions` | List seller transactions |
| `GET /public/payments/:slug` | Public lookup by slug (no auth) |
| `POST /public/payments/:id/transactions` | Public transaction webhook (payment confirmation) |

Responses follow the `sendJson` helper format and include pagination metadata where relevant.

## Flow integration
`flowService` currently logs placeholder messages. Replace the stubs with real Flow Client Library calls (or webhook processing) when moving beyond prototyping:
- `submitCreatePaymentTx`
- `submitDeactivatePaymentTx`
- `submitPaymentTx`

Always verify transaction status (`onceSealed`) before marking records as final, and consider signature verification on incoming public webhooks.

## Running locally
1. Ensure MongoDB is running.
2. Configure `.env`.
3. Start the server:
   ```bash
   pnpm dev
   ```
4. The API will be available at `http://localhost:4000`. Use tools like Thunder Client/Postman to test endpoints.

## Deployment notes
- The service is edge-friendly: `src/index.js` exports both `start()` (Node HTTP server) and `handler()` (Vercel serverless entry).
- Set all environment variables within your hosting provider.
- Use MongoDB Atlas or another managed provider with TLS enabled for production deployments.
