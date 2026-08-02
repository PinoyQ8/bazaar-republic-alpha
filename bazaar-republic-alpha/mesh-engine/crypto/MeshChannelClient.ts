// J:\Project-Bazaar\bazaar-republic\bazaar-republic-alpha\mesh-engine\crypto\MeshChannelClient.ts

import { ethers, Wallet } from "ethers";

// Interface reflecting the state structure matching the Pi Layer-1 smart contract
export interface ChannelState {
  channelId: string;   // bytes32 hex string
  nonce: number;       // Monotonically increasing sequence number
  balanceA: bigint;    // Balance of Pioneer A in Wei/Atomic units
  balanceB: bigint;    // Balance of Pioneer B in Wei/Atomic units
}

export interface SignedState {
  state: ChannelState;
  sigA: string;        // Hex signature from Pioneer A
  sigB: string;        // Hex signature from Pioneer B
}

export class MeshChannelClient {
  private wallet: Wallet;

  constructor(privateKey: string) {
    // Initialize signer wallet with the Pioneer's private key
    this.wallet = new Wallet(privateKey);
  }

  /**
   * Returns the Ethereum/Pi L1 address of this node
   */
  public get address(): string {
    return this.wallet.address;
  }

  /**
   * Hash the state channel data strictly matching the Solidity keccak256 packed format
   */
  public hashState(state: ChannelState): string {
    return ethers.solidityPackedKeccak256(
      ["bytes32", "uint256", "uint256", "uint256"],
      [state.channelId, state.nonce, state.balanceA, state.balanceB]
    );
  }

  /**
   * Signs a state update using the EIP-191 standard
   */
  public async signState(state: ChannelState): Promise<string> {
    const messageHash = this.hashState(state);
    const messageHashBytes = ethers.getBytes(messageHash);
    return await this.wallet.signMessage(messageHashBytes);
  }

  /**
   * Verifies that a given signature belongs to a specific Pioneer address
   */
  public static verifySignature(
    state: ChannelState,
    signature: string,
    expectedSigner: string
  ): boolean {
    // Temporary dummy instance just to access the hash method securely
    const client = new MeshChannelClient("0x" + "1".repeat(64)); 
    const messageHash = client.hashState(state);
    const messageHashBytes = ethers.getBytes(messageHash);

    const recoveredAddress = ethers.verifyMessage(messageHashBytes, signature);
    return recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
  }
}