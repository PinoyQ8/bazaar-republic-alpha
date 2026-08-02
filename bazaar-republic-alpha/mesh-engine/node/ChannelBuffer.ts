// J:\Project-Bazaar\bazaar-republic\bazaar-republic-alpha\mesh-engine\node\ChannelBuffer.ts

import { ChannelState, SignedState, MeshChannelClient } from "../crypto/MeshChannelClient";

export class ChannelBuffer {
  // Local Map acting as the off-chain ledger. 
  // Key: Channel ID | Value: The absolute latest Signed State
  private activeChannels: Map<string, SignedState> = new Map();

  /**
   * Processes an incoming state update from the E-Network.
   * Rejects outdated nonces and mathematically verifies both signatures.
   */
  public registerStateUpdate(
    newState: SignedState, 
    pioneerA_Address: string, 
    pioneerB_Address: string
  ): boolean {
    const channelId = newState.state.channelId;
    const currentRecord = this.activeChannels.get(channelId);

    // 1. Nonce Protection: The new state must have a higher sequence number
    if (currentRecord && newState.state.nonce <= currentRecord.state.nonce) {
      console.warn(`[MESH] Rejecting update for ${channelId}: Nonce ${newState.state.nonce} is outdated.`);
      return false;
    }

    // 2. Cryptographic Verification: Ensure neither party tampered with the balances
    const isAValid = MeshChannelClient.verifySignature(newState.state, newState.sigA, pioneerA_Address);
    const isBValid = MeshChannelClient.verifySignature(newState.state, newState.sigB, pioneerB_Address);

    if (!isAValid || !isBValid) {
      console.error(`[MESH] CRITICAL: Invalid signature detected on state update for ${channelId}.`);
      return false;
    }

    // 3. Commit to Local Buffer
    this.activeChannels.set(channelId, newState);
    console.log(`[MESH] Channel ${channelId} updated successfully to Nonce ${newState.state.nonce}.`);
    return true;
  }

  /**
   * Retrieves the latest valid state payload ready for L1 mainnet settlement or Watchtower defense.
   */
  public getLatestState(channelId: string): SignedState | undefined {
    return this.activeChannels.get(channelId);
  }

  /**
   * Purges a channel from local memory after it has been finalized on the Pi L1 Mainnet.
   */
  public flushChannel(channelId: string): void {
    this.activeChannels.delete(channelId);
    console.log(`[MESH] Channel ${channelId} flushed from local buffer.`);
  }
}