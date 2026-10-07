export interface PiAuthResult {
  user: { uid: string; username: string; };
  accessToken: string;
}

export async function safePiAuthenticate(scopes: string[]): Promise<PiAuthResult> {
  if (typeof window === "undefined" || !(window as any).Pi) throw new Error("Pi SDK missing");
  const Pi = (window as any).Pi;
  
  // Dynamic native bridge detection
  const isPiBrowser = /PiBrowser/i.test(navigator.userAgent);

  try {
    Pi.init({ version: "2.0", sandbox: !isPiBrowser });
  } catch (e) {
    // Ignore if already initialized
  }

  return new Promise((resolve, reject) => {
    Pi.authenticate(scopes, async (incomplete: any) => {
      if (incomplete?.transaction?.txid) {
        await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "complete", paymentId: incomplete.identifier, txid: incomplete.transaction.txid })
        }).catch(() => {});
      }
    }).then(resolve).catch(reject);
  });
}