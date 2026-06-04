import { NextResponse } from 'next/server';

// Hard-coded Vault Tiers
const VAULT_TIERS = {
  FOUNDER: { multiplier: 1.50, min: 0, max: 1000 },
  SECURITY_CIRCLE: { multiplier: 1.35, min: 0, max: 1000 },
  GENESIS_GROUP: { multiplier: 1.25, min: 100, max: 1000 },
  MERCHANT: { multiplier: 1.15, min: 100, max: 500 },
  CITIZEN: { multiplier: 1.00, min: 10, max: 100 }
};

const GENESIS_HARD_CAP = 1000;
let CURRENT_POOL_TOTAL = 0; // In production, this pulls from MongoDB Atlas

export async function POST(request: Request) {
  try {
    const { role, stakedPi, userTrustScore } = await request.json();
    const tier = VAULT_TIERS[role as keyof typeof VAULT_TIERS];

    if (!tier) {
      return NextResponse.json({ error: 'MESH ERROR: Invalid Pioneer Role.' }, { status: 400 });
    }

    // Gate 1: Check Genesis Hard Cap
    if (CURRENT_POOL_TOTAL + stakedPi > GENESIS_HARD_CAP) {
      return NextResponse.json({ error: 'MESH ALERT: Genesis Hard Cap Exceeded.' }, { status: 403 });
    }

    // Gate 2: Check Tier Boundaries
    if (stakedPi < tier.min || stakedPi > tier.max) {
      return NextResponse.json({ error: `MESH ALERT: Stake outside tier limits (${tier.min} - ${tier.max} Pi).` }, { status: 403 });
    }

    // Gate 3: TrustScore Freeze Check
    if (userTrustScore === 0) {
      return NextResponse.json({ error: 'MESH ALERT: Node frozen. TS at absolute zero.' }, { status: 403 });
    }

    // Calculate Final BZR Vault Weight
    const tsModifier = userTrustScore / 100;
    const bzrWeight = stakedPi * tier.multiplier * tsModifier;

    return NextResponse.json({
      success: true,
      vaultReceipt: {
        roleApplied: role,
        piLocked: stakedPi,
        tsModifierApplied: `${tsModifier * 100}%`,
        finalBzrWeight: Number(bzrWeight.toFixed(2))
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: `Staking core failure: ${error.message}` }, { status: 500 });
  }
}