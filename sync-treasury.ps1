# ==============================================================================
# BAZAAR REPUBLIC: TREASURY LEDGER SYNC & VALIDATION PROTOCOL
# ==============================================================================
$ErrorActionPreference = "Stop"

Write-Host ">>> [1/4] Generating Prisma Client Bindings..." -ForegroundColor Cyan
npx prisma generate

Write-Host ">>> [2/4] Pushing Schema Changes to MongoDB Atlas..." -ForegroundColor Cyan
npx prisma db push

Write-Host ">>> [3/4] Validating Treasury Ledger Direct Write..." -ForegroundColor Cyan

# Use single-quoted here-string to prevent PowerShell from parsing JS dollar signs
$nodeScript = @'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testTreasuryWrite() {
  try {
    const testHash = 'TX_TEST_' + Date.now();
    const entry = await prisma.treasuryLedger.create({
      data: {
        epochId: 1,
        transactionType: 'INFLOW_FEE',
        amount: 100.0,
        asset: 'mBZR',
        stellarTxHash: testHash,
        senderNodeId: 'NODE_POWERSHELL_FORGE',
        recipientNodeId: 'TREASURY_VAULT_RESERVE',
        reserveBalance: 100000.0
      }
    });
    console.log('[STATUS 200] Treasury Write Successful! Record ID:', entry.id);
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[DATABASE_WRITE_FAULT] Ledger Write Failed:', err.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testTreasuryWrite();
'@

node -e "$nodeScript"

if ($LASTEXITCODE -eq 0) {
    Write-Host ">>> [4/4] Verification Complete. Staging and Deployment Ready." -ForegroundColor Green
} else {
    Write-Host ">>> [ERROR] Treasury validation failed. Check connection string or Atlas permissions." -ForegroundColor Red
}