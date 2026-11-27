// Location: scripts/audit-payments.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const TARGETS = [
  "app/api/payments/route.ts",
  "app/api/payments/approve/route.ts",
  "app/api/payments/complete/route.ts",
  "app/api/payments/incomplete/route.ts",
  "lib/pi/paymentEnv.ts",
  "lib/pi/piPlatform.ts",
  "lib/pi/settlementHook.ts",
  "app/utils/safePi.ts",
  "components/PiPaymentButton.tsx",
  "app/components/vault/LivePiCheckout.tsx",
  "components/vault/LivePiCheckout.tsx",
];

const findings = [];

function addFinding(severity, file, line, rule, message) {
  findings.push({ severity, file, line, rule, message });
}

function readIfExists(relPath) {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, "utf8");
}

function findLineNumber(content, regex) {
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (regex.test(lines[i])) return i + 1;
  }
  return 1;
}

const existingFiles = [];

for (const relPath of TARGETS) {
  const content = readIfExists(relPath);
  if (content === null) {
    addFinding("LOW", relPath, 1, "MISSING_FILE", "Expected payment file not found at path.");
    continue;
  }

  existingFiles.push({ relPath, content });
  const isClientFile =
    relPath.startsWith("components/") ||
    relPath.startsWith("app/components/") ||
    relPath.startsWith("app/utils/") ||
    /^\s*['"]use client['"]/.test(content);

  // 1. Secret key leakage or client usage
  if (isClientFile && /\b(PI_API_KEY|PI_TESTNET_API_KEY|PI_MAINNET_API_KEY|PI_VALIDATION_KEY)\b/.test(content)) {
    addFinding(
      "HIGH",
      relPath,
      findLineNumber(content, /\b(PI_API_KEY|PI_TESTNET_API_KEY|PI_MAINNET_API_KEY|PI_VALIDATION_KEY)\b/),
      "SERVER_SECRET_IN_CLIENT",
      "Server-side Pi secret/API key referenced in client or shared utility file."
    );
  }

  // 2. Hardcoded API keys or fallback secrets
  if (/(?:api[_-]?key|secret)\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}['"]/i.test(content)) {
    addFinding(
      "HIGH",
      relPath,
      findLineNumber(content, /(?:api[_-]?key|secret)\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}['"]/i),
      "HARDCODED_CREDENTIAL",
      "Potential hardcoded API key or secret literal detected."
    );
  }

  // 3. Payment API routes checks
  if (relPath.startsWith("app/api/payments/")) {
    const usesEnvGuard = /getMeshServerEnv|resolveRequestEnv/.test(content);
    if (!usesEnvGuard) {
      addFinding(
        "MEDIUM",
        relPath,
        1,
        "MISSING_ENV_ISOLATION",
        "Payment route does not reference getMeshServerEnv for Testnet/Mainnet realm isolation."
      );
    }

    const checksNetwork = /fetchAndAssertPiPaymentNetwork|network|realm/.test(content);
    if (!checksNetwork) {
      addFinding(
        "MEDIUM",
        relPath,
        1,
        "MISSING_NETWORK_ASSERTION",
        "Payment route does not visibly verify or tag network/realm state."
      );
    }

    // Check if complete/approve verifies payment details or amount
    if ((relPath.includes("approve") || relPath.includes("complete") || relPath === "app/api/payments/route.ts")) {
      const verifiesPayment = /fetchAndAssertPiPaymentNetwork|\/v2\/payments\//.test(content);
      if (!verifiesPayment) {
        addFinding(
          "HIGH",
          relPath,
          1,
          "UNVERIFIED_PAYMENT_STATE",
          "Approval/completion flow does not fetch/verify payment state from Pi Platform API before acting."
        );
      }
    }

    // Check txid validation on complete
    if (relPath.includes("complete")) {
      const validatesTxid = /!txid|txid/.test(content);
      if (!validatesTxid) {
        addFinding(
          "HIGH",
          relPath,
          1,
          "MISSING_TXID_CHECK",
          "Completion route should strictly validate that a non-empty txid is supplied."
        );
      }
    }

    // Check catch blocks returning 200
    if (/catch\s*\([^)]*\)\s*\{[\s\S]{0,300}status\s*:\s*200/m.test(content)) {
      addFinding(
        "MEDIUM",
        relPath,
        findLineNumber(content, /catch\s*\(/),
        "ERROR_MASKED_AS_200",
        "Catch block appears to return HTTP 200, which can mask payment failures."
      );
    }
  }

  // 4. Settlement hook checks
  if (relPath === "lib/pi/settlementHook.ts") {
    const hasIdempotency = /upsert|findFirst|txSignature|paymentId/.test(content);
    if (!hasIdempotency) {
      addFinding(
        "MEDIUM",
        relPath,
        1,
        "WEAK_IDEMPOTENCY",
        "Settlement hook should guard against duplicate paymentId or txid settlement."
      );
    }
  }

  // 5. Client checkout checks
  if (isClientFile && /createPayment|Pi\.createPayment|safePi/i.test(content)) {
    const hasErrorState = /error|setError|catch/.test(content);
    if (!hasErrorState) {
      addFinding(
        "MEDIUM",
        relPath,
        1,
        "MISSING_CLIENT_ERROR_HANDLING",
        "Client payment component lacks visible error handling or catch flow."
      );
    }
  }
}

console.log("=== BAZAAR REPUBLIC PAYMENT SECURITY AUDIT ===");
console.log(`Scanned ${existingFiles.length} existing target files.\n`);

if (findings.length === 0) {
  console.log("No static vulnerability flags found across scanned payment files.");
} else {
  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);

  for (const f of findings) {
    console.log(`[${f.severity}] ${f.file}:${f.line} (${f.rule})`);
    console.log(`  -> ${f.message}\n`);
  }
}