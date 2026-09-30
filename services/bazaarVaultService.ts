// services/bazaarVaultService.ts
import {
  Account,
  Contract,
  Keypair,
  TransactionBuilder,
  Transaction,
  FeeBumpTransaction,
  nativeToScVal,
  scValToNative,
  xdr,
  rpc as StellarRpc,
  Horizon,
  Address,
} from "@stellar/stellar-sdk";
import { VaultEscrowRecord, LockFundsParams, EscrowStatus } from "@/types/bazaar-vault";

export type VaultTxResponse = StellarRpc.Api.GetTransactionResponse & { hash: string };

export const BAZAAR_VAULT_CONTRACT_ID =
  process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID ||
  process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID ||
  "CBM5SVJHLHNAEUR4GA3IV5KZFPCCMGTZGMAJUNURUQIEFPTKZLKXQ3RY";

export const SAC_TOKEN_CONTRACT =
  process.env.NEXT_PUBLIC_PI_TOKEN_CONTRACT ||
  "CDG6ZM2SHXIHD5HZ2E62B7D76RY5DUHDNQVPSHRVDNN7W4EW47FXLEXQ";

export const SOROBAN_RPC_URL =
  process.env.PI_RPC_URL ||
  process.env.NEXT_PUBLIC_PI_RPC_URL ||
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
  "https://rpc.testnet.minepi.com";

export const PI_HORIZON_URL =
  process.env.PI_HORIZON_URL ||
  process.env.NEXT_PUBLIC_PI_HORIZON_URL ||
  "https://api.testnet.minepi.com";

export const NETWORK_PASSPHRASE =
  process.env.PI_NETWORK_PASSPHRASE ||
  process.env.NEXT_PUBLIC_PI_NETWORK_PASSPHRASE ||
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ||
  "Pi Testnet";

export const PI_BASE_FEE = "1000000"; // 0.1 Test-Pi inclusion buffer

const SIMULATION_FALLBACK_ACCOUNT = "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3";

export class BazaarVaultService {
  private rpcServer: StellarRpc.Server;
  private horizonServer: Horizon.Server;
  private contract: Contract;

  constructor(
    contractId: string = BAZAAR_VAULT_CONTRACT_ID,
    rpcUrl: string = SOROBAN_RPC_URL,
    horizonUrl: string = PI_HORIZON_URL
  ) {
    this.rpcServer = new StellarRpc.Server(rpcUrl, {
      allowHttp: rpcUrl.startsWith("http://"),
    });
    this.horizonServer = new Horizon.Server(horizonUrl);
    this.contract = new Contract(contractId);
  }

  async getPiAccount(accountId: string): Promise<Horizon.AccountResponse> {
    return this.horizonServer.loadAccount(accountId);
  }

  private parseEscrowRecord(raw: any): VaultEscrowRecord {
    const getField = (f: string) => (raw instanceof Map ? raw.get(f) : raw[f]);

    const consumer = getField("consumer");
    const provider = getField("provider");
    const amount = getField("amount");
    const rawStatus = getField("status");
    const protocolVersion = getField("protocol_version") ?? 28;
    const tokenContract = getField("token_contract") || SAC_TOKEN_CONTRACT;
    const expiresAt = getField("expires_at") || BigInt(0);

    let normalizedStatus: EscrowStatus = "Locked";
    if (Array.isArray(rawStatus) && rawStatus.length > 0) {
      normalizedStatus = String(rawStatus[0]) as EscrowStatus;
    } else if (typeof rawStatus === "object" && rawStatus !== null) {
      normalizedStatus = String(rawStatus.name || Object.keys(rawStatus)[0] || "Locked") as EscrowStatus;
    } else if (typeof rawStatus === "string") {
      normalizedStatus = rawStatus as EscrowStatus;
    }

    return {
      consumer: typeof consumer === "string" ? consumer : consumer?.toString?.() || "",
      provider: typeof provider === "string" ? provider : provider?.toString?.() || "",
      amount: BigInt(amount || 0),
      status: normalizedStatus,
      protocol_version: Number(protocolVersion),
      token_contract: typeof tokenContract === "string" ? tokenContract : tokenContract?.toString?.() || "",
      expires_at: BigInt(expiresAt),
    };
  }

  async getVault(escrowId: string, callerAddress?: string): Promise<VaultEscrowRecord | null> {
    try {
      const address = callerAddress || SIMULATION_FALLBACK_ACCOUNT;
      const dummyAccount = new Account(address, "0");
      const sanitizedId = escrowId.replace(/-/g, "_");

      const tx = new TransactionBuilder(dummyAccount, {
        fee: PI_BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          this.contract.call("get_vault", nativeToScVal(sanitizedId, { type: "symbol" }))
        )
        .setTimeout(30)
        .build();

      const simRes = await this.rpcServer.simulateTransaction(tx);
      if (StellarRpc.Api.isSimulationError(simRes) || !simRes.result?.retval) {
        return null;
      }

      const raw = scValToNative(simRes.result.retval);
      return this.parseEscrowRecord(raw);
    } catch {
      return null;
    }
  }

  async lockFunds(
    params: LockFundsParams,
    signer: Keypair | ((txXdr: string) => Promise<string>)
  ): Promise<VaultTxResponse> {
    const amountVal = BigInt(params.amount);
    const durationVal = BigInt(params.durationSecs || 172800);
    const tokenContract = params.tokenContract || SAC_TOKEN_CONTRACT;
    const sanitizedId = params.escrowId.replace(/-/g, "_");

    const callOp = this.contract.call(
      "lock_funds",
      nativeToScVal(sanitizedId, { type: "symbol" }),
      Address.fromString(tokenContract).toScVal(),
      Address.fromString(params.consumerAddress).toScVal(),
      Address.fromString(params.providerAddress).toScVal(),
      nativeToScVal(amountVal, { type: "i128" }),
      nativeToScVal(durationVal, { type: "u64" })
    );

    return this.executeContractCall(params.consumerAddress, callOp, signer);
  }

  async releaseFunds(
    escrowId: string,
    callerAddress: string,
    signer: Keypair | ((txXdr: string) => Promise<string>)
  ): Promise<VaultTxResponse> {
    const sanitizedId = escrowId.replace(/-/g, "_");
    const callOp = this.contract.call(
      "release_funds",
      nativeToScVal(sanitizedId, { type: "symbol" }),
      Address.fromString(callerAddress).toScVal()
    );

    return this.executeContractCall(callerAddress, callOp, signer);
  }

  async refundFunds(
    escrowId: string,
    initiatorAddress: string,
    signer: Keypair | ((txXdr: string) => Promise<string>)
  ): Promise<VaultTxResponse> {
    const sanitizedId = escrowId.replace(/-/g, "_");
    const callOp = this.contract.call(
      "refund_funds",
      nativeToScVal(sanitizedId, { type: "symbol" }),
      Address.fromString(initiatorAddress).toScVal()
    );

    return this.executeContractCall(initiatorAddress, callOp, signer);
  }

  async disputeEscrow(
    escrowId: string,
    claimantAddress: string,
    signer: Keypair | ((txXdr: string) => Promise<string>)
  ): Promise<VaultTxResponse> {
    const sanitizedId = escrowId.replace(/-/g, "_");
    const callOp = this.contract.call(
      "dispute_escrow",
      nativeToScVal(sanitizedId, { type: "symbol" }),
      Address.fromString(claimantAddress).toScVal()
    );

    return this.executeContractCall(claimantAddress, callOp, signer);
  }

  async resolveDispute(
    params: {
      escrowId: string;
      adminAddress: string;
      payoutToAddress: string;
    },
    signer: Keypair | ((txXdr: string) => Promise<string>)
  ): Promise<VaultTxResponse> {
    const sanitizedId = params.escrowId.replace(/-/g, "_");
    const callOp = this.contract.call(
      "resolve_dispute",
      nativeToScVal(sanitizedId, { type: "symbol" }),
      Address.fromString(params.adminAddress).toScVal(),
      Address.fromString(params.payoutToAddress).toScVal()
    );

    return this.executeContractCall(params.adminAddress, callOp, signer);
  }

 private async getAccountSequence(sourceAddress: string): Promise<string> {
    // 1. Direct REST fetch to Pi Horizon (raw JSON response has public .sequence string)
    try {
      const res = await fetch(`${PI_HORIZON_URL.replace(/\/$/, "")}/accounts/${sourceAddress}`);
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data?.sequence) return String(data.sequence);
      }
    } catch {}

    // 2. Fallback to Horizon SDK (AccountResponse inherits .sequenceNumber())
    try {
      const horizonAcc = await this.horizonServer.loadAccount(sourceAddress);
      return horizonAcc.sequenceNumber();
    } catch {}

    // 3. Fallback to Soroban RPC (Account exposes .sequenceNumber())
    try {
      const rpcAcc = await this.rpcServer.getAccount(sourceAddress);
      return rpcAcc.sequenceNumber();
    } catch (err: any) {
      throw new Error(`Failed to load account sequence for ${sourceAddress}: ${err?.message || err}`);
    }
  }

  private async executeContractCall(
    sourceAddress: string,
    operation: xdr.Operation,
    signer: Keypair | ((txXdr: string) => Promise<string>)
  ): Promise<VaultTxResponse> {
    const sequence = await this.getAccountSequence(sourceAddress);
    const account = new Account(sourceAddress, sequence);

    const tx = new TransactionBuilder(account, {
      fee: PI_BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(60)
      .build();

    const preparedTx = await this.rpcServer.prepareTransaction(tx);
    let signedTx: Transaction | FeeBumpTransaction;

    if (signer instanceof Keypair) {
      (preparedTx as Transaction).sign(signer);
      signedTx = preparedTx;
    } else {
      const signedXdr = await signer(preparedTx.toXDR());
      signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
    }

    const sendRes = await this.rpcServer.sendTransaction(signedTx);
    if (sendRes.status === "ERROR") {
      throw new Error(`Transaction submission error: ${JSON.stringify(sendRes.errorResult)}`);
    }

    const maxAttempts = 20;
    let attempts = 0;
    let txStatus = await this.rpcServer.getTransaction(sendRes.hash);

    while (
      txStatus.status === StellarRpc.Api.GetTransactionStatus.NOT_FOUND &&
      attempts < maxAttempts
    ) {
      attempts++;
      await new Promise((r) => setTimeout(r, 1500));
      txStatus = await this.rpcServer.getTransaction(sendRes.hash);
    }

    if (txStatus.status === StellarRpc.Api.GetTransactionStatus.NOT_FOUND) {
      throw new Error(`Transaction ${sendRes.hash} confirmation timed out after 30s.`);
    }

    if (txStatus.status === StellarRpc.Api.GetTransactionStatus.FAILED) {
      const errorDetail = (txStatus as any).resultXdr || JSON.stringify(txStatus);
      throw new Error(`Transaction ${sendRes.hash} execution failed on-chain: ${errorDetail}`);
    }

    return Object.assign(txStatus, { hash: sendRes.hash });
  }
}

export const bazaarVaultService = new BazaarVaultService();
export default bazaarVaultService;