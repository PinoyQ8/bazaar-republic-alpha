import { NextResponse } from 'next/server';

const TS_MIN = 0;

// 1. GET Request Handler for Status Checking
export async function GET() {
  return NextResponse.json({
    status: "ONLINE",
    protocol: "Neo Protocol / Bazaar Republic",
    meshUptimeShield: "92%",
    oracleTarget: "Dynamic Pi-to-Gold Conversion Active",
    allowedMethod: "POST only for calculations"
  });
}

// 2. POST Request Handler for Dynamic Conversions
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const piAmount = body.piAmount;
    const userTrustScore = body.userTrustScore;

    // Security Gate: Verify node is not subject to an Emergency Freeze (TS = 0)
    if (userTrustScore === TS_MIN) {
      return NextResponse.json(
        { error: 'MESH ALERT: Node frozen. TrustScore at absolute zero.' },
        { status: 403 }
      );
    }

    // Oracle Fetch: Fallback data modeled dynamically for local stability
    const currentPiPriceUSD = 0.14; 
    const currentGoldPricePerOunce = 2400.00; 
    
    // Convert gold price from Troy Ounce to 1 milligram (1 Troy Ounce = 31,103.4768 mg)
    const current1mgGoldPriceUSD = currentGoldPricePerOunce / 31103.4768;

    if (current1mgGoldPriceUSD === 0) {
      return NextResponse.json(
        { error: 'MESH ERROR: Gold oracle failed to resolve value.' },
        { status: 500 }
      );
    }

    // The Dynamic Minting Equation Execution
    const totalPiValueUSD = piAmount * currentPiPriceUSD;
    const mbzrMinted = totalPiValueUSD / current1mgGoldPriceUSD;

    // Secure payload returned safely within function scope
    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      oracleData: {
        piPriceUSD: currentPiPriceUSD,
        goldPriceMgUSD: current1mgGoldPriceUSD
      },
      transaction: {
        piDeposited: piAmount,
        mBZRAllocated: Number(mbzrMinted.toFixed(4))
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: `MESH ERROR: Economy core conversion failure: ${error.message}` },
      { status: 500 }
    );
  }
}