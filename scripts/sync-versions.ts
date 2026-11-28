import fs from "fs";
import path from "path";

interface CliOptions {
  version?: string;
  bump?: "patch" | "minor" | "major";
  proposal?: string;
  seal?: string;
  reason?: string;
  syncProtocols: boolean;
  dryRun: boolean;
}

const SEMVER_RE =
  /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { syncProtocols: false, dryRun: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    if ((arg === "--version" || arg === "-v") && next) {
      opts.version = next.replace(/^v/, "").trim();
      i++;
    } else if ((arg === "--bump" || arg === "-b") && next) {
      const normalized = next.toLowerCase().trim();
      if (
        normalized === "patch" ||
        normalized === "minor" ||
        normalized === "major"
      ) {
        opts.bump = normalized;
      } else {
        throw new Error(`Invalid --bump value: ${next}`);
      }
      i++;
    } else if ((arg === "--proposal" || arg === "-p") && next) {
      opts.proposal = next.trim();
      i++;
    } else if ((arg === "--seal" || arg === "-s") && next) {
      opts.seal = next.trim();
      i++;
    } else if ((arg === "--reason" || arg === "-r") && next) {
      opts.reason = next.trim();
      i++;
    } else if (arg === "--sync-protocols") {
      opts.syncProtocols = true;
    } else if (arg === "--dry-run") {
      opts.dryRun = true;
    }
  }

  return opts;
}

function bumpSemver(
  current: string,
  bump: "patch" | "minor" | "major"
): string {
  const match = current.match(SEMVER_RE);
  if (!match) {
    throw new Error(`Current version "${current}" is not valid SemVer.`);
  }
  let major = Number(match[1]);
  let minor = Number(match[2]);
  let patch = Number(match[3]);

  if (bump === "major") {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (bump === "minor") {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  return `${major}.${minor}.${patch}`;
}

function stripBom(content: string): string {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

function updateJsonFile(
  filePath: string,
  version: string,
  dryRun: boolean
): boolean {
  if (!fs.existsSync(filePath)) return false;
  const raw = stripBom(fs.readFileSync(filePath, "utf-8"));
  const parsed = JSON.parse(raw);

  if (parsed.version === version) return false;
  parsed.version = version;

  if (!dryRun) {
    fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2) + "\n", "utf-8");
  }
  return true;
}

function updateAppVersionConstantsFile(
  filePath: string,
  version: string,
  syncProtocols: boolean,
  dryRun: boolean
): boolean {
  if (!fs.existsSync(filePath)) return false;
  const original = stripBom(fs.readFileSync(filePath, "utf-8"));

  const pattern = syncProtocols
    ? /(export const (?:APP_RELEASE|BAZAAR_APP|MESH|NEO|BAZAAR)(?:_PROTOCOL)?_VERSION\s*=\s*["'])([^"']+)(["'])/g
    : /(export const (?:APP_RELEASE|BAZAAR_APP)_VERSION\s*=\s*["'])([^"']+)(["'])/g;

  const updated = original.replace(pattern, `$1${version}$3`);

  if (updated === original) return false;
  if (!dryRun) {
    fs.writeFileSync(filePath, updated, "utf-8");
  }
  return true;
}

function updatePrismaHeader(
  filePath: string,
  version: string,
  proposal: string | undefined,
  dryRun: boolean
): boolean {
  if (!fs.existsSync(filePath)) return false;
  const original = stripBom(fs.readFileSync(filePath, "utf-8"));
  const tagLine = proposal
    ? `// @bazaar-version: v${version} | governance-ref: ${proposal}`
    : `// @bazaar-version: v${version}`;

  let updated: string;
  if (/^\/\/ @bazaar-version:.*$/m.test(original)) {
    updated = original.replace(/^\/\/ @bazaar-version:.*$/m, tagLine);
  } else {
    updated = `${tagLine}\n\n${original}`;
  }

  if (updated === original) return false;
  if (!dryRun) {
    fs.writeFileSync(filePath, updated, "utf-8");
  }
  return true;
}

function updateCargoToml(
  filePath: string,
  version: string,
  dryRun: boolean
): boolean {
  if (!fs.existsSync(filePath)) return false;
  const original = stripBom(fs.readFileSync(filePath, "utf-8"));
  const lines = original.split(/\r?\n/);
  let inPackageSection = false;
  let changed = false;

  const nextLines = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("[")) {
      inPackageSection = trimmed === "[package]";
      return line;
    }
    if (inPackageSection && !changed && /^version\s*=\s*"[^"]+"/.test(trimmed)) {
      changed = true;
      return line.replace(/version\s*=\s*"[^"]+"/, `version = "${version}"`);
    }
    return line;
  });

  if (!changed) return false;
  if (!dryRun) {
    fs.writeFileSync(filePath, nextLines.join("\n") + "\n", "utf-8");
  }
  return true;
}

function appendReleaseLedger(
  repoRoot: string,
  entry: {
    version: string;
    previousVersion: string;
    proposal?: string;
    seal?: string;
    reason?: string;
    updatedFiles: string[];
    timestamp: string;
  },
  dryRun: boolean
): void {
  const dir = path.join(repoRoot, "releases");
  const ledgerFile = path.join(dir, "version-history.json");

  let history: unknown[] = [];
  if (fs.existsSync(ledgerFile)) {
    try {
      const parsed = JSON.parse(stripBom(fs.readFileSync(ledgerFile, "utf-8")));
      if (Array.isArray(parsed)) history = parsed;
    } catch {
      history = [];
    }
  }

  history.unshift(entry);
  if (!dryRun) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(ledgerFile, JSON.stringify(history, null, 2) + "\n", "utf-8");
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(__dirname, "..");
  const parentWorkspace = path.resolve(repoRoot, "..");

  const pkgPath = path.join(repoRoot, "package.json");
  if (!fs.existsSync(pkgPath)) {
    throw new Error(`package.json not found at ${pkgPath}`);
  }

  const pkgJson = JSON.parse(stripBom(fs.readFileSync(pkgPath, "utf-8")));
  const currentVersion: string = pkgJson.version || "0.1.1";

  let targetVersion: string;
  if (opts.version) {
    if (!SEMVER_RE.test(opts.version)) {
      throw new Error(`Invalid SemVer target version: "${opts.version}"`);
    }
    targetVersion = opts.version;
  } else {
    targetVersion = bumpSemver(currentVersion, opts.bump || "patch");
  }

  console.log(
    `[VERSION-SYNC] ${currentVersion} -> ${targetVersion}${opts.dryRun ? " (DRY RUN)" : ""}`
  );

  const updatedFiles: string[] = [];

  const jsonTargets = [
    path.join(repoRoot, "package.json"),
    path.join(repoRoot, "solohost.json"),
  ];
  for (const target of jsonTargets) {
    if (updateJsonFile(target, targetVersion, opts.dryRun)) {
      updatedFiles.push(path.relative(repoRoot, target));
    }
  }

  const versionConstantTargets = [
    path.join(repoRoot, "app", "utils", "meshConfig.ts"),
    path.join(repoRoot, "lib", "constants.ts"),
    path.join(repoRoot, "lib", "pi", "paymentEnv.ts"),
  ];
  for (const target of versionConstantTargets) {
    if (
      updateAppVersionConstantsFile(
        target,
        targetVersion,
        opts.syncProtocols,
        opts.dryRun
      )
    ) {
      updatedFiles.push(path.relative(repoRoot, target));
    }
  }

  const prismaSchema = path.join(repoRoot, "prisma", "schema.prisma");
  if (updatePrismaHeader(prismaSchema, targetVersion, opts.proposal, opts.dryRun)) {
    updatedFiles.push("prisma/schema.prisma");
  }

  const cargoTargets = [
    path.join(repoRoot, "Cargo.toml"),
    path.join(repoRoot, "contracts", "bazaar-vault", "Cargo.toml"),
    path.join(parentWorkspace, "Cargo.toml"),
  ];
  for (const target of cargoTargets) {
    if (updateCargoToml(target, targetVersion, opts.dryRun)) {
      updatedFiles.push(path.relative(repoRoot, target));
    }
  }

  appendReleaseLedger(
    repoRoot,
    {
      version: targetVersion,
      previousVersion: currentVersion,
      proposal: opts.proposal,
      seal: opts.seal,
      reason: opts.reason,
      updatedFiles,
      timestamp: new Date().toISOString(),
    },
    opts.dryRun
  );

  console.log(
    `[VERSION-SYNC] Updated ${updatedFiles.length} file(s): ${
      updatedFiles.length ? updatedFiles.join(", ") : "none"
    }`
  );
}

main().catch((err) => {
  console.error("[VERSION-SYNC] Failed:", err?.message || err);
  process.exit(1);
});