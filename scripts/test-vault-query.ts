import dotenv from "dotenv";
dotenv.config({ path: ".env.local", override: true });

import * as SorobanClient from "@stellar/stellar-sdk";

// Explicitly lock to Pi Testnet
const PI_RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL === "https://soroban-testnet.stellar.org" || !process.env.NEXT_PUBLIC_SOROBAN_RPC_URL
    ? "https://rpc.testnet.minepi.com"
    : process.env.NEXT_PUBLIC_SOROBAN_RPC_URL;

const CONTRACT_ID =
  process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID ||
  "CAL7VDQBPLM4Z3LDG4TSALUL3DQAWZIJGWOLYQ3JBND3RJTZ7XLKEIUG";

const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE === "Test SDF Network ; September 2015" || !process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE
    ? "Pi Testnet"
    : process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE;

const ESCROW_ID = process.argv[2] || "ESC_6447";

const bigIntReplacer = (_key: string, value: any) =>
  typeof value === "bigint" ? value.toString() : value;

async function query() {
  const server = new SorobanClient.rpc.Server(PI_RPC_URL, { allowHttp: false });
  const contract = new SorobanClient.Contract(CONTRACT_ID);

  console.log(`📡 Simulating get_vault("${ESCROW_ID}") strictly on Pi Testnet Protocol 28:`);
  console.log(`   RPC Endpoint : ${PI_RPC_URL}`);
  console.log(`   Contract ID  : ${CONTRACT_ID}`);
  console.log(`   Passphrase   : ${NETWORK_PASSPHRASE}\n`);

  // Query as Symbol (Canonical get_vault(Symbol) contract signature)
  try {
    const txSymbol = new SorobanClient.TransactionBuilder(
      new SorobanClient.Account("GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3", "0"),
      { fee: "100000", networkPassphrase: NETWORK_PASSPHRASE }
    )
      .addOperation(
        contract.call("get_vault", SorobanClient.nativeToScVal(ESCROW_ID, { type: "symbol" }))
      )
      .setTimeout(30)
      .build();

    const resSymbol = await server.simulateTransaction(txSymbol);

    if (SorobanClient.rpc.Api.isSimulationSuccess(resSymbol)) {
      const rawVal = SorobanClient.scValToNative(resSymbol.result!.retval);
      console.log("✅ ON-CHAIN Escrow Record Found (Symbol):");
      console.log(JSON.stringify(rawVal, bigIntReplacer, 2));
      return;
    } else {
      console.warn("⚠️ Symbol lookup simulation response:", resSymbol.error || (resSymbol as any).events);
    }
  } catch (e: any) {
    console.warn("⚠️ Symbol call failed:", e?.message || e);
  }

  // Fallback: Query as String
  try {
    const txString = new SorobanClient.TransactionBuilder(
      new SorobanClient.Account("GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3", "0"),
      { fee: "100000", networkPassphrase: NETWORK_PASSPHRASE }
    )
      .addOperation(
        contract.call("get_vault", SorobanClient.nativeToScVal(ESCROW_ID, { type: "string" }))
      )
      .setTimeout(30)
      .build();

    const resString = await server.simulateTransaction(txString);

    if (SorobanClient.rpc.Api.isSimulationSuccess(resString)) {
      const rawVal = SorobanClient.scValToNative(resString.result!.retval);
      console.log("✅ ON-CHAIN Escrow Record Found (String):");
      console.log(JSON.stringify(rawVal, bigIntReplacer, 2));
      return;
    } else {
      console.error("❌ String lookup simulation response:", resString.error || (resString as any).events);
    }
  } catch (e: any) {
    console.error("❌ String call failed:", e?.message || e);
  }

  console.log(`\nℹ️ Escrow "${ESCROW_ID}" was not found in persistent contract storage on Pi Testnet.`);
}

query().catch((err) => {
  console.error("Fatal query error:", err);
  process.exit(1);
});
