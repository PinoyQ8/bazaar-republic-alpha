// 🛡️ BAZAAR REPUBLIC // SOVEREIGN MESH TRANSACTION RELAYER
"use client";

import { StrKey } from "@stellar/stellar-sdk";

export type VaultMutationMethod = "release" | "refund";

export async function executeVaultMutation(
  method: VaultMutationMethod,
  escrowId: string,
  consumerPubKey: string,
  pioneerUid?: string
): Promise<string> {
  try {
    const normalizedEscrowId = escrowId.trim();
    const normalizedAddress = consumerPubKey.trim();

    if (!normalizedEscrowId) {
      throw new Error("Missing escrow identifier for vault mutation.");
    }

    if (
      !normalizedAddress ||
      (!StrKey.isValidEd25519PublicKey(normalizedAddress) &&
        !StrKey.isValidContract(normalizedAddress))
    ) {
      throw new Error(
        "Invalid consumer wallet address. Expected a valid G... or C... Soroban address."
      );
    }

    const resolvedUid =
      pioneerUid?.trim() ||
      (typeof window !== "undefined"
        ? window.localStorage.getItem("mesh_pioneer_uid")?.trim() || ""
        : "");

    const response = await fetch("/api/vault", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(resolvedUid ? { "x-pioneer-uid": resolvedUid } : {}),
      },
      body: JSON.stringify({
        action: method === "release" ? "RELEASE" : "REFUND",
        escrowId: normalizedEscrowId.replace(/-/g, "_"),
        consumerAddress: normalizedAddress,
        ...(resolvedUid ? { pioneerUid: resolvedUid } : {}),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data?.success) {
      throw new Error(
        data?.error ||
          data?.message ||
          `On-chain vault mutation rejected (HTTP ${response.status}).`
      );
    }

    return typeof data.txHash === "string" && data.txHash.trim()
      ? data.txHash.trim()
      : "SETTLED_ON_CHAIN";
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[MESH-TX Error]:", message);
    throw new Error(message);
  }
}