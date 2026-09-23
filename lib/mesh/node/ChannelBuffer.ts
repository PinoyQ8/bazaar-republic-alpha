// Location: lib/mesh/node/ChannelBuffer.ts
import { ChannelState, SignedState, MeshChannelClient } from "../crypto/MeshChannelClient";
import { FraudProof, InfractionType } from "../trust-logic";

export class ChannelBuffer {
  // Key: Channel ID | Value: The absolute latest Signed State
  private activeChannels: Map<string, SignedState> = new Map();

  // Watchtower Incident Log (Off-chain dispute evidence)
  private fraudIncidents: Map<string, FraudProof[]> = new Map();

  /**
   * Processes an incoming state update from the E-Network.
   * Rejects outdated nonces and verifies signatures.
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
      console.warn(`[MESH:WATCHTOWER] Rejecting update for ${channelId}: Nonce ${newState.state.nonce} is outdated.`);
      
      this.recordFraudIncident({
        channelId,
        offendingParty: pioneerA_Address,
        infraction: "OUTDATED_NONCE",
        submittedNonce: newState.state.nonce,
        canonicalNonce: currentRecord.state.nonce,
        timestamp: Date.now(),
      });
      return false;
    }

    // 2. Cryptographic Verification: Ensure neither party tampered with balances
    const isAValid = MeshChannelClient.verifySignature(newState.state, newState.sigA, pioneerA_Address);
    const isBValid = MeshChannelClient.verifySignature(newState.state, newState.sigB, pioneerB_Address);

    if (!isAValid || !isBValid) {
      const offendingParty = !isAValid ? pioneerA_Address : pioneerB_Address;
      console.error(`[MESH:WATCHTOWER] CRITICAL: Invalid signature detected on state update for ${channelId}.`);

      this.recordFraudIncident({
        channelId,
        offendingParty,
        infraction: "INVALID_SIGNATURE",
        submittedNonce: newState.state.nonce,
        canonicalNonce: currentRecord ? currentRecord.state.nonce : 0,
        timestamp: Date.now(),
      });
      return false;
    }

    // 3. Commit to Local Buffer
    this.activeChannels.set(channelId, newState);
    console.log(`[MESH] Channel ${channelId} updated successfully to Nonce ${newState.state.nonce}.`);
    return true;
  }

  /**
   * Records a detected violation in the Watchtower ledger
   */
  private recordFraudIncident(proof: FraudProof): void {
    const existing = this.fraudIncidents.get(proof.channelId) || [];
    existing.push(proof);
    this.fraudIncidents.set(proof.channelId, existing);
  }

  /**
   * Retrieves all recorded fraud incidents for a channel
   */
  public getFraudIncidents(channelId: string): FraudProof[] {
    return this.fraudIncidents.get(channelId) || [];
  }

  /**
   * Retrieves the latest valid state payload ready for L1 settlement or dispute
   */
  public getLatestState(channelId: string): SignedState | undefined {
    return this.activeChannels.get(channelId);
  }

  /**
   * Purges a channel from local memory after it has been finalized on L1
   */
  public flushChannel(channelId: string): void {
    this.activeChannels.delete(channelId);
    this.fraudIncidents.delete(channelId);
    console.log(`[MESH] Channel ${channelId} flushed from local buffer.`);
  }
}
