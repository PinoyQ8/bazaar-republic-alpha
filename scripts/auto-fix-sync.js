import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appDir = path.join(__dirname, '../app');

function scanDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
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
let fixedCount = 0;

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Replace common stale patterns with dynamic SSOT reference or cleaned string
  if (content.includes('25.2.2') || content.includes('v25.')) {
    // Replace hardcoded version strings with v26.1.0 baseline
    content = content.replace(/v?25\.2\.2/g, '26.1.0');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`[AUTO-FIXED] Synchronized version in: ${path.relative(path.join(__dirname, '..'), file)}`);
    fixedCount++;
  }
});

console.log(`\n✅ AUTO-SYNC COMPLETE: Successfully harmonized ${fixedCount} modules to Protocol v26.1.0.`);