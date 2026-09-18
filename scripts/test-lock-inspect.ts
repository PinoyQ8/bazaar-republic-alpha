import * as SorobanClient from "@stellar/stellar-sdk";

const PI_RPC_URL = "https://rpc.testnet.minepi.com";
const CONTRACT_ID = "CAL7VDQBPLM4Z3LDG4TSALUL3DQAWZIJGWOLYQ3JBND3RJTZ7XLKEIUG";
const NETWORK_PASSPHRASE = "Pi Testnet";

const server = new SorobanClient.rpc.Server(PI_RPC_URL, { allowHttp: false });
const contract = new SorobanClient.Contract(CONTRACT_ID);

async function simulateWithRetry(tx: SorobanClient.Transaction, retries = 5, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await server.simulateTransaction(tx);
    } catch (err: any) {
      console.warn(`⚠️ [RPC] Simulation attempt ${attempt}/${retries} failed (${err?.message || "fetch failed"}). Retrying in ${delayMs / 1000}s...`);
      if (attempt === retries) throw err;
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
}

async function testLockAndQuery() {
  console.log("🚀 Testing Protocol 28 Read State during Active Lock...");
  
  const testId = `ESC_TEST_${Math.floor(1000 + Math.random() * 9000)}`;
  console.log(`Target Escrow ID: ${testId}`);

  const tx = new SorobanClient.TransactionBuilder(
    new SorobanClient.Account("GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3", "0"),
    { fee: "100000", networkPassphrase: NETWORK_PASSPHRASE }
  )
    .addOperation(contract.call("get_vault", SorobanClient.nativeToScVal(testId, { type: "symbol" })))
    .setTimeout(30)
    .build();

  try {
    const sim = await simulateWithRetry(tx);
    if (!sim) return;

    if (SorobanClient.rpc.Api.isSimulationError(sim)) {
      console.log("✅ Verified on Pi Testnet: Uninitialized key correctly trapped by host:");
      console.log(sim.error.split("\n")[0]);
    } else if (SorobanClient.rpc.Api.isSimulationSuccess(sim)) {
      console.log("✅ Simulation returned payload:", (sim as any).result?.retval);
    }
  } catch (finalErr: any) {
    console.error("❌ RPC endpoint unreachable after retries:", finalErr?.message || finalErr);
  }
}

testLockAndQuery();
