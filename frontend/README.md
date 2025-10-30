# WalPay Frontend

This package implements the seller dashboard, registration flow, and public checkout pages for WalPay. It is a Vite + React 19 + Tailwind application that integrates Flow wallets via `@onflow/fcl` and communicates with the WalPay backend REST API.

## Prerequisites
- Node.js 20+
- pnpm 8+
- Access to the WalPay backend (local or hosted) and the Flow contract addresses

## Installation
```bash
pnpm install
```

The project is a standalone pnpm workspace package. Running `pnpm install` from this directory installs only the frontend dependencies.

## Scripts
| Command            | Purpose                                             |
|--------------------|-----------------------------------------------------|
| `pnpm dev`         | Starts Vite dev server on `http://localhost:5173`   |
| `pnpm build`       | Builds production assets into `dist/`               |
| `pnpm preview`     | Serves the production build locally                 |
| `pnpm lint`        | Runs ESLint with the project configuration          |

## Environment variables
Create a `.env` file (or `.env.local`) in this directory. The most commonly used keys are:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | WalPay backend base URL | `http://localhost:4000` |
| `VITE_FLOW_NETWORK` | Flow network key (`local`, `testnet`, `mainnet`) | `local` |
| `VITE_FLOW_ACCESS_NODE` | Access node RPC endpoint | `http://127.0.0.1:8888` |
| `VITE_DISCOVERY_WALLET` | Flow discovery wallet URL | `http://localhost:8701/fcl/authn` |
| `VITE_DISCOVERY_AUTHN_ENDPOINT` | Optional override for discovery authn | discovery wallet |
| `VITE_APP_URL` | Public app URL used in FCL metadata | `window.location.origin` |
| `VITE_APP_TITLE` / `VITE_APP_ICON` | Wallet discovery branding | `WalPay` / empty |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect project id (optional, for Blocto/Flow apps) | – |
| `VITE_WALPAY_ADDRESS` | Deployed WalPay contract address | `0xf8d6e0586b0a20c7` (emulator) |
| `VITE_WALPAY_NAME` | WalPay contract name | `WalPay` |
| `VITE_FLOW_TOKEN_ADDRESS` | FlowToken contract address | `0x0ae53cb6e3f42a79` |
| `VITE_FUNGIBLE_TOKEN_ADDRESS` | FungibleToken contract address | `0xee82856bf20e2aa6` |
| `VITE_DISCOVERY_WALLET_INCLUDE` | Comma-separated discovery wallet endpoints to include | – |

Restart the dev server after changing env values.

## Key folders
- `src/pages` – Register, dashboard, payment, and legal pages.
- `src/components` – Reusable UI (sidebar, modals, dashboard sections).
- `src/api` – Axios client and domain-specific API helpers (auth, payments, profile).
- `src/flow` – Flow configuration, FCL setup, and Cadence transaction wrappers.
- `src/utils` – Client-side auth storage, formatting helpers, etc.

## Development tips
- The dashboard expects the backend to emit Flow/USD rates via `/rates` (or fallback). Ensure `FLOW_USD_RATE` is set on the backend during development to avoid missing fiat conversions.
- Transactions are created with FCL `mutate` and awaited with `tx(...).onceSealed()`. Errors bubble to the UI; use your browser console when debugging wallet flows.
- Tailwind is loaded via the Vite plugin. Customize design tokens in `tailwind.config.ts` (if added) or the default `index.css`.

## SEO & metadata
- Page-level metadata is managed with [`react-helmet-async`](https://github.com/staylor/react-helmet-async). Use the shared `Seo` component (`src/components/Seo.tsx`) to inject titles, descriptions, OpenGraph/Twitter tags, and optional JSON-LD schemas. Defaults are applied in `App.tsx`.
- Public routes (`/`, `/terms`, `/privacy`, `/payment/:slug`) include structured data tailored to their content. Dashboard routes are marked `noindex`.
- Static assets:
  - `public/robots.txt` allows all crawlers, blocks private routes, and points to the sitemap. Update the domain to match production.
  - `public/sitemap.xml` lists crawlable URLs. Replace `https://walpay.example` with your live origin during deployment (or generate dynamically as part of CI).
  - `index.html` contains fallback meta tags and preconnect hints; override `VITE_APP_URL` for accurate canonical links during builds.
- When deploying to different environments, set `VITE_APP_URL` so canonical URLs and structured data resolve correctly.

## Testing
Add component/integration tests under `src/__tests__` using your preferred stack (Vitest/Jest). Run them with `pnpm test` once a test harness is configured.

## Deployment
- Build with `pnpm build`. The generated `dist/` folder can be served from any static host (Vercel, Netlify, Cloudflare Pages, etc.).
- Ensure environment variables are provided at build time for static hosting. Sensitive values (API origin, Flow contract addresses) are safe to expose since they are public configuration.
- For Vercel, see `vercel.json` in this directory to customize headers or rewrites.
