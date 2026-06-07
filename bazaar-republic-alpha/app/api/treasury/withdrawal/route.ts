// app/api/treasury/withdrawal/route.ts
import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import PioneerLedger from '@/models/PioneerLedger';
import { executePiTransfer } from '@/lib/pi-sdk-bridge';

// 🛡️ BAZAAR TECH: Mutex Lock (Reentrancy Guard)
const lockedThreads = new Set<string>();

export async function POST(req: Request) {
  // Extract payload (If this is missing, 'pioneer_id' throws an error)
  const payload = await req.json();
  const pioneer_id = payload.pioneer_id;
  const amount = payload.amount;

  if (!pioneer_id || !amount) {
    return NextResponse.json({ status: 'LOGIC_BREACH', error: 'Malformed payload.' }, { status: 400 });
  }

  // 🛡️ REENTRANCY GUARD: Block recursive calls
  if (lockedThreads.has(pioneer_id)) {
    console.warn(`[ADJUDICATOR] Phantom Drain Intercepted for Node: ${pioneer_id}`);
    return NextResponse.json({ status: 'LOGIC_BREACH', error: 'Reentrancy attempt dropped.' }, { status: 422 });
  }
  
  // Lock the thread for this specific Pioneer
  lockedThreads.add(pioneer_id);

  try {
    // Handshake
    await connectToLedger();
    const pioneer = await PioneerLedger.findOne({ uid: pioneer_id });

    // 1. CHECKS
    if (!pioneer || pioneer.balance < amount) {
      throw new Error('Insufficient E-Network allocation.');
    }

    // 2. EFFECTS (Crucial: Update internal state FIRST)
    pioneer.balance -= amount;
    await pioneer.save();

    // 3. INTERACTIONS (External Pi Network transfer)
    const txStatus = await executePiTransfer(pioneer_id, amount);
    
    if (!txStatus.success) {
      // Rollback only if the external transfer genuinely fails
      pioneer.balance += amount;
      await pioneer.save();
      throw new Error('Pi Network bridge failed.');
    }

    // Finality
    return NextResponse.json({ status: 'SYNCED', balance: pioneer.balance }, { status: 200 });

  } catch (error: any) {
    // 🛡️ TYPE-SAFE CATCH
    const errorMessage = error instanceof Error ? error.message : 'Unknown bridge failure';
    console.error(`[ADJUDICATOR] Treasury TX Failed: ${errorMessage}`);
    
    return NextResponse.json({ status: 'TX_FAILED', error: errorMessage }, { status: 500 });
    
  } finally {
    // 🛡️ RELEASE THE LOCK: Ensures the user can transact again later
    lockedThreads.delete(pioneer_id);
  }
}