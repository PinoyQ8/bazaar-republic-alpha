import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import {
  rpc,
  Keypair,
  Networks,
  TransactionBuilder,
  xdr,
  Operation,
  Address,
  SorobanDataBuilder,
} from "@stellar/stellar-sdk";

// ==========================================
// 1. CONFIGURATION & CONSTANTS
// ==========================================
const RPC_URL = process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
const KEEPER_SECRET = process.env.KEEPER_SIGNER_SECRET || "";
const POLL_INTERVAL_MINUTES = Number(process.env.POLL_INTERVAL_MINUTES) || 60;
const TTL_THRESHOLD = Number(process.env.TTL_THRESHOLD_LEDGERS) || 5000;
const EXTEND_TO_LIFETIME = Number(process.env.EXTEND_TO_LEDGERS) || 100000;
const MIN_BALANCE_XLM = Number(process.env.MIN_KEEPER_BALANCE_XLM) || 10;

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

const CONTRACT_TARGETS: string[] = (
  process.env.BAZAAR_CONTRACT_IDS ||
  process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID ||
  ""
)
  .split(",")
  .map((id) => id.trim())
  .filter((id) => id.length > 0);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let isDaemonRunning = true;

// ==========================================
// 2. SANITIZED WEBHOOK DISPATCHER
// ==========================================
type AlertLevel = "INFO" | "WARN" | "CRITICAL";

async function dispatchAlert(title: string, message: string, level: AlertLevel = "INFO") {
  // Sanitize message: strictly prevent private keys or secrets from leaking
  const sanitizedMsg = message
    .replace(/S[A-Z0-9]{55}/g, "[REDACTED_SECRET_KEY]")
    .replace(/http[s]?:\/\/[^\s]+/g, (url) => (url.includes("webhook") ? "[REDACTED_URL]" : url));

  const icons: Record<AlertLevel, string> = {
    INFO: "ℹ️",
    WARN: "⚠️",
    CRITICAL: "🚨",
  };

  const formattedTitle = `${icons[level]} [Bazaar Keeper] ${title}`;

  // 1. Send Discord Webhook
  if (DISCORD_WEBHOOK_URL) {
    try {
      const colors: Record<AlertLevel, number> = {
        INFO: 0x3498db, // Blue
        WARN: 0xf39c12, // Amber
        CRITICAL: 0xe74c3c, // Red
      };

      await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: formattedTitle,
              description: sanitizedMsg,
              color: colors[level],
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
    } catch (err: any) {
      console.error("⚠️ Failed to dispatch Discord webhook alert:", err?.message || err);
    }
  }

  // 2. Send Telegram Alert
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    try {
      const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const telegramText = `*${formattedTitle}*\n\n${sanitizedMsg}`;

      await fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: telegramText,
          parse_mode: "Markdown",
        }),
      });
    } catch (err: any) {
      console.error("⚠️ Failed to dispatch Telegram alert:", err?.message || err);
    }
  }
}

// ==========================================
// 3. LEDGER & BALANCE AUDITING
// ==========================================
async function checkKeeperBalance(server: rpc.Server, keeperKeypair: Keypair): Promise<number> {
  const accountKey = xdr.LedgerKey.account(
    new xdr.LedgerKeyAccount({
      accountId: keeperKeypair.xdrPublicKey(),
    })
  );

  const res = await server.getLedgerEntries(accountKey);
  if (!res.entries || res.entries.length === 0) {
    throw new Error(`Keeper account ${keeperKeypair.publicKey().slice(0, 6)}... not found on ledger.`);
  }

  const accountEntry = res.entries[0].val.account();
  const stroops = accountEntry.balance().toBigInt();
  const balanceXlm = Number(stroops) / 10_000_000;

  if (balanceXlm < MIN_BALANCE_XLM) {
    await dispatchAlert(
      "Low Gas Fuel Warning",
      `Keeper wallet \`${keeperKeypair.publicKey().slice(0, 6)}...${keeperKeypair.publicKey().slice(-4)}\` balance is **${balanceXlm.toFixed(2)} XLM** (Threshold: ${MIN_BALANCE_XLM} XLM).\n\nRefuel immediately to prevent extension failures.`,
      "WARN"
    );
  }

  return balanceXlm;
}

// ==========================================
// 4. CORE CONTRACT SWEEP LOGIC
// ==========================================
async function sweepContract(
  server: rpc.Server,
  keeperKeypair: Keypair,
  contractId: string,
  currentLedger: number
): Promise<void> {
  const contractAddress = Address.fromString(contractId);
  const contractInstanceKey = xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: contractAddress.toScAddress(),
      key: xdr.ScVal.scvLedgerKeyContractInstance(),
      durability: xdr.ContractDataDurability.persistent(),
    })
  );

  const ledgerEntries = await server.getLedgerEntries(contractInstanceKey);
  if (!ledgerEntries.entries || ledgerEntries.entries.length === 0) {
    console.warn(`⚠️ [TARGET: ${contractId.slice(0, 8)}...] Instance key not found on ledger.`);
    return;
  }

  const entry = ledgerEntries.entries[0];
  const liveUntil = entry.liveUntilLedgerSeq ?? 0;
  const remainingTtl = liveUntil > currentLedger ? liveUntil - currentLedger : 0;

  console.log(
    `📊 [TARGET: ${contractId.slice(0, 8)}...] Live Until: ${liveUntil} | Remaining: ${remainingTtl} ledgers`
  );

  if (remainingTtl < TTL_THRESHOLD) {
    console.log(
      `⚡ [TARGET: ${contractId.slice(0, 8)}...] Remaining TTL < ${TTL_THRESHOLD}. Extending to ${EXTEND_TO_LIFETIME}...`
    );

    const account = await server.getAccount(keeperKeypair.publicKey());
    const extendOp = Operation.extendFootprintTtl({
      extendTo: EXTEND_TO_LIFETIME,
    });

    // 1. Build footprint containing the contract instance key
    const initialSorobanData = new SorobanDataBuilder()
      .setReadOnly([contractInstanceKey])
      .build();

    // 2. Attach sorobanData to raw transaction before preparation
    const rawTx = new TransactionBuilder(account, {
      fee: "100000",
      networkPassphrase: Networks.TESTNET,
    })
      .setTimeout(30)
      .addOperation(extendOp)
      .setSorobanData(initialSorobanData)
      .build();

    // 3. Prepare, simulate, sign, and broadcast
    const preparedTx = await server.prepareTransaction(rawTx);
    preparedTx.sign(keeperKeypair);

    const response = await server.sendTransaction(preparedTx);

    if (response.status === "ERROR") {
      const errorDetail = response.errorResult
        ? response.errorResult.toXDR("base64")
        : JSON.stringify(response);

      const errorMsg = `Contract: \`${contractId}\`\nRemaining TTL: **${remainingTtl}**\nReason: \`${errorDetail}\``;
      await dispatchAlert("TTL Extension Rejected", errorMsg, "CRITICAL");
      throw new Error(`Transaction rejected: ${errorDetail}`);
    }

    const successMsg = `Extended Contract: \`${contractId.slice(0, 8)}...${contractId.slice(-6)}\`\nTarget Lifetime: **${EXTEND_TO_LIFETIME} ledgers**\nTx Hash: \`${response.hash}\``;
    await dispatchAlert("TTL Restored Successfully", successMsg, "INFO");
    console.log(`✅ [TARGET: ${contractId.slice(0, 8)}...] TTL extended successfully. Hash: ${response.hash}`);
  } else {
    console.log(`✨ [TARGET: ${contractId.slice(0, 8)}...] TTL healthy.`);
  }
}

// ==========================================
// 5. DAEMON RUNTIME & SIGNALS
// ==========================================
process.on("SIGINT", () => {
  console.log("\n🛑 [KEEPER-DAEMON] SIGINT received. Shutting down cleanly...");
  isDaemonRunning = false;
});

process.on("SIGTERM", () => {
  console.log("\n🛑 [KEEPER-DAEMON] SIGTERM received. Shutting down cleanly...");
  isDaemonRunning = false;
});

async function startTtlDaemon() {
  console.log("🛡️ [KEEPER-DAEMON] Initializing MESH Multi-Contract TTL Keeper Daemon");
  console.log(`⏱️ [KEEPER-DAEMON] Sweep interval: Every ${POLL_INTERVAL_MINUTES} minute(s)`);
  console.log(`🎯 [KEEPER-DAEMON] Loaded Targets: ${CONTRACT_TARGETS.length} contract(s)\n`);

  if (!KEEPER_SECRET) {
    console.error("❌ [KEEPER-DAEMON] Fatal: Missing KEEPER_SIGNER_SECRET in environment.");
    process.exit(1);
  }

  if (CONTRACT_TARGETS.length === 0) {
    console.error("❌ [KEEPER-DAEMON] Fatal: No valid contract IDs provided.");
    process.exit(1);
  }

  const server = new rpc.Server(RPC_URL);
  const keeperKeypair = Keypair.fromSecret(KEEPER_SECRET);

  let cycleCount = 1;

  while (isDaemonRunning) {
    console.log(`══════════════════════ [ SWEEP CYCLE #${cycleCount} ] ══════════════════════`);
    const cycleStart = Date.now();

    try {
      const balance = await checkKeeperBalance(server, keeperKeypair);
      console.log(`⛽ Keeper Gas Balance: ${balance.toFixed(2)} XLM`);

      const latestLedger = await server.getLatestLedger();
      const currentLedger = latestLedger.sequence;
      console.log(`📡 Network Ledger Sequence: ${currentLedger}`);

      for (const contractId of CONTRACT_TARGETS) {
        if (!isDaemonRunning) break;
        try {
          await sweepContract(server, keeperKeypair, contractId, currentLedger);
        } catch (contractErr: any) {
          console.error(`❌ Sweep failed for ${contractId}:`, contractErr?.message || contractErr);
        }
      }
    } catch (globalErr: any) {
      console.error("❌ Fatal network/RPC failure during cycle:", globalErr?.message || globalErr);
      await dispatchAlert(
        "RPC / Network Failure",
        `Daemon failed during sweep cycle #${cycleCount}:\n\`${globalErr?.message || globalErr}\``,
        "CRITICAL"
      );
    }

    const elapsedMs = Date.now() - cycleStart;
    const intervalMs = POLL_INTERVAL_MINUTES * 60 * 1000;
    const nextSleep = Math.max(0, intervalMs - elapsedMs);

    console.log(`💤 Sweep cycle finished in ${elapsedMs}ms. Sleeping for ${Math.round(nextSleep / 1000)}s...\n`);
    cycleCount++;

    await sleep(nextSleep);
  }

  console.log("🛑 [KEEPER-DAEMON] Daemon cleanly stopped.");
}

startTtlDaemon();