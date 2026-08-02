// J:\Project-Bazaar\bazaar-republic\bazaar-republic-alpha\mesh-engine\node\test-buffer.ts

import { ethers, Wallet } from "ethers";
import { MeshChannelClient, ChannelState, SignedState } from "../crypto/MeshChannelClient";
import { ChannelBuffer } from "./ChannelBuffer";

async function runBufferSimulation() {
  console.log("⚡ INITIATING MESH CHANNEL BUFFER STRESS TEST...\n");

  const buffer = new ChannelBuffer();

  // 1. Setup Identity Wallets
  const pioneerA = new MeshChannelClient(Wallet.createRandom().privateKey);
  const pioneerB = new MeshChannelClient(Wallet.createRandom().privateKey);

  const channelId = ethers.keccak256(ethers.toUtf8Bytes("bazaar-buffer-test-channel"));

  console.log(`[+] Channel ID Locked: ${channelId.substring(0, 18)}...`);
  console.log(`[+] Pioneer A: ${pioneerA.address}`);
  console.log(`[+] Pioneer B: ${pioneerB.address}\n`);

  // Helper function to build and sign a state
  async function createSignedState(nonce: number, balanceAVal: string, balanceBVal: string): Promise<SignedState> {
    const state: ChannelState = {
      channelId,
      nonce,
      balanceA: ethers.parseEther(balanceAVal),
      balanceB: ethers.parseEther(balanceBVal),
    };
    const sigA = await pioneerA.signState(state);
    const sigB = await pioneerB.signState(state);
    return { state, sigA, sigB };
  }

  // 2. Transmit Nonce 1 (Initial State)
  console.log("--- TEST 1: Registering Nonce 1 ---");
  const state1 = await createSignedState(1, "90", "10");
  const success1 = buffer.registerStateUpdate(state1, pioneerA.address, pioneerB.address);
  console.log(`Result: ${success1 ? "ACCEPTED ✅" : "REJECTED ❌"}\n`);

  // 3. Transmit Nonce 3 (Simulating skipped state / fast progression)
  console.log("--- TEST 2: Registering Nonce 3 ---");
  const state3 = await createSignedState(3, "80", "20");
  const success3 = buffer.registerStateUpdate(state3, pioneerA.address, pioneerB.address);
  console.log(`Result: ${success3 ? "ACCEPTED ✅" : "REJECTED ❌"}\n`);

  // 4. Transmit Nonce 2 (Malicious / Outdated replay attempt)
  console.log("--- TEST 3: Registering Outdated Nonce 2 (Replay Attack) ---");
  const state2 = await createSignedState(2, "85", "15");
  const success2 = buffer.registerStateUpdate(state2, pioneerA.address, pioneerB.address);
  console.log(`Result: ${success2 ? "ACCEPTED (Error) ❌" : "REJECTED CORRECTLY 🛡️"}\n`);

  // 5. Verify Final Ledger State
  console.log("--- LEDGER AUDIT ---");
  const latest = buffer.getLatestState(channelId);
  if (latest) {
    console.log(`[+] Buffer Holding Highest Nonce: ${latest.state.nonce}`);
    console.log(`[+] Current Balances -> A: ${ethers.formatEther(latest.state.balanceA)} Pi | B: ${ethers.formatEther(latest.state.balanceB)} Pi`);
  } else {
    console.log("[-] Error: Channel not found in buffer.");
  }

  console.log("\n🚀 MESH BUFFER SIMULATION COMPLETE.");
}

runBufferSimulation().catch(console.error);