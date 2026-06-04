import { NextRequest, NextResponse } from 'next/server';

// Temporary local storage bridge mirroring the live database schema
interface VaultState {
  balance: number;
  isQuarantined: boolean;
  pendingTransactions: Array<{
    txId: string;
    amount: number;
    recipient: string;
    executionTime: number;
    status: 'TIMELOCKED' | 'EXECUTED' | 'VETOED';
  }>;
}

// In-memory simulation state for the active scan node
let mockDbVault: VaultState = {
  balance: 25750.00, // Assets safely stored on-chain
  isQuarantined: false,
  pendingTransactions: []
};

// Define the 24-hour escrow window for high-risk flags
const RISK_THRESHOLD_PERCENT = 0.15; // 15% of total balance triggers restriction
const TIMELOCK_DURATION = 24 * 60 * 60 * 1000; // 24-hour delay frame

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { action, amount, recipient, signature, txId } = payload;

    // 1. CRITICAL FIREWALL: Check if the Citizen Vault is Quarantined
    if (mockDbVault.isQuarantined) {
      return NextResponse.json({
        error: "VAULT_QUARANTINED",
        message: "This vault is locked in a secure security freeze. All outbound asset mutations are blocked."
      }, { status: 423 });
    }

    // 2. CORE LOGIC GATE: Initiate Withdrawal Sequence
    if (action === 'INITIATE_WITHDRAWAL') {
      if (amount > mockDbVault.balance) {
        return NextResponse.json({ error: "INSUFFICIENT_VAULT_RESERVES" }, { status: 400 });
      }

      // Check if withdrawal size flags high-risk anomalous behavior
      const isHighRisk = amount >= (mockDbVault.balance * RISK_THRESHOLD_PERCENT);

      if (isHighRisk) {
        const executionTime = Date.now() + TIMELOCK_DURATION;
        const newTx = {
          txId: `tx_${Math.random().toString(36).substring(2, 9)}`,
          amount,
          recipient,
          executionTime,
          status: 'TIMELOCKED' as const
        };

        mockDbVault.pendingTransactions.push(newTx);

        console.log(`⚠️ [SECURITY ALERT] High-volume transaction ${newTx.txId} held in escrow. Timelock active until ${new Date(executionTime).toISOString()}`);

        return NextResponse.json({
          status: "TIMELOCK_ENGAGED",
          message: "High-volume withdrawal flagged. Transaction held in escrow for 24 hours. Guardian nodes notified.",
          txId: newTx.txId,
          unlocksAt: executionTime
        }, { status: 202 });
      }

      // Standard withdrawal behavior for low-volume transfers
      mockDbVault.balance -= amount;
      return NextResponse.json({
        status: "TRANSACTION_EXECUTED_IMMEDIATELY",
        remainingBalance: mockDbVault.balance
      }, { status: 200 });
    }

    // 3. ADJUDICATION GATE: Guardian Veto Overrides
    if (action === 'GUARDIAN_VETO') {
      // Find the malicious targeted transaction
      const txIndex = mockDbVault.pendingTransactions.findIndex(t => t.txId === txId && t.status === 'TIMELOCKED');

      if (txIndex === -1) {
        return NextResponse.json({ error: "PENDING_TRANSACTION_NOT_FOUND" }, { status: 404 });
      }

      // Update the transaction status and drop the secure quarantine envelope
      mockDbVault.pendingTransactions[txIndex].status = 'VETOED';
      mockDbVault.isQuarantined = true;

      console.error(`🛑 [CRITICAL INTERCEPT] Guardian Multi-Sig executed a VETO on transaction ${txId}. Vault has entered quarantine state.`);

      return NextResponse.json({
        status: "VAULT_SECURED",
        message: "Malicious transaction intercepted. Individual vault has been forced into quarantine mode to preserve assets."
      }, { status: 200 });
    }

    return NextResponse.json({ error: "INVALID_ACTION_PROTOCOL" }, { status: 400 });

  } catch (err) {
    return NextResponse.json({ error: "VAULT_HARD_WARE_FAULT" }, { status: 500 });
  }
}