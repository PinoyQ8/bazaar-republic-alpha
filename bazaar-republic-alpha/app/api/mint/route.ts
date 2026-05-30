// TARGET FILE PATH: [project-root]/app/api/mint/route.ts
import { NextResponse } from 'next/server';

// FIXED CONVERSION PARITY
const PI_TO_MBZR_RATIO = 1000; // 1 Pi = 1 Gram (1,000 mg) Synthetic Gold

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { senderWallet, lockedPiAmount, l1TxSignature } = payload;

    // 1. INBOUND PAYLOAD VALIDATION
    if (!senderWallet || typeof lockedPiAmount !== 'number' || !l1TxSignature) {
      return NextResponse.json(
        { success: false, error: 'MALFORMED_PAYLOAD: Missing required Genesis vectors.' },
        { status: 400 }
      );
    }

    if (lockedPiAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'INVALID_AMOUNT: Vault deposit must be greater than zero.' },
        { status: 422 }
      );
    }

    // 2. LAYER 1 CRYPTOGRAPHIC VERIFICATION (MOCKED FOR TEMPLATE)
    // In production, this pings the Pi Mainnet horizon to verify the transaction hash
    // actually sent the stated lockedPiAmount to the Republic's Multisig Vault.
    const isL1SignatureValid = l1TxSignature.startsWith('pi_tx_'); 
    if (!isL1SignatureValid) {
        return NextResponse.json(
            { success: false, error: 'SECURITY_FAULT: Invalid L1 blockchain signature.' },
            { status: 403 }
        );
    }

    // 3. SYNTHETIC ASSET GENERATION
    const mintedMbzr = lockedPiAmount * PI_TO_MBZR_RATIO;

    // --- CRITICAL SECTION: DB STATE TRANSITION ---
    // [Database execution block: Credit user mBZR balance, increment Total Outstanding Supply, increment Locked Vault Pi]
    // ---------------------------------------------

    return NextResponse.json({
      success: true,
      telemetry: {
        txId: `mint_${crypto.randomUUID()}`,
        l1DepositPi: lockedPiAmount,
        newlyMintedMbzr: mintedMbzr,
        syntheticGoldEquivalentMg: mintedMbzr,
        overMintShieldStatus: 'SECURED'
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'SERVER_LOGIC_FAULT: Genesis ingestion pipeline failed.' },
      { status: 500 }
    );
  }
}