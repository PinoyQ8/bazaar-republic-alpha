import { NextRequest, NextResponse } from "next/server";
import { ChannelBuffer } from "@/lib/mesh/node/ChannelBuffer";
import { SignedState } from "@/lib/mesh/crypto/MeshChannelClient";
import { prepareReleaseFundsTx, prepareDisputeEscrowTx, fetchVaultEscrow } from "@/lib/mesh/vault";

// Global singleton instance for the local node's active memory ledger
const globalBuffer = new ChannelBuffer();

/**
 * GET: Query the latest signed state from the local channel buffer or on-chain escrow
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");

    if (!channelId) {
      return NextResponse.json(
        { success: false, error: "Missing required query parameter: channelId" },
        { status: 400 }
      );
    }

    const bufferedState = globalBuffer.getLatestState(channelId);
    const onChainEscrow = await fetchVaultEscrow(channelId);

    return NextResponse.json({
      success: true,
      channelId,
      bufferedState: bufferedState
        ? {
            channelId: bufferedState.state.channelId,
            nonce: bufferedState.state.nonce,
            balanceA: bufferedState.state.balanceA.toString(),
            balanceB: bufferedState.state.balanceB.toString(),
            sigA: bufferedState.sigA,
            sigB: bufferedState.sigB,
          }
        : null,
      onChainEscrow: onChainEscrow || null,
    });
  } catch (err: any) {
    console.error("[MESH API GET ERROR]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve channel state." },
      { status: 500 }
    );
  }
}

/**
 * POST: Process off-chain state updates OR assemble on-chain settlement transactions
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = "update", signedState, pioneerA_Address, pioneerB_Address, channelId, caller } = body;

    // --- Action: Settle / Close Channel on Soroban ---
    if (action === "settle") {
      const targetChannelId = channelId || signedState?.state?.channelId;
      const consumer = caller || pioneerA_Address;

      if (!targetChannelId || !consumer) {
        return NextResponse.json(
          { success: false, error: "Settlement requires targetChannelId and consumer address." },
          { status: 400 }
        );
      }

      const tx = await prepareReleaseFundsTx(targetChannelId, consumer);
      return NextResponse.json({
        success: true,
        action: "settle",
        channelId: targetChannelId,
        assembledTx: tx.toJSON ? tx.toJSON() : null,
      });
    }

    // --- Action: Dispute Escrow on Soroban ---
    if (action === "dispute") {
      const targetChannelId = channelId || signedState?.state?.channelId;
      const disputeCaller = caller || pioneerA_Address;

      if (!targetChannelId || !disputeCaller) {
        return NextResponse.json(
          { success: false, error: "Dispute requires targetChannelId and disputeCaller address." },
          { status: 400 }
        );
      }

      const tx = await prepareDisputeEscrowTx(targetChannelId, disputeCaller);
      return NextResponse.json({
        success: true,
        action: "dispute",
        channelId: targetChannelId,
        assembledTx: tx.toJSON ? tx.toJSON() : null,
      });
    }

    // --- Action: Default Off-chain State Update ---
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
