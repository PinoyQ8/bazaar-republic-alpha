// Location: lib/wallet/drivers/freighterDriver.ts
// 🛡️ BAZAAR REPUBLIC // DEPRECATED DRIVER STUB

export async function isConnected(): Promise<boolean> {
  return false;
}

export async function requestAccess(): Promise<string> {
  throw new Error("Freighter driver deprecated. Use Pi Network & Samsung Knox passkeys.");
}

export async function signTransaction(): Promise<string> {
  throw new Error("Freighter driver deprecated.");
}

export async function signAuthEntry(): Promise<string> {
  throw new Error("Freighter driver deprecated.");
}