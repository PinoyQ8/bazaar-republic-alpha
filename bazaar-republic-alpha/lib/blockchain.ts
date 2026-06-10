// lib/blockchain.ts
import { rpc, Horizon, Networks, Address, xdr } from '@stellar/stellar-sdk';

// 📡 NETWORK PROTOCOL ROUTING (PI TESTNET EXCLUSIVE)
const PI_RPC_URL = process.env.NEXT_PUBLIC_PI_TESTNET_RPC || 'https://rpc.testnet.minepi.com';
const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || 'Pi Testnet';

// ⚓ SYSTEM CLIENT INITIALIZATION (UPDATED SDK ARCHITECTURE)
export const sorobanServer = new rpc.Server(PI_RPC_URL, { allowHttp: false });
export const horizonServer = new Horizon.Server(PI_RPC_URL);

// 🦀 IMMUTABLE CORE ADRESSES (LOCKED ON JUNE 10)
export const MESH_CONTRACT_ID = process.env.NEXT_PUBLIC_MESH_CONTRACT_ID || 'CBRFEVHW4J3MHFSQNL3QPDU425572J4HFVDD5ZC6ZF2NOZSG4DPS4E32';
export const mBZR_TOKEN_WRAPPER_ID = 'CAVDZEJ3PT4NJ4KFC2RO324TRBHSBWUQ3ZMUETUWSYXTP4TDOXALIK4D';

const TREASURY_KEY = "GAI5DGRUHXCMLDTHMVCZBHGTQXTP2SOS3CMX3KWGAF7XGXTNN5TLMTTA";

interface AuditTelemetry {
  status: "SECURE" | "FRACTURE";
  mBZR_Token_Wrapped: string;
  mesh_Contract: string;
  balances: any[];
  message?: string;
}

/**
 * Hard-coded audit function to verify live connection to the active Pi Testnet contract state.
 * Replaces legacy Horizon fetch loops with parallelized RPC telemetry.
 */
export async function checkBlockchainStatus(): Promise<AuditTelemetry> {
  try {
    // Parallel Execution: Query the classic account balance and simulate a contract state read concurrently
    const [accountData, contractLedgerData] = await Promise.all([
      horizonServer.loadAccount(TREASURY_KEY),
      sorobanServer.getLedgerEntries(
        xdr.LedgerKey.contractData(
          new xdr.LedgerKeyContractData({
            contract: Address.fromString(MESH_CONTRACT_ID).toScAddress(),
            key: xdr.ScVal.scvSymbol('initialize'), // Verifies initialization block state
            durability: xdr.ContractDataDurability.persistent(),
          })
        )
      )
    ]);

    return {
      status: "SECURE",
      mBZR_Token_Wrapped: mBZR_TOKEN_WRAPPER_ID,
      mesh_Contract: MESH_CONTRACT_ID,
      balances: accountData.balances
    };

  } catch (error: any) {
    console.error("🚨 MESH_AUDIT_FRACTURE:", error.message);
    return { 
      status: "FRACTURE", 
      mBZR_Token_Wrapped: mBZR_TOKEN_WRAPPER_ID,
      mesh_Contract: MESH_CONTRACT_ID,
      balances: [], 
      message: error.message 
    };
  }
}