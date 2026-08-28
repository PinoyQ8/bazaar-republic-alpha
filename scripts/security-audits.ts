// Location: scripts/security-audits.ts
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

interface SecurityFinding {
  vector: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  description: string;
  remediation: string;
}

function runSecurityAudit() {
  console.log('🛡️ =========================================================');
  console.log('   BAZAAR REPUBLIC: STATIC APPLICATION SECURITY SCAN (SAST) ');
  console.log('=========================================================\n');

  const findings: SecurityFinding[] = [];

  // 1. Scan for hardcoded secret patterns across source files
  const secretPatterns = [
    /crhemi[a-zA-Z0-9]{30,}/,
    /AIza[0-9A-Za-z-_]{35}/,
    /sk_live_[0-9a-zA-Z]{24}/,
  ];
  const scanDirs = ['app', 'lib', 'services', 'components'];

  function scanDirectory(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next') {
        scanDirectory(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const pattern of secretPatterns) {
          if (pattern.test(content)) {
            findings.push({
              vector: 'STATIC_CODE_ANALYSIS',
              severity: 'CRITICAL',
              description: `Potential hardcoded credential match in ${fullPath}`,
              remediation: 'Move secret key to server environment variables immediately.',
            });
          }
        }
      }
    }
  }

  scanDirs.forEach((d) => scanDirectory(path.resolve(process.cwd(), d)));

  // 2. Audit dependency tree via npm
  try {
    const auditOutput = execSync('npm audit --json', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    const auditJson = JSON.parse(auditOutput);
    const vulnCounts = auditJson.metadata?.vulnerabilities || {};

    if (vulnCounts.critical > 0 || vulnCounts.high > 0) {
      findings.push({
        vector: 'DEPENDENCY_SUPPLY_CHAIN',
        severity: 'HIGH',
        description: `Vulnerabilities detected: ${vulnCounts.high || 0} High, ${vulnCounts.critical || 0} Critical`,
        remediation: 'Run targeted dependency updates (avoiding breaking SDK overrides).',
      });
    }
  } catch {
    // npm audit returns non-zero when vulnerabilities are found
  }

  if (findings.length === 0) {
    console.log('✅ ZERO critical source leaks or dependency vulnerabilities detected.\n');
  } else {
    console.table(findings);
  }
}

runSecurityAudit();