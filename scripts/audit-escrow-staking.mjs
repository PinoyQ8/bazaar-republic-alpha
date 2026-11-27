import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const CANDIDATE_FILES = [
  "context/AuthContext.tsx",
  "app/context/AuthContext.tsx",
  "components/VaultDashboard.tsx",
  "services/bazaarVaultService.ts",
  "lib/pi/settlementHook.ts",
  "app/utils/mesh-tx.ts",
  "app/api/vault/route.ts",
  "app/api/escrow/dispute/resolve/route.ts",
];

// Client transport wrappers that delegate state & sanction enforcement to backend routes / UI callers
const STATE_GUARD_EXEMPT_FILES = new Set(["app/utils/mesh-tx.ts"]);

const EXISTING_FILES = [
  ...new Set(
    CANDIDATE_FILES.filter((rel) => fs.existsSync(path.join(ROOT, rel)))
  ),
];

const STATE_GUARD_PATTERNS = [
  /\bassertEscrowInStatus\b/,
  /\bpioneer\.status\b/,
  /\bFROZEN\b/,
  /\bSUSPENDED\b/,
  /\bLOCKED\b/,
  /\bDISPUTED\b/,
];

function hasEscrowStateGuard(source) {
  return STATE_GUARD_PATTERNS.some((pattern) => pattern.test(source));
}

function runAudit() {
  const findings = [];

  for (const relPath of EXISTING_FILES) {
    if (STATE_GUARD_EXEMPT_FILES.has(relPath)) {
      continue;
    }

    const absPath = path.join(ROOT, relPath);
    const content = fs.readFileSync(absPath, "utf8");

    if (!hasEscrowStateGuard(content)) {
      findings.push({
        severity: "MEDIUM",
        file: relPath,
        line: 1,
        rule: "ESCROW_STATE_GUARD",
        message:
          "Confirm escrow/account status and sanctions/freeze flags are enforced before settlement or release.",
      });
    }
  }

  console.log("=== BAZAAR REPUBLIC ESCROW & STAKING AUDIT ===");
  console.log(`Scanned ${EXISTING_FILES.length} existing candidate files.\n`);

  if (findings.length === 0) {
    console.log(
      "No static vulnerability flags found across scanned escrow & staking files."
    );
    process.exitCode = 0;
    return;
  }

  for (const f of findings) {
    console.log(`[${f.severity}] ${f.file}:${f.line} (${f.rule})`);
    console.log(`  -> ${f.message}\n`);
  }

  process.exitCode = 1;
}

runAudit();