// Location: lib/blockchain.ts
import { rpc, Horizon, Address, xdr } from '@stellar/stellar-sdk';

// 📡 NETWORK PROTOCOL ROUTING (PI TESTNET EXCLUSIVE)
const PI_RPC_URL =
  process.env.NEXT_PUBLIC_PI_TESTNET_RPC ||
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
  'https://rpc.testnet.minepi.com';

const PI_HORIZON_URL =
  process.env.NEXT_PUBLIC_PI_HORIZON_URL ||
  'https://api.testnet.minepi.com';

// ⚓ SYSTEM CLIENT INITIALIZATION
export const sorobanServer = new rpc.Server(PI_RPC_URL, {
  allowHttp: PI_RPC_URL.startsWith('http://'),
});
export const horizonServer = new Horizon.Server(PI_HORIZON_URL, {
  allowHttp: PI_HORIZON_URL.startsWith('http://'),
});

// 🦀 PI TESTNET CONTRACT & TREASURY ANCHORS
export const MESH_CONTRACT_ID =
  process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID ||
  process.env.NEXT_PUBLIC_MESH_CONTRACT_ID ||
  'CBM5SVJHLHNAEUR4GA3IV5KZFPCCMGTZGMAJUNURUQIEFPTKZLKXQ3RY';

export const mBZR_TOKEN_WRAPPER_ID =
  process.env.NEXT_PUBLIC_PI_TOKEN_CONTRACT ||
  process.env.NEXT_PUBLIC_MBZR_TOKEN_CONTRACT ||
  'CDG6ZM2SHXIHD5HZ2E62B7D76RY5DUHDNQVPSHRVDNN7W4EW47FXLEXQ';

const TREASURY_KEY =
  process.env.PI_ADMIN_PUBLIC_KEY ||
  'GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3';

export interface AuditTelemetry {
  status: 'SECURE' | 'FRACTURE';
  mBZR_Token_Wrapped: string;
  mesh_Contract: string;
  balances: unknown[];
  message?: string;
}

function getPersistentDurability(): xdr.ContractDataDurability {
  const DurabilityCtor: any = xdr.ContractDataDurability;
  if (typeof DurabilityCtor?.persistent === 'function') {
    try {
      return DurabilityCtor.persistent();
    } catch {
      // Fall through to constructor/value checks
    }
  }
  if (DurabilityCtor?.persistent instanceof DurabilityCtor) {
    return DurabilityCtor.persistent;
  }
  if (typeof DurabilityCtor?.persistent === 'number') {
    return new DurabilityCtor(DurabilityCtor.persistent);
  }
  return new DurabilityCtor(1);
}

/**
 * Verifies live connection to Pi Testnet Horizon account and Soroban contract state.
 */
export async function checkBlockchainStatus(): Promise<AuditTelemetry> {
  try {
    const [accountData, _contractLedgerData] = await Promise.all([
      horizonServer.loadAccount(TREASURY_KEY),
      sorobanServer.getLedgerEntries(
        xdr.LedgerKey.contractData(
          new xdr.LedgerKeyContractData({
            contract: Address.fromString(MESH_CONTRACT_ID).toScAddress(),
            key: xdr.ScVal.scvSymbol('initialize'),
            durability: getPersistentDurability(),
          })
        )
      ),
    ]);

    void _contractLedgerData;

    return {
      status: 'SECURE',
      mBZR_Token_Wrapped: mBZR_TOKEN_WRAPPER_ID,
      mesh_Contract: MESH_CONTRACT_ID,
      balances: accountData.balances,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error);
    console.error('🚨 MESH_AUDIT_FRACTURE:', message);
    return {
      status: 'FRACTURE',
      mBZR_Token_Wrapped: mBZR_TOKEN_WRAPPER_ID,
      mesh_Contract: MESH_CONTRACT_ID,
      balances: [],
      message,
    };
  }
}