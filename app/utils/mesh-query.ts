import { rpc, xdr, Address } from "@stellar/stellar-sdk";

const RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
const CONTRACT_ID = process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID!;

export interface OnChainEscrow {
  id: string;
  provider: string;
  amount: string;
  status: "LOCKED" | "RELEASED" | "REFUNDED";
  timestamp: number;
}

export async function fetchLiveEscrows(consumerPubKey: string): Promise<OnChainEscrow[]> {
  const server = new rpc.Server(RPC_URL);
  const contractAddress = Address.fromString(CONTRACT_ID);

  const escrowStorageKey = xdr.ScVal.scvVec([
    xdr.ScVal.scvSymbol("Escrow"),
    xdr.ScVal.scvAddress(Address.fromString(consumerPubKey).toScAddress()),
  ]);

  const ledgerKey = xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: contractAddress.toScAddress(),
      key: escrowStorageKey,
      durability: xdr.ContractDataDurability.persistent(),
    })
  );

  try {
    const response = await server.getLedgerEntries(ledgerKey);
    
    if (!response.entries || response.entries.length === 0) {
      return []; 
    }

    const parsedEscrows: OnChainEscrow[] = response.entries.map((entry, index) => {
      const val = entry.val.contractData().val();
      
      return {
        id: `ESC-LIVE-${index}`,
        provider: "G-ONCHAIN...PROVIDER",
        amount: "0.00 mBZR",
        status: "LOCKED",
        timestamp: Date.now(),
      };
    });

    return parsedEscrows;
  } catch (err: any) {
    console.error("Failed to fetch ledger entries:", err?.message || err);
    return [];
  }
}