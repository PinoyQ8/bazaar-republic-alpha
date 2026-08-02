// J:\Project-Bazaar\bazaar-republic\bazaar-republic-alpha\app\api\mesh\state\route.ts

import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { ChannelBuffer } from "../../../../mesh-engine/node/ChannelBuffer";
import { SignedState } from "../../../../mesh-engine/crypto/MeshChannelClient";

// Global singleton instance for the local node's active memory ledger
const globalBuffer = new ChannelBuffer();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { signedState, pioneerA_Address, pioneerB_Address } = body as {
      signedState: SignedState;
      pioneerA_Address: string;
      pioneerB_Address: string;
    };

    if (!signedState || !pioneerA_Address || !pioneerB_Address) {
      return NextResponse.json(
        { success: false, error: "Invalid payload structure. Missing state or addresses." },
        { status: 400 }
      );
    }

    const normalizedState: SignedState = {
      state: {
        channelId: signedState.state.channelId,
        nonce: Number(signedState.state.nonce),
        balanceA: BigInt(signedState.state.balanceA),
        balanceB: BigInt(signedState.state.balanceB),
      },
      sigA: signedState.sigA,
      sigB: signedState.sigB,
    };

    const accepted = globalBuffer.registerStateUpdate(
      normalizedState,
      pioneerA_Address,
      pioneerB_Address
    );

    if (!accepted) {
      return NextResponse.json(
        { success: false, error: "State update rejected: Outdated nonce or invalid cryptographic proof." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Channel state updated successfully to Nonce ${normalizedState.state.nonce}`,
      channelId: normalizedState.state.channelId,
    });

  } catch (err: any) {
    console.error("[MESH API ERROR]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error during state synchronization." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get("channelId");

  if (!channelId) {
    return NextResponse.json({ success: false, error: "Missing channelId parameter." }, { status: 400 });
  }

  const latestState = globalBuffer.getLatestState(channelId);

  if (!latestState) {
    return NextResponse.json({ success: false, error: "Channel not found in active local buffer." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    channelId,
    nonce: latestState.state.nonce,
    balanceA: latestState.state.balanceA.toString(),
    balanceB: latestState.state.balanceB.toString(),
    sigA: latestState.sigA,
    sigB: latestState.sigB,
  });
}