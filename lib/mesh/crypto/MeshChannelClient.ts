// Location: lib/mesh/crypto/MeshChannelClient.ts
import { ethers, Wallet } from "ethers";

export interface ChannelState {
  channelId: string;   // 32-byte hex or string identifier
  nonce: number;       // Monotonically increasing sequence number
  balanceA: bigint;    // Balance of Pioneer A in atomic units / stroops
  balanceB: bigint;    // Balance of Pioneer B in atomic units / stroops
}

export interface SignedState {
  state: ChannelState;
  sigA: string;        // Hex signature from Pioneer A
  sigB: string;        // Hex signature from Pioneer B
}

export class MeshChannelClient {
  private wallet: Wallet;

  constructor(privateKey: string) {
    this.wallet = new Wallet(privateKey);
  }

  public get address(): string {
    return this.wallet.address;
  }

  /**
   * Normalizes a channel ID into a strict 32-byte hex format.
   * If it's already a 66-character 0x-prefixed hex string, returns it as-is.
   * Otherwise, hashes the string via keccak256.
   */
  public static normalizeChannelId(channelId: string): string {
    if (channelId.startsWith("0x") && channelId.length === 66) {
      return channelId;
    }
    return ethers.id(channelId);
  }

  /**
   * Hash the state channel data strictly matching the packed format
   */
  public hashState(state: ChannelState): string {
    return MeshChannelClient.hashState(state);
  }

  public static hashState(state: ChannelState): string {
    const formattedChannelId = MeshChannelClient.normalizeChannelId(state.channelId);
    return ethers.solidityPackedKeccak256(
      ["bytes32", "uint256", "uint256", "uint256"],
      [formattedChannelId, state.nonce, state.balanceA, state.balanceB]
    );
  }

  /**
   * Signs a state update using EIP-191
   */
  public async signState(state: ChannelState): Promise<string> {
    const messageHash = MeshChannelClient.hashState(state);
    const messageHashBytes = ethers.getBytes(messageHash);
    return await this.wallet.signMessage(messageHashBytes);
  }

  /**
   * Cryptographically verifies whether a signature matches a Pioneer's address
   */
  public static verifySignature(
    state: ChannelState,
    signature: string,
    expectedSigner: string
  ): boolean {
    try {
      if (!signature || signature.length < 10) return false;
      const messageHash = MeshChannelClient.hashState(state);
      const messageHashBytes = ethers.getBytes(messageHash);
      const recoveredSigner = ethers.verifyMessage(messageHashBytes, signature);
      return recoveredSigner.toLowerCase() === expectedSigner.toLowerCase();
    } catch {
      return false;
    }
  }
}
