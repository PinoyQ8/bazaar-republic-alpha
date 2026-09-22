// 🛡️ BAZAAR REPUBLIC // SOVEREIGN VAULT CLIENT UTILITY
// Delegates transaction execution and state reads to the secure backend relayer / API.

import * as StellarSdk from "@stellar/stellar-sdk";

// 🛡️ MESH WRITE OPERATION: Locks funds in the Escrow Vault via Backend Relayer
export async function lockBazaarFunds(
    consumerPubKey: string,
    providerPubKey: string,
    arbiterPubKey: string,
    escrowId: string,
    amount: bigint,
    durationSecs: bigint
): Promise<string> {
    const response = await fetch('/api/vault', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "LOCK",
            escrowId: escrowId.replace(/-/g, '_'),
            consumerAddress: consumerPubKey,
            providerAddress: providerPubKey,
            arbiterAddress: arbiterPubKey,
            amount: amount.toString(),
            duration: durationSecs.toString(),
        }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
        throw new Error(data.error || "Vault lock transaction failed on-chain.");
    }

    return data.txHash || "SETTLED_ON_CHAIN";
}

// 🛡️ MESH READ OPERATION: Fetches live vault state via Backend API
export async function getBazaarVaultState(escrowId: string, callerPubKey: string) {
    const response = await fetch(`/api/vault?escrowId=${encodeURIComponent(escrowId)}&caller=${encodeURIComponent(callerPubKey)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
        throw new Error(data.error || "ERR_VAULT_NOT_FOUND_ON_LEDGER");
    }

    return data.vault;
}