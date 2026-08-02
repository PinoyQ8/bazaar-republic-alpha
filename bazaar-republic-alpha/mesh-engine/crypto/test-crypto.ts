// J:\Project-Bazaar\bazaar-republic\bazaar-republic-alpha\mesh-engine\crypto\test-crypto.ts

import { ethers, Wallet } from "ethers";
import { MeshChannelClient, ChannelState } from "./MeshChannelClient";

async function verifyMeshSignatures() {
  console.log("⚡ INITIATING MESH OFF-CHAIN SIGNATURE TEST...\n");

  // 1. Generate local memory wallets for Pioneer A and Pioneer B
  const pioneerA = new MeshChannelClient(Wallet.createRandom().privateKey);
  const pioneerB = new MeshChannelClient(Wallet.createRandom().privateKey);

  console.log(`[+] Pioneer A Node Address: ${pioneerA.address}`);
  console.log(`[+] Pioneer B Node Address: ${pioneerB.address}\n`);

  // 2. Mock a unique Layer-1 Channel ID
  const mockChannelId = ethers.keccak256(ethers.toUtf8Bytes("bazaar-alpha-channel-001"));

  // 3. Define the Off-Chain State (e.g., after a local service exchange)
  const state: ChannelState = {
    channelId: mockChannelId,
    nonce: 1,
    balanceA: ethers.parseEther("75"), // 75 Pi
    balanceB: ethers.parseEther("25"), // 25 Pi
  };

  console.log(`[+] State Constructed | Nonce: ${state.nonce} | Total Capacity: 100 Pi\n`);

  // 4. Both Pioneers sign the exact same state independently
  console.log("✍️ Pioneers Signing Off-Chain State...");
  const sigA = await pioneerA.signState(state);
  const sigB = await pioneerB.signState(state);

  console.log(`Signature A: ${sigA.substring(0, 20)}...`);
  console.log(`Signature B: ${sigB.substring(0, 20)}...\n`);

  // 5. The MESH Engine verifies the signatures mathematically
  console.log("🔍 Verifying Cryptographic Proofs...");
  const isAValid = MeshChannelClient.verifySignature(state, sigA, pioneerA.address);
  const isBValid = MeshChannelClient.verifySignature(state, sigB, pioneerB.address);

  console.log(`Pioneer A Verification: ${isAValid ? "VALID ✅" : "INVALID ❌"}`);
  console.log(`Pioneer B Verification: ${isBValid ? "VALID ✅" : "INVALID ❌"}`);

  if (isAValid && isBValid) {
    console.log("\n🚀 MESH CRYPTO ENGINE SECURE. L2 state channels are functional.");
  } else {
    console.log("\n⚠️ ERROR: Signature verification failed. Check logic.");
  }
}

// Execute
verifyMeshSignatures().catch(console.error);