// Location: bazaar_relayer.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import {
  Networks,
  rpc as StellarRpc,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import { prisma } from "./lib/prisma";
import { fileURLToPath } from "url";

// -----------------------------------------------------------------------------
// 1. CONFIGURATION & CONSTANTS
// -----------------------------------------------------------------------------
const RPC_URL = process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;
const CONTRACT_ID =
  process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID ||
  process.env.BAZAAR_VAULT_CONTRACT_ID ||
  process.env.CONTRACT_ID ||
  "";

const POLL_INTERVAL_MS = 10000;
const LOOKBACK_WINDOW_LEDGERS = 20;

const server = new StellarRpc.Server(RPC_URL, {
  allowHttp: RPC_URL.startsWith("http://"),
});

// -----------------------------------------------------------------------------
// 2. HELPER UTILITIES
// -----------------------------------------------------------------------------

/**
 * Safely converts an ScVal into native JS types, falling back to hex XDR on parse errors.
 */
function parseScValSafely(val: xdr.ScVal | undefined | null): any {
  if (!val) return null;
  try {
    return scValToNative(val);
  } catch {
    try {
      return typeof (val as any).toXDR === "function"
        ? (val as any).toXDR("hex")
        : String(val);
    } catch {
      return String(val);
    }
  }
}

/**
 * BigInt-safe JSON serializer to prevent runtime crashes during DB persistence.
 */
function safeJsonStringify(obj: any): string {
  try {
    return JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    );
  } catch {
    return String(obj);
  }
}

/**
 * Retries RPC handshake with backoff to prevent startup failures from terminating the daemon.
 */
async function getLatestLedgerWithRetry(maxRetries = 5, delayMs = 3000): Promise<number> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await server.getLatestLedger();
      return res.sequence;
    } catch (err: any) {
      console.warn(
        `⚠️ [MESH-RELAYER] Initial RPC handshake attempt ${attempt}/${maxRetries} failed (${err?.message || "fetch failed"}). Retrying in ${delayMs / 1000}s...`
      );
      if (attempt === maxRetries) {
        throw new Error(`RPC connection unreachable after ${maxRetries} attempts.`);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("RPC handshake failed.");
}

// -----------------------------------------------------------------------------
// 3. EVENT PROCESSOR
// -----------------------------------------------------------------------------
async function processContractEvent(event: StellarRpc.Api.EventResponse, db: any) {
  try {
    const rawTopics = event.topic ?? [];
    const topics = rawTopics.map((t: xdr.ScVal) => parseScValSafely(t));
    const eventData = event.value ? parseScValSafely(event.value) : null;
    const eventType = String(topics[0] || "UNKNOWN");
    const txHash = event.txHash;

    console.log(`📦 [EVENT] Type: ${eventType} | Tx: ${txHash} | Ledger: ${event.ledger}`);

    // 1. Persist audit receipt in MongoDB
    if (db.bridgeReceipt) {
      try {
        await db.bridgeReceipt.upsert({
          where: { txHash },
          update: {
            status: "PROCESSED",
            ledgerSeq: event.ledger,
            eventType,
            payload: safeJsonStringify(eventData),
            updatedAt: new Date(),
          },
          create: {
            txHash,
            status: "PROCESSED",
            ledgerSeq: event.ledger,
            eventType,
            payload: safeJsonStringify(eventData),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      } catch (receiptErr: any) {
        console.warn(`⚠️ [MESH-RELAYER] Bridge receipt write skipped:`, receiptErr?.message || receiptErr);
      }
    }

    // Extract Escrow Identifier from struct payload or indexed topic
    const escrowId = String(
      (typeof eventData === "object" && eventData?.escrow_id) ||
      topics[1] ||
      ""
    );

    // 2. Synchronize Escrow State in bzr-db
    if (escrowId && db.escrowLock) {
      switch (eventType) {
        case "lock_funds":
        case "initialize": {
          await db.escrowLock.updateMany({
            where: { escrowId },
            data: { status: "LOCKED", updatedAt: new Date() },
          });
          console.log(`🔒 [MESH-RELAYER] Synchronized Escrow Lock for: ${escrowId}`);
          break;
        }

        case "release_funds": {
          await db.escrowLock.updateMany({
            where: { escrowId },
            data: { status: "RELEASED", updatedAt: new Date() },
          });
          console.log(`🔓 [MESH-RELAYER] Synchronized Escrow Release for: ${escrowId}`);
          break;
        }

        case "refund_funds": {
          await db.escrowLock.updateMany({
            where: { escrowId },
            data: { status: "REFUNDED", updatedAt: new Date() },
          });
          console.log(`↩️ [MESH-RELAYER] Synchronized Escrow Refund for: ${escrowId}`);
          break;
        }

        default:
          console.log(`ℹ️ [MESH-RELAYER] Unhandled event topic: ${eventType}`);
          break;
      }
    }
  } catch (err: any) {
    console.error("❌ [MESH-RELAYER] Event processing failed:", err?.message || err);
  }
}

// -----------------------------------------------------------------------------
// 4. MAIN RELAYER DAEMON
// -----------------------------------------------------------------------------
export async function startRelayerDaemon() {
  console.log("🏛️ [MESH-RELAYER] Initializing Soroban L1/L2 Bridge Relayer Daemon...");
  console.log(`📡 [MESH-RELAYER] Connected RPC: ${RPC_URL}`);
  console.log(`🔌 [MESH-RELAYER] Monitored Contract ID: ${CONTRACT_ID || "ALL_EVENTS"}`);

  const db: any = prisma;
  let lastCheckedLedger: number = 0;

  // Initialize starting ledger sequence with resilience
  try {
    const currentSeq = await getLatestLedgerWithRetry();

    let savedState: any = null;
    try {
      if (db.relayerSyncState) {
        savedState = await db.relayerSyncState.findFirst({
          where: { id: "SOROBAN_L1_SYNC" },
        });
      }
    } catch {
      console.warn("⚠️ [MESH-RELAYER] Database cursor read failed. Defaulting to live head.");
    }

    if (savedState?.lastLedger && Number(savedState.lastLedger) > (currentSeq - 10000)) {
      lastCheckedLedger = Number(savedState.lastLedger);
      console.log(`🔄 [MESH-RELAYER] Resuming from persisted ledger: ${lastCheckedLedger}`);
    } else {
      lastCheckedLedger = Math.max(currentSeq - LOOKBACK_WINDOW_LEDGERS, 1);
      console.log(`✨ [MESH-RELAYER] Starting fresh cursor at ledger: ${lastCheckedLedger}`);
    }
  } catch (err: any) {
    console.error("❌ [MESH-RELAYER] Fatal: Could not establish initial network anchor:", err?.message || err);
    process.exit(1);
  }

  // 🛡️ Concurrency Lock: Prevents overlapping polling cycles
  let isPolling = false;

  // Polling Cycle
  setInterval(async () => {
    if (isPolling) return;
    isPolling = true;

    try {
      const latestLedgerRes = await server.getLatestLedger();
      const currentLedger = latestLedgerRes.sequence;

      if (lastCheckedLedger >= currentLedger) {
        isPolling = false;
        return; // Up to date
      }

      const startLedger = lastCheckedLedger + 1;
      const endLedger = Math.min(currentLedger, startLedger + 5);

      // Query contract events across the target range
      const eventFilter: StellarRpc.Server.GetEventsRequest = {
        startLedger,
        filters: CONTRACT_ID
          ? [
              {
                type: "contract",
                contractIds: [CONTRACT_ID],
              },
            ]
          : [],
      };

      const eventsResponse = await server.getEvents(eventFilter);
      const events = eventsResponse.events ?? [];

      if (events.length > 0) {
        console.log(`⚡ [MESH-RELAYER] Found ${events.length} new contract event(s) in ledgers [${startLedger}..${endLedger}]`);

        for (const event of events) {
          await processContractEvent(event, db);
        }
      }

      // Advance cursor
      lastCheckedLedger = endLedger;

      // Persist cursor state
      if (db.relayerSyncState) {
        await db.relayerSyncState.upsert({
          where: { id: "SOROBAN_L1_SYNC" },
          update: { lastLedger: endLedger, updatedAt: new Date() },
          create: { id: "SOROBAN_L1_SYNC", lastLedger: endLedger, updatedAt: new Date() },
        });
      }
    } catch (err: any) {
      const isTimeout = err?.code === "ETIMEDOUT" || err?.message?.includes("timeout");
      if (isTimeout) {
        console.warn(`⚠️ [MESH-RELAYER] RPC Timeout. Retrying in ${POLL_INTERVAL_MS / 1000}s...`);
      } else {
        console.warn(`⚠️ [MESH-RELAYER] Polling cycle warning: ${err?.message || "Unknown Network Error"}`);
      }
    } finally {
      isPolling = false;
    }
  }, POLL_INTERVAL_MS);
}

// -----------------------------------------------------------------------------
// 5. DIRECT EXECUTION HOOK
// -----------------------------------------------------------------------------
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  startRelayerDaemon();
}