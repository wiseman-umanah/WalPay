import { config } from "@onflow/fcl";

const accessNode = import.meta.env.VITE_FLOW_ACCESS_NODE ?? "http://127.0.0.1:8888";
const flowNetwork = import.meta.env.VITE_FLOW_NETWORK ?? "local";
const discoveryWallet = import.meta.env.VITE_DISCOVERY_WALLET ?? "http://localhost:8701/fcl/authn";
const discoveryEndpoint =
  import.meta.env.VITE_DISCOVERY_AUTHN_ENDPOINT ?? "http://localhost:8701/fcl/authn";
const appUrl = import.meta.env.VITE_APP_URL ?? window.location.origin;

config()
  .put("accessNode.api", accessNode)
  .put("flow.network", flowNetwork)
  .put("discovery.wallet", discoveryWallet)
  .put("discovery.authn.endpoint", discoveryEndpoint)
  .put("discovery.authn.include", discoveryInclude())
  .put("app.detail.title", import.meta.env.VITE_APP_TITLE ?? "WalPay")
  .put("app.detail.icon", import.meta.env.VITE_APP_ICON ?? "")
  .put("app.detail.url", appUrl);

function discoveryInclude() {
  const raw = import.meta.env.VITE_DISCOVERY_WALLET_INCLUDE;
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry: string) => entry.trim())
    .filter(Boolean);
}
