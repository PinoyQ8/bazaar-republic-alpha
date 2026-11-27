import type { ResolvedMeshEnv } from "@/lib/pi/paymentEnv";

export interface PiPaymentNetworkInfo {
  identifier?: string;
  network?: string;
  transaction?: {
    txid?: string;
    verified?: boolean;
  } | null;
  status?: {
    developer_approved?: boolean;
    transaction_verified?: boolean;
    developer_completed?: boolean;
    cancelled?: boolean;
    user_cancelled?: boolean;
  };
}

function normalizePiNetwork(raw?: string | null): "testnet" | "mainnet" | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v.includes("mainnet") || v === "pi mainnet") return "mainnet";
  if (v.includes("testnet") || v === "pi testnet") return "testnet";
  return null;
}

function buildPiUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanBase.endsWith("/v2") && cleanPath.startsWith("/v2/")) {
    return `${cleanBase}${cleanPath.slice(3)}`;
  }
  if (!cleanBase.endsWith("/v2") && !cleanPath.startsWith("/v2/")) {
    return `${cleanBase}/v2${cleanPath}`;
  }
  return `${cleanBase}${cleanPath}`;
}

async function piRequest(
  env: ResolvedMeshEnv,
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const url = buildPiUrl(env.piApiBaseUrl, path);
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Key ${env.piApiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    signal: init?.signal ?? AbortSignal.timeout(10000),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}

export async function fetchAndAssertPiPaymentNetwork(
  env: ResolvedMeshEnv,
  paymentId: string
): Promise<{
  ok: boolean;
  status: number;
  payment?: PiPaymentNetworkInfo;
  error?: string;
}> {
  const res = await piRequest(env, `/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET",
  });

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error:
        typeof res.data?.error === "string"
          ? res.data.error
          : `Failed to inspect payment ${paymentId} (HTTP ${res.status}).`,
    };
  }

  const payment = res.data as PiPaymentNetworkInfo;
  const reportedNetwork = normalizePiNetwork(payment.network);

  if (reportedNetwork && reportedNetwork !== env.network) {
    return {
      ok: false,
      status: 409,
      payment,
      error: `Network mismatch: payment belongs to ${payment.network}, but request resolved to ${env.network.toUpperCase()}.`,
    };
  }

  return { ok: true, status: 200, payment };
}

export async function approvePiPayment(env: ResolvedMeshEnv, paymentId: string) {
  return piRequest(env, `/payments/${encodeURIComponent(paymentId)}/approve`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function completePiPayment(
  env: ResolvedMeshEnv,
  paymentId: string,
  txid: string
) {
  return piRequest(env, `/payments/${encodeURIComponent(paymentId)}/complete`, {
    method: "POST",
    body: JSON.stringify({ txid }),
  });
}