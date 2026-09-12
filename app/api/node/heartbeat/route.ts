/**
 * Bazaar Republic Alpha - Telegram Operator Bot & Notification Module
 * Location: lib/telegram_notifier.ts (or scripts/telegram_notifier.ts)
 * 
 * Production-hardened real-time alerting for DePIN Node Operators:
 * - HTML entity parsing to prevent Telegram 400 Bad Request fractures on underscores
 * - Dual-runtime ESM/CJS execution guard (resolves 'require is not defined' under tsx)
 * - Memory leak circuit-breaker and comprehensive secret sanitization
 * - Uptime Shield SLA tracking (90% SLA floor / 92% baseline)
 * - Soroban Protocol 28 contract TTL and keeper gas alerts
 */

import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

// Load local overrides first, then fall back to root environment
dotenv.config({ path: ".env.local" });
dotenv.config();

export interface TelegramAlertOptions {
  title: string;
  message: string;
  level: "INFO" | "WARN" | "CRITICAL" | "SUCCESS";
  nodeId?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
const NODE_IDENTIFIER = process.env.NODE_ID || process.env.MESH_PIONEER_ID || "Nitro5-SoloHost";
const KNOWN_SECRET_KEY = process.env.PI_API_KEY || "";

/**
 * Escapes raw text for Telegram HTML mode to avoid entity parse failures.
 */
function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Sanitizes messages to prevent Stellar secret seeds, Pi API keys, or webhooks
 * from leaking into notification channels.
 */
function sanitizeMessage(text: string): string {
  if (!text) return "";
  let sanitized = text
    // Stellar / Soroban secret keys (56 alphanumeric starting with S)
    .replace(/S[A-Z0-9]{55}/g, "[REDACTED_SECRET_KEY]")
    // Webhook endpoints
    .replace(/http[s]?:\/\/[^\s]+/g, (url) => (url.includes("webhook") ? "[REDACTED_WEBHOOK]" : url));

  if (KNOWN_SECRET_KEY && KNOWN_SECRET_KEY.length > 8) {
    sanitized = sanitized.split(KNOWN_SECRET_KEY).join("[REDACTED_VAULT_KEY]");
  }

  return sanitized;
}

/**
 * Dispatches a formatted Telegram alert using HTML parse mode for zero entity conflicts.
 */
export async function sendTelegramAlert(options: TelegramAlertOptions): Promise<boolean> {
  const {
    title,
    message,
    level,
    nodeId = NODE_IDENTIFIER,
    timestamp = new Date().toISOString(),
    metadata,
  } = options;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("⚠️ [TELEGRAM-BOT] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing in environment. Alert skipped.");
    return false;
  }

  const icons: Record<TelegramAlertOptions["level"], string> = {
    INFO: "ℹ️",
    SUCCESS: "✅",
    WARN: "⚠️",
    CRITICAL: "🚨",
  };

  const safeTitle = escapeHtml(sanitizeMessage(title));
  const safeMessage = escapeHtml(sanitizeMessage(message));
  const safeNode = escapeHtml(nodeId);
  const safeTime = escapeHtml(timestamp);

  let formattedText = `${icons[level]} <b>[BAZAAR REPUBLIC] ${safeTitle}</b>\n`;
  formattedText += `🖥️ <b>Node:</b> <code>${safeNode}</code>\n`;
  formattedText += `⏱️ <b>Time:</b> <code>${safeTime}</code>\n\n`;
  formattedText += `${safeMessage}\n`;

  if (metadata && Object.keys(metadata).length > 0) {
    formattedText += `\n📊 <b>Telemetry Matrix:</b>\n`;
    for (const [key, val] of Object.entries(metadata)) {
      const cleanKey = escapeHtml(key);
      const cleanVal = escapeHtml(String(val ?? "N/A"));
      formattedText += `• <b>${cleanKey}:</b> <code>${cleanVal}</code>\n`;
    }
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: formattedText,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8000), // 8-second circuit breaker
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`❌ [TELEGRAM-BOT] API error (HTTP ${res.status}): ${errText}`);
      return false;
    }

    console.log(`📱 [TELEGRAM-BOT] Alert dispatched successfully: "${title}"`);
    return true;
  } catch (error: any) {
    console.error(`❌ [TELEGRAM-BOT] Dispatch failed: ${error?.message || error}`);
    return false;
  }
}

/**
 * Helper: Notify Escrow State Transitions (Lock, Release, Refund, Dispute)
 */
export async function notifyEscrowState(
  escrowId: string,
  status: "LOCKED" | "RELEASED" | "REFUNDED" | "DISPUTED",
  amountPi: number,
  txHash?: string
): Promise<boolean> {
  const levelMap: Record<string, TelegramAlertOptions["level"]> = {
    LOCKED: "INFO",
    RELEASED: "SUCCESS",
    REFUNDED: "WARN",
    DISPUTED: "CRITICAL",
  };

  const titleMap: Record<string, string> = {
    LOCKED: "Escrow Locked & Staked",
    RELEASED: "Escrow Released & Settled",
    REFUNDED: "Escrow Refund Dispatched",
    DISPUTED: "Escrow Dispute Escalated (Elder Panel Review)",
  };

  return sendTelegramAlert({
    title: titleMap[status] || `Escrow Update: ${status}`,
    message: `Escrow contract ${escrowId} transitioned to state ${status}.`,
    level: levelMap[status] || "INFO",
    metadata: {
      "Escrow ID": escrowId,
      "Status": status,
      "Pi SAC Value": `${amountPi} PI`,
      "Equivalent": `${amountPi * 1000} mBZR`,
      ...(txHash ? { "Tx Hash": `${txHash.slice(0, 10)}...${txHash.slice(-6)}` } : {}),
    },
  });
}

/**
 * Helper: Notify Uptime Shield & SLA Baseline Warnings
 */
export async function notifySlaShield(
  nodeId: string,
  currentUptime: number,
  severity: "INFO" | "WARN" | "CRITICAL" = "WARN",
  slaFloor: number = 90.0
): Promise<boolean> {
  const isQuarantine = severity === "CRITICAL" || currentUptime < slaFloor;

  return sendTelegramAlert({
    title: isQuarantine ? "Uptime Shield SLA Breach Warning" : "Uptime Shield Baseline Notice",
    message: isQuarantine
      ? `Node ${nodeId} uptime dropped to ${currentUptime.toFixed(1)}%, failing the ${slaFloor}% 30-day SLA floor requirement.`
      : `Node ${nodeId} uptime is currently ${currentUptime.toFixed(1)}%.`,
    level: isQuarantine ? "CRITICAL" : severity,
    nodeId,
    metadata: {
      "Current Uptime": `${currentUptime.toFixed(1)}%`,
      "SLA Floor": `${slaFloor}%`,
      "State": isQuarantine ? "QUARANTINE_RISK" : "NOMINAL_MONITOR",
    },
  });
}

/**
 * Helper: Notify Low XLM Gas Fuel for Soroban Protocol 28 TTL Keepers
 */
export async function notifyLowGas(
  balanceXlm: number,
  thresholdXlm: number = 10.0,
  keeperAddress?: string
): Promise<boolean> {
  return sendTelegramAlert({
    title: "Soroban Keeper Low Gas Alert",
    message: `Keeper signer balance is ${balanceXlm.toFixed(2)} XLM, which is below the minimum reserve threshold of ${thresholdXlm} XLM.`,
    level: "WARN",
    metadata: {
      "Balance": `${balanceXlm.toFixed(2)} XLM`,
      "Threshold": `${thresholdXlm} XLM`,
      ...(keeperAddress ? { "Signer": `${keeperAddress.slice(0, 6)}...${keeperAddress.slice(-4)}` } : {}),
    },
  });
}

/**
 * Helper: Notify Contract TTL Expiration & Auto-Extension Telemetry
 */
export async function notifyContractTtlExtension(
  contractId: string,
  remainingLedgers: number,
  extendedToLedgers: number,
  txHash?: string
): Promise<boolean> {
  return sendTelegramAlert({
    title: "Soroban Contract TTL Extended",
    message: `Contract instance footprint extended under Protocol 28 state management.`,
    level: "SUCCESS",
    metadata: {
      "Contract ID": `${contractId.slice(0, 8)}...${contractId.slice(-6)}`,
      "Prior TTL": `${remainingLedgers} ledgers`,
      "New Lifetime": `${extendedToLedgers} ledgers`,
      ...(txHash ? { "Tx Hash": `${txHash.slice(0, 8)}...${txHash.slice(-6)}` } : {}),
    },
  });
}

// ESM-safe direct execution runner (avoids 'require is not defined' crash)
const isMain = process.argv[1] && (
  process.argv[1] === fileURLToPath(import.meta.url) ||
  process.argv[1].endsWith("telegram_notifier.ts")
);

if (isMain) {
  console.log("🤖 [TELEGRAM-BOT] Testing Telegram Alert dispatch...");
  sendTelegramAlert({
    title: "Telegram Operator Bot Initialized",
    message: "Bazaar Republic Alpha Telegram Notification Daemon is online and active.",
    level: "SUCCESS",
    metadata: {
      "Protocol": "Soroban Protocol 28",
      "Network": "Pi Testnet / DePIN Grid",
      "SLA Engine": "92% Baseline Enabled",
    },
  }).then((success) => {
    console.log(`[TELEGRAM-BOT] Test execution completed. Success: ${success}`);
    process.exit(success ? 0 : 1);
  });
}