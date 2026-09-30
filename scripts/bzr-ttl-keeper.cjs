const { execSync } = require("child_process");

const CONTRACT_ID = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID || "CBM5SVJHLHNAEUR4GA3IV5KZFPCCMGTZGMAJUNURUQIEFPTKZLKXQ3RY";
const RPC_URL = process.env.STELLAR_RPC_URL || "https://rpc.testnet.minepi.com";
const NETWORK_PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE || "Pi Testnet";
const KEY_NAME = "s23-deployer";
const EXTEND_HORIZON_LEDGERS = 500000; // ~28 days of runway
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // Run hourly

console.log("🛡️ [BZR-TTL-KEEPER] Initializing Sentinel Daemon...");
console.log(`• Monitored Contract : ${CONTRACT_ID}`);
console.log(`• RPC Target         : ${RPC_URL}`);
console.log(`• Target Passphrase  : ${NETWORK_PASSPHRASE}`);

async function extendFootprint() {
  try {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] 🔄 Probing contract footprint & extending TTL...`);

    const cmd = `stellar contract extend --id ${CONTRACT_ID} --ledgers-to-extend ${EXTEND_HORIZON_LEDGERS} --source-account ${KEY_NAME} --rpc-url "${RPC_URL}" --network-passphrase "${NETWORK_PASSPHRASE}" --inclusion-fee 10000000`;
    
    const output = execSync(cmd, { encoding: "utf8" });
    console.log(`✅ [TTL-SUCCESS] Extension confirmed on-chain:\n${output.trim()}`);
  } catch (err) {
    // If the TTL is already near maximum runway, Soroban simulation will exit cleanly
    const msg = err.stdout || err.stderr || err.message;
    if (msg.includes("within safe operational limits") || msg.includes("already")) {
      console.log("ℹ️ [TTL-HEALTHY] Footprint is already at maximum ledger threshold.");
    } else {
      console.warn("⚠️ [TTL-WARN] Contract extend response:", msg.trim());
    }
  }
}

// Initial cycle
extendFootprint();

// Recurring timer
setInterval(extendFootprint, CHECK_INTERVAL_MS);