const ensureHexPrefix = (value?: string) => {
  if (!value) return "";
  return value.startsWith("0x") ? value : `0x${value}`;
};

export const flowConfig = {
  walpayAddress: ensureHexPrefix(import.meta.env.VITE_WALPAY_ADDRESS || "0xf8d6e0586b0a20c7"),
  walpayContract: import.meta.env.VITE_WALPAY_NAME || "WalPay",
  fungibleTokenAddress: ensureHexPrefix(
    import.meta.env.VITE_FUNGIBLE_TOKEN_ADDRESS || "0xee82856bf20e2aa6"
  ),
  flowTokenAddress: ensureHexPrefix(import.meta.env.VITE_FLOW_TOKEN_ADDRESS || "0x0ae53cb6e3f42a79"),
};

export function toUFix64(value: number | string): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(num)) {
    throw new Error("Invalid numeric value for UFix64");
  }
  return num.toFixed(8);
}
