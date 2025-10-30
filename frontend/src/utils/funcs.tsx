import * as fcl from "@onflow/fcl";

export async function loginWithMessage() {
  // 1) Get nonce from backend
  const { nonce } = await (await fetch("/api/auth/nonce", { credentials: "include" })).json();
  const user = await fcl.currentUser().authenticate();

  // 2) Message to sign (hex-encoded UTF-8); keep it short & include nonce + your domain
  const msg = `WalP login\nnonce:${nonce}\norigin:${location.origin}`;
  const hexMsg = Buffer.from(msg, "utf8").toString("hex");

  // 3) Request signature(s) from wallet
  const sigRes = await fcl.currentUser().signUserMessage(hexMsg);
  // sigRes.compositeSignatures: [{ addr, keyId, signature }, ...]

  // 4) Verify on backend
  const r = await fetch("/api/auth/verify-user-signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      address: user.addr,
      message: hexMsg,
      compositeSignatures: sigRes,
      nonce,
    }),
  });
  if (!r.ok) throw new Error("Auth failed");
  return true;
}

