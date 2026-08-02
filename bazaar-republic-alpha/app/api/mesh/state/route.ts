// J:\Project-Bazaar\bazaar-republic\bazaar-republic-alpha\app\api\mesh\state\route.ts

import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { ChannelBuffer } from "@/mesh-engine/node/ChannelBuffer";
import { SignedState } from "@/mesh-engine/crypto/MeshChannelClient";

// Global singleton instance for the local node's active memory ledger
// In a persistent production node, this maps to a localized caching layer or state store.
const globalBuffer = new ChannelBuffer();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { signedState, pioneerA_Address, pioneerB_Address } = body as {
      signedState: SignedState;
      pioneerA_Address: string;
      pioneerB_Address: string;
    };

    // 1. Validate payload structure
    if (!signedState || !pioneerA_Address || !pioneerB_Address) {
      return NextResponse.json(
        { success: false, error: "Invalid payload structure. Missing state or addresses." },
        { status: 400 }
      );
    }

    // Rehydrate BigInt/ethers deserialization values if passed via JSON
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

    // 2. Process through the ChannelBuffer defense matrix
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

    // 3. Acknowledge synchronization success back to the E-Network
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

  // Serialize BigInt safely for JSON transport
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