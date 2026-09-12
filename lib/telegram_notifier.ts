/**
 * Bazaar Republic Alpha - Telegram Operator Bot & Notification Module
 * Location: lib/telegram_notifier.ts
 *
 * Real-time alerting for DePIN Node Operators:
 * - HTML entity parsing to prevent Telegram 400 Bad Request fractures on underscores
 * - Comprehensive secret sanitization (Stellar keys, webhooks, Pi credentials)
 * - Uptime Shield SLA tracking (90% SLA floor baseline)
 * - Soroban Protocol 28 contract TTL and keeper gas alerts
 */

import dotenv from "dotenv";

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

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sanitizeMessage(text: string): string {
  if (!text) return "";
  let sanitized = text
    .replace(/S[A-Z0-9]{55}/g, "[REDACTED_SECRET_KEY]")
    .replace(/http[s]?:\/\/[^\s]+/g, (url) => (url.includes("webhook") ? "[REDACTED_URL]" : url));

  if (KNOWN_SECRET_KEY && KNOWN_SECRET_KEY.length > 8) {
    sanitized = sanitized.split(KNOWN_SECRET_KEY).join("[REDACTED_VAULT_KEY]");
  }

  return sanitized;
}

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
    formattedText += `\n📊 <b>Details:</b>\n`;
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
      signal: AbortSignal.timeout(8000),
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
    LOCKED: "Escrow Locked",
    RELEASED: "Escrow Released & Settled",
    REFUNDED: "Escrow Refunded",
    DISPUTED: "Escrow Dispute Escalated (5-Elder Panel)",
  };

  return sendTelegramAlert({
    title: titleMap[status] || `Escrow Update: ${status}`,
    message: `Escrow Contract ${escrowId} updated to status ${status}.`,
    level: levelMap[status] || "INFO",
    metadata: {
      "Escrow ID": escrowId,
      "Status": status,
      "Amount": `${amountPi} PI (${amountPi * 1000} mBZR)`,
      ...(txHash ? { "Tx Hash": `${txHash.slice(0, 10)}...${txHash.slice(-6)}` } : {}),
    },
  });
}

export async function notifySlaShield(
  nodeId: string,
  currentUptime: number,
  severity: "INFO" | "WARN" | "CRITICAL" = "WARN",
  slaFloor: number = 90.0
): Promise<boolean> {
  const isQuarantine = severity === "CRITICAL" || currentUptime < slaFloor;

  return sendTelegramAlert({
    title: isQuarantine ? "Uptime Shield SLA Alert!" : "Uptime Shield Warning",
    message: isQuarantine
      ? `Node ${nodeId} uptime has dropped to ${currentUptime.toFixed(1)}%, failing the strict ${slaFloor}% 30-day SLA floor.`
      : `Node ${nodeId} uptime is currently ${currentUptime.toFixed(1)}%.`,
    level: isQuarantine ? "CRITICAL" : severity,
    nodeId,
    metadata: {
      "Current Uptime": `${currentUptime.toFixed(1)}%`,
      "SLA Floor": `${slaFloor}%`,
      "Status": isQuarantine ? "QUARANTINE_WARNING" : "SLA_WARN",
    },
  });
}

export async function notifyLowGas(
  balanceXlm: number,
  thresholdXlm: number = 10.0,
  keeperAddress?: string
): Promise<boolean> {
  return sendTelegramAlert({
    title: "Low Soroban Gas Fuel Warning",
    message: `Keeper signer balance is ${balanceXlm.toFixed(2)} XLM (below safety buffer of ${thresholdXlm} XLM). Refuel immediately.`,
    level: "WARN",
    metadata: {
      "Balance": `${balanceXlm.toFixed(2)} XLM`,
      "Threshold": `${thresholdXlm} XLM`,
      ...(keeperAddress ? { "Signer": `${keeperAddress.slice(0, 6)}...${keeperAddress.slice(-4)}` } : {}),
    },
  });
}