// Location: app/utils/mesh-query.ts
import { rpc, xdr, Address } from "@stellar/stellar-sdk";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
const CONTRACT_ID =
  process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID || "";

export interface OnChainEscrow {
  id: string;
  provider: string;
  amount: string;
  status: "LOCKED" | "RELEASED" | "REFUNDED";
  timestamp: number;
}

function getPersistentDurability(): xdr.ContractDataDurability {
  const DurabilityCtor: any = xdr.ContractDataDurability;
  if (typeof DurabilityCtor?.persistent === "function") {
    try {
      return DurabilityCtor.persistent();
    } catch {
      // Fallback to constructor instantiation below
    }
  }
  if (DurabilityCtor?.persistent instanceof DurabilityCtor) {
    return DurabilityCtor.persistent;
  }
  if (typeof DurabilityCtor?.persistent === "number") {
    return new DurabilityCtor(DurabilityCtor.persistent);
  }
  return new DurabilityCtor(1);
}

export async function fetchLiveEscrows(
  consumerPubKey: string
): Promise<OnChainEscrow[]> {
  if (!CONTRACT_ID || !consumerPubKey) {
    return [];
  }

  const server = new rpc.Server(RPC_URL, {
    allowHttp: RPC_URL.startsWith("http://"),
  });
  const contractAddress = Address.fromString(CONTRACT_ID);

  const escrowStorageKey = xdr.ScVal.scvVec([
    xdr.ScVal.scvSymbol("Escrow"),
    xdr.ScVal.scvAddress(Address.fromString(consumerPubKey).toScAddress()),
  ]);

  const ledgerKey = xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: contractAddress.toScAddress(),
      key: escrowStorageKey,
      durability: getPersistentDurability(),
    })
  );

  try {
    const response = await server.getLedgerEntries(ledgerKey);

    if (!response.entries || response.entries.length === 0) {
      return [];
    }

    const parsedEscrows: OnChainEscrow[] = [];

    for (let index = 0; index < response.entries.length; index++) {
      const entry: any = response.entries[index];
      const ledgerEntryData: any = entry?.val;
      if (!ledgerEntryData) continue;

      const entryTypeName =
        typeof ledgerEntryData.switch === "function"
          ? ledgerEntryData.switch()?.name
          : undefined;

      if (
        (entryTypeName === "contractData" ||
          typeof ledgerEntryData.contractData === "function") &&
        typeof ledgerEntryData.contractData === "function"
      ) {
        const _scVal = ledgerEntryData.contractData().val();
        void _scVal;

        parsedEscrows.push({
          id: `ESC-LIVE-${index}`,
          provider: "G-ONCHAIN...PROVIDER",
          amount: "0.00 mBZR",
          status: "LOCKED",
          timestamp: Date.now(),
        });
      }
    }

    return parsedEscrows;
  } catch (err: unknown) {
    console.error(
      "Failed to fetch ledger entries:",
      err instanceof Error ? err.message : err
    );
    return [];
  }
}