export interface PioneerUser {
  username: string;
  uid: string;
  accessToken?: string;
}

export interface PiAuthResult {
  user: PioneerUser;
  accessToken: string;
}

export type IncompletePaymentCallback = (payment: {
  identifier?: string;
  transaction?: { txid?: string } | null;
}) => void | Promise<void>;

export async function recoverIncompletePaymentOnServer(payment: {
  identifier?: string;
}): Promise<void> {
  const paymentId = payment?.identifier?.trim();
  if (!paymentId) return;

  const res = await fetch("/api/payments/incomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : `Incomplete payment recovery failed (HTTP ${res.status})`
    );
  }
}

export async function safePiAuthenticate(
  scopes: string[] = ["username", "payments", "wallet_address"],
  onIncompletePayment?: IncompletePaymentCallback
): Promise<PiAuthResult> {
  if (typeof window === "undefined" || !(window as any).Pi) {
    throw new Error("Pi SDK missing. Open inside Pi Browser.");
  }

  const Pi = (window as any).Pi;
  const isPiBrowser = /PiBrowser/i.test(navigator.userAgent);

  try {
    Pi.init({ version: "2.0", sandbox: !isPiBrowser });
  } catch {
    // Ignore if already initialized on this window
  }

  const unifiedScopes = Array.from(
    new Set([...scopes, "username", "payments", "wallet_address"])
  );

  const incompleteHandler: IncompletePaymentCallback = async (payment) => {
    try {
      if (onIncompletePayment) {
        await onIncompletePayment(payment);
      } else {
        await recoverIncompletePaymentOnServer(payment);
      }
    } catch (err) {
      console.warn("[PI_INCOMPLETE_RECOVERY_WARN]", err);
    }
  };

  return await Pi.authenticate(unifiedScopes, incompleteHandler);
}