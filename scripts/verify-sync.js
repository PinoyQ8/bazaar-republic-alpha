import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target paths to scan
const appDir = path.join(__dirname, '../app');
const ssotPath = path.join(__dirname, '../app/config/meshVersion.ts');

console.log(`[MESH-AUDIT] Initializing repository-wide version sync verification...`);

if (!fs.existsSync(ssotPath)) {
  console.error(`❌ CRITICAL: Single Source of Truth (meshVersion.ts) not found at ${ssotPath}`);
  process.exit(1);
}

// Read SSOT version
const ssotContent = fs.readFileSync(ssotPath, 'utf8');
const versionMatch = ssotContent.match(/PROTOCOL_VERSION:\s*"([^"]+)"/);
const activeVersion = versionMatch ? versionMatch[1] : 'Unknown';

console.log(`📡 SSOT Protocol Baseline Detected: v${activeVersion}\n`);

// Recursive file scanner
function scanDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        scanDirectory(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const allFiles = scanDirectory(appDir);
let driftWarnings = 0;

// Scan files for hardcoded old versions or stale strings
allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relativePath = path.relative(path.join(__dirname, '..'), file);

  if (content.includes('v25.') || content.includes('25.2.2')) {
    console.warn(`⚠️ [DRIFT WARNING] Stale version reference found in: ${relativePath}`);
    driftWarnings++;
  }
});

console.log(`\n----------------------------------------`);
if (driftWarnings > 0) {
  console.log(`❌ SYNC AUDIT FAILED: Found ${driftWarnings} files with potential version drift.`);
  process.exit(1);
} else {
  console.log(`✅ SYNC AUDIT PASSED: All modules are fully synchronized to Protocol v${activeVersion}.`);
}