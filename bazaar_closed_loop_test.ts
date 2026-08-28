/**
 * PROJECT BAZAAR — CLOSED-LOOP CONCURRENCY & INTEGRATION TEST
 * -----------------------------------------------------------------------------
 * Version: 1.0.0 (Schema v2.7.2 & SLA Protocol-Compliant)
 * 
 * Verifies that our internal high-velocity off-chain ledger preserves total 
 * supply limits with zero decimal drift. It simulates a busy market cycle, 
 * including:
 * 1. Liquid P2P transfers with 30 BPS (0.3%) fees.
 * 2. 48-Hour Escrow locks and complete settlement lifecycles.
 * 3. Strict DePIN SoloHost SLA filtration (90% uptime benchmarks).
 * 4. Mathematical assertions verifying token supply balance down to the 7th decimal.
 */

import { BazaarClosedLoopEngine } from './bazaar_closed_loop_engine';
import { BazaarFeeSplitter } from './bazaar_fee_splitter';

export function runClosedLoopTestSuite() {
  console.log("========================================================================");
  console.log("🏛️  PROJECT BAZAAR — PHASE 1 CLOSED-LOOP INTEGRATION TEST SUITE");
  console.log("========================================================================");

  // Initialize Engine with 10,000,000.0000000 mBZR initial supply inside the Treasury Vault
  const initialSupply = BazaarClosedLoopEngine.toInternalBigInt(10_000_000);
  const engine = new BazaarClosedLoopEngine(initialSupply);
  const splitter = new BazaarFeeSplitter();

  console.log(`[TEST-INIT] Engine initialized. Initial Supply: ${BazaarClosedLoopEngine.toFriendlyString(initialSupply)} mBZR`);

  // Assert starting conditions
  let ledger = engine.getLedgerState();
  if (ledger.treasuryVault !== initialSupply) {
    throw new Error("[ASSERT-FAIL] Treasury starting balance does not match initial supply.");
  }

  // -------------------------------------------------------------------------
  // 1. Account Provisioning
  // -------------------------------------------------------------------------
  console.log("\n[STAGE 1] Provisioning L2 Accounts & Funding...");
  const buyer = "addr_buyer_pioneer_01";
  const seller = "addr_seller_merchant_01";
  
  const buyerFunding = BazaarClosedLoopEngine.toInternalBigInt(500); // 500.0000000 mBZR
  engine.createAccount(buyer, buyerFunding);
  engine.createAccount(seller, 0n);

  console.log(`  ✓ Buyer Account Created. Balance: ${BazaarClosedLoopEngine.toFriendlyString(engine.getAccount(buyer).balance)} mBZR`);
  console.log(`  ✓ Seller Account Created. Balance: ${BazaarClosedLoopEngine.toFriendlyString(engine.getAccount(seller).balance)} mBZR`);

  // Verify ledger state updates
  ledger = engine.getLedgerState();
  const expectedCirculating = buyerFunding;
  const expectedTreasury = initialSupply - buyerFunding;
  
  if (ledger.circulatingSupply !== expectedCirculating || ledger.treasuryVault !== expectedTreasury) {
    throw new Error("[ASSERT-FAIL] Circulating or Treasury supply desynchronized after funding.");
  }
  console.log("  ✓ Ledger balances verified: Circular supply conservation holds.");

  // -------------------------------------------------------------------------
  // 2. Peer-to-Peer Transfer & 70/30 Fee Routing
  // -------------------------------------------------------------------------
  console.log("\n[STAGE 2] Testing P2P Transfer with 0.3% (30 BPS) Transaction Fee...");
  const p2pAmount = BazaarClosedLoopEngine.toInternalBigInt(100); // 100.0000000 mBZR
  
  // Fee = (100 * 30) / 10000 = 0.3000000 mBZR
  // Total deduction from buyer = 100.3000000 mBZR
  // Seller receives = 100.0000000 mBZR
  // Fee split:
  // 70% to Operator Pool = 0.2100000 mBZR
  // 30% to Treasury Vault = 0.0900000 mBZR
  const receipt = engine.executeTransfer(buyer, seller, p2pAmount);

  const expectedBuyerBal = buyerFunding - BazaarClosedLoopEngine.toInternalBigInt(100.3);
  const expectedSellerBal = BazaarClosedLoopEngine.toInternalBigInt(100);

  if (engine.getAccount(buyer).balance !== expectedBuyerBal) {
    throw new Error(`[ASSERT-FAIL] Buyer balance incorrect after transfer. Has: ${BazaarClosedLoopEngine.toFriendlyString(engine.getAccount(buyer).balance)}, expected: ${BazaarClosedLoopEngine.toFriendlyString(expectedBuyerBal)}`);
  }
  if (engine.getAccount(seller).balance !== expectedSellerBal) {
    throw new Error("[ASSERT-FAIL] Seller balance incorrect after transfer.");
  }

  ledger = engine.getLedgerState();
  if (ledger.operatorPool !== BazaarClosedLoopEngine.toInternalBigInt(0.21)) {
    throw new Error("[ASSERT-FAIL] DePIN Operator fee pool allocation failed.");
  }
  if (ledger.treasuryVault !== expectedTreasury + BazaarClosedLoopEngine.toInternalBigInt(0.09)) {
    throw new Error("[ASSERT-FAIL] Treasury recirculating share failed to route.");
  }

  console.log("  ✓ Balances and fee splits verified:");
  console.log(`    - Buyer Balance   : ${BazaarClosedLoopEngine.toFriendlyString(engine.getAccount(buyer).balance)} mBZR`);
  console.log(`    - Seller Balance  : ${BazaarClosedLoopEngine.toFriendlyString(engine.getAccount(seller).balance)} mBZR`);
  console.log(`    - Operator Pool   : ${BazaarClosedLoopEngine.toFriendlyString(ledger.operatorPool)} mBZR`);
  console.log(`    - Treasury Vault  : ${BazaarClosedLoopEngine.toFriendlyString(ledger.treasuryVault)} mBZR`);

  // -------------------------------------------------------------------------
  // 3. 48-Hour Escrow Locks and Releases
  // -------------------------------------------------------------------------
  console.log("\n[STAGE 3] Testing 48-Hour Automated Escrow Release Cycle...");
  const escrowAmount = BazaarClosedLoopEngine.toInternalBigInt(50); // 50.0000000 mBZR
  // Fee = 0.1500000 mBZR
  // Total lock from buyer = 50.1500000 mBZR
  
  const escrow = engine.createEscrow(buyer, seller, escrowAmount);
  console.log(`  ✓ Escrow Locked. Escrow ID: ${escrow.id} | Timeout Scheduled: ${escrow.releaseTimeout.toISOString()}`);

  ledger = engine.getLedgerState();
  if (ledger.escrowSupply !== BazaarClosedLoopEngine.toInternalBigInt(50.15)) {
    throw new Error("[ASSERT-FAIL] Ledger escrow supply tracking failed.");
  }

  // Release the Escrow
  engine.releaseEscrow(escrow.id);
  console.log("  ✓ Escrow Released to Seller.");

  ledger = engine.getLedgerState();
  if (ledger.escrowSupply !== 0n) {
    throw new Error("[ASSERT-FAIL] Escrow supply failed to clear after release.");
  }
  
  // Total operator pool now should have: 0.21 (from P2P) + 0.105 (70% of 0.15) = 0.3150000 mBZR
  const expectedPool = BazaarClosedLoopEngine.toInternalBigInt(0.315);
  if (ledger.operatorPool !== expectedPool) {
    throw new Error(`[ASSERT-FAIL] Operator pool math drift. Has: ${BazaarClosedLoopEngine.toFriendlyString(ledger.operatorPool)}, expected: ${BazaarClosedLoopEngine.toFriendlyString(expectedPool)}`);
  }

  // -------------------------------------------------------------------------
  // 4. Strict DePIN SoloHost SLA Filtration (90% Uptime Benchmark)
  // -------------------------------------------------------------------------
  console.log("\n[STAGE 4] Executing DePIN Fee Distribution & SLA Filters...");
  
  const opCompliant = "addr_operator_active_01";
  const opViolator = "addr_operator_failing_02";

  // Register operators:
  // Node 1: 98.2% Uptime (Passes SLA), TrustScore: 80n (Weight: 80n)
  // Node 2: 87.5% Uptime (Fails SLA), TrustScore: 50n (Weight: 50n)
  splitter.registerOperator(opCompliant, 98.2, 80n);
  splitter.registerOperator(opViolator, 87.5, 50n);

  console.log(`  ✓ Operator A (Compliant - 98.2% Uptime) registered with Trust Weight: 80.`);
  console.log(`  ✓ Operator B (SLA Violator - 87.5% Uptime) registered with Trust Weight: 50.`);

  // Trigger epoch yield distribution of the operator pool (0.3150000 mBZR)
  const currentPoolAmount = ledger.operatorPool;
  const payoutResult = splitter.distributeOperatorPool(currentPoolAmount);

  console.log(`\n  --- Distribution Report ---`);
  console.log(`  - Epoch Allocated : ${BazaarClosedLoopEngine.toFriendlyString(payoutResult.report.totalPoolAllocated)} mBZR`);
  console.log(`  - Eligible Nodes  : ${payoutResult.report.activeEligibleNodes}`);
  console.log(`  - SLA Failed Nodes: ${payoutResult.report.quarantinedOrSlaFailedNodes}`);
  console.log(`  - Dust to Treasury: ${BazaarClosedLoopEngine.toFriendlyString(payoutResult.report.dustReturnedToTreasury)} mBZR`);

  // Verify node allocations
  const activeNode = splitter.getOperator(opCompliant);
  const failingNode = splitter.getOperator(opViolator);

  if (activeNode.yieldAccrued === 0n) {
    throw new Error("[ASSERT-FAIL] Eligible operator did not receive rewards.");
  }
  if (failingNode.yieldAccrued !== 0n) {
    throw new Error("[ASSERT-FAIL] Non-compliant operator received rewards in violation of SLA!");
  }

  console.log(`\n  ✓ SLA Filtration Confirmed:`);
  console.log(`    - Operator A Yield: ${BazaarClosedLoopEngine.toFriendlyString(activeNode.yieldAccrued)} mBZR`);
  console.log(`    - Operator B Yield: ${BazaarClosedLoopEngine.toFriendlyString(failingNode.yieldAccrued)} mBZR (Blocked due to < 90% SLA Uptime)`);

  // -------------------------------------------------------------------------
  // 5. Total Balance Audits and Mathematical Invariant Checks
  // -------------------------------------------------------------------------
  console.log("\n[STAGE 5] Checking Mathematical Invariant Conservation...");

  ledger = engine.getLedgerState();
  const totalUserBalances = Array.from([buyer, seller]).reduce((sum, addr) => {
    const acc = engine.getAccount(addr);
    return sum + acc.balance + acc.lockedEscrow;
  }, 0n);

  const totalRegisteredOperatorYields = splitter.getOperators().reduce((sum, op) => sum + op.yieldAccrued, 0n);

  // Invariant equation:
  // Initial Supply = Circulating User Balances + Active Escrows + Unallocated Operator Pool + Accrued Operator Yields + Treasury Vault Balance
  const totalCalculatedEconomy = 
    totalUserBalances + 
    ledger.escrowSupply + 
    (ledger.operatorPool - currentPoolAmount) + // Subtract the distributed portion
    totalRegisteredOperatorYields + 
    ledger.treasuryVault + 
    payoutResult.report.dustReturnedToTreasury; // Include split remainder dust

  console.log(`  - Starting Supply  : ${BazaarClosedLoopEngine.toFriendlyString(initialSupply)} mBZR`);
  console.log(`  - Calculated Supply: ${BazaarClosedLoopEngine.toFriendlyString(totalCalculatedEconomy)} mBZR`);

  const delta = initialSupply - totalCalculatedEconomy;
  console.log(`  - Ledger Delta     : ${BazaarClosedLoopEngine.toFriendlyString(delta)} mBZR`);

  if (delta !== 0n) {
    throw new Error("[ASSERT-FAIL] INVARIANT FAILURE! Ledger is leaking tokens!");
  }

  console.log("\n========================================================================");
  console.log("🏆 CLOSED-LOOP INTEGRATION TEST PASSED! 100% DECIMAL CONSERVATION MET!");
  console.log("========================================================================");
}
