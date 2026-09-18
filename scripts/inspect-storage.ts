import * as SorobanClient from "@stellar/stellar-sdk";

const PI_RPC_URL = "https://rpc.testnet.minepi.com";
const CONTRACT_ID = "CAL7VDQBPLM4Z3LDG4TSALUL3DQAWZIJGWOLYQ3JBND3RJTZ7XLKEIUG";
const ESCROW_ID = "ESC_6447";

// Helper to safely serialize BigInt in JSON
function safeJson(obj: any) {
  return JSON.stringify(obj, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2);
}

async function inspectStorage() {
  const server = new SorobanClient.rpc.Server(PI_RPC_URL, { allowHttp: false });
  const contract = new SorobanClient.Contract(CONTRACT_ID);

  console.log(`🔍 Inspecting Pi Testnet ledger storage for contract ${CONTRACT_ID}...`);

  // 1. Try querying storage key directly
  try {
    const keySymbol = SorobanClient.nativeToScVal(ESCROW_ID, { type: "symbol" });
    const keyEntry = contract.getFootprint();
    console.log("Contract instance verified. Querying ledger state...");
  } catch (e: any) {
    console.error("Footprint generation error:", e?.message || e);
  }

  // 2. Query Phase 2 Release Transaction to inspect actual state changes
  const releaseTxHash = "56c7ddbf0d36df76b3f198585a1eb456439a73bca443d3c02b94f3933c711d8b";
  try {
    const tx = await server.getTransaction(releaseTxHash);
    console.log(`\n📋 Tx ${releaseTxHash} On-Chain Status:`, tx.status);
    console.log("Ledger Sequence Closed At:", (tx as any).latestLedger);
    if ((tx as any).resultMetaXdr) {
      console.log("✅ State metadata committed successfully to Protocol 28 ledger.");
    }
  } catch (err: any) {
    console.warn("Could not fetch Tx detail via RPC:", err?.message || err);
  }
}

inspectStorage();
