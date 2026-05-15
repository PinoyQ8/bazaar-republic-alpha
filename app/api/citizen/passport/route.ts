import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/mesh-prisma';
import { calculateTrustScore, calculateGovernanceWeight } from '@/lib/mesh/trust-logic';

export async function GET(request: NextRequest) {
  try {
    // 1. EXTRACT THE UID FROM THE SEARCH PARAMS (Fixes "Cannot find name 'uid'")
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: "MESH Error: UID is required." }, { status: 400 });
    }

    // 2. FETCH THE PASSPORT (Fixes "citizenPassport does not exist")
    let passport = await prisma.citizenPassport.findUnique({
      where: { pioneerUid: uid },
    });

    // 3. AUTO-FORGE IF MISSING (Identity Persistence)
    if (!passport) {
      passport = await prisma.citizenPassport.create({
        data: {
          pioneerUid: uid,
          stakedPi: 0,
          successfulTx: 0,
          disputedTx: 0,
        },
      });
    }

    // 4. CALCULATE DYNAMIC METRICS
    const trustScore = calculateTrustScore(passport.successfulTx, passport.disputedTx);
    const mBZRWeight = calculateGovernanceWeight(passport.stakedPi);

    return NextResponse.json({
      success: true,
      passport: {
        ...passport,
        trustScore,
        mBZRWeight,
      },
    });

  } catch (error) {
    console.error("ADJUDICATOR ALERT: Passport Sector Failure", error);
    return NextResponse.json({ error: "Internal MESH Fracture" }, { status: 500 });
  }
}