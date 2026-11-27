import {
  Account,
  Contract,
  Keypair,
  StrKey,
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
import { signEscrowAuthWithMlDsa65 } from "@/lib/pqEscrowAuth";

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

const SIMULATION_FALLBACK_ACCOUNT =
  "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3";

const MISSING_VAULT_ERROR_RE =
  /not found|missing|uninitialized|does not exist|Error\(Storage,\s*MissingValue\)|Error\(Contract,\s*#1\)/i;

export class BazaarVaultService {
  private rpcServer: StellarRpc.Server;
  private horizonServer: Horizon.Server;
  private contract: Contract;
  private networkPassphrase: string;

  constructor(
    contractId: string = BAZAAR_VAULT_CONTRACT_ID,
    rpcUrl: string = SOROBAN_RPC_URL,
    horizonUrl: string = PI_HORIZON_URL,
    networkPassphrase: string = NETWORK_PASSPHRASE
  ) {
    this.assertValidStellarAddress(contractId, "vault contract");
    this.rpcServer = new StellarRpc.Server(rpcUrl, {
      allowHttp: rpcUrl.startsWith("http://"),
    });
    this.horizonServer = new Horizon.Server(horizonUrl);
    this.contract = new Contract(contractId);
    this.networkPassphrase = networkPassphrase;
  }

  private normalizeAndValidateId(escrowId: string): string {
    const trimmed = String(escrowId || "").trim();
    if (!trimmed) {
      throw new Error("[VAULT-GUARD] escrowId is required.");
    }
    return trimmed.replace(/-/g, "_");
  }

  private assertPositiveBigInt(value: bigint, label: string): void {
    if (value <= 0n) {
      throw new Error(`[VAULT-GUARD] ${label} must be greater than 0.`);
    }
  }

  private parsePositiveBigInt(raw: bigint | number | string, label: string): bigint {
    if (typeof raw === "number" && (!Number.isFinite(raw) || !Number.isInteger(raw))) {
      throw new Error(`[VAULT-GUARD] ${label} must be a finite integer.`);
    }
    const parsed = BigInt(raw);
    this.assertPositiveBigInt(parsed, label);
    return parsed;
  }

  private assertValidStellarAddress(address: string, label: string): void {
    const trimmed = String(address || "").trim();
    if (!StrKey.isValidEd25519PublicKey(trimmed) && !StrKey.isValidContract(trimmed)) {
      throw new Error(`[VAULT-GUARD] Invalid ${label} address: ${address}`);
    }
  }

  private async assertEscrowInStatus(
    sanitizedId: string,
    callerAddress: string,
    allowedStatuses: string[],
    actionLabel: string
  ): Promise<VaultEscrowRecord> {
    const vault = await this.getVault(sanitizedId, callerAddress);
    if (!vault) {
      throw new Error(
        `[VAULT-GUARD] Cannot ${actionLabel}: escrow '${sanitizedId}' not found on-chain.`
      );
    }
    const normalized = String(vault.status || "").toUpperCase();
    const allowedUpper = allowedStatuses.map((s) => s.toUpperCase());
    if (!allowedUpper.includes(normalized)) {
      throw new Error(
        `[VAULT-GUARD] Cannot ${actionLabel}: escrow '${sanitizedId}' has status '${vault.status}' (expected ${allowedStatuses.join(" or ")}).`
      );
    }
    return vault;
  }

  async getPiAccount(accountId: string): Promise<Horizon.AccountResponse> {
    this.assertValidStellarAddress(accountId, "account");
    return this.horizonServer.loadAccount(accountId.trim());
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
      normalizedStatus = String(
        rawStatus.name || Object.keys(rawStatus)[0] || "Locked"
      ) as EscrowStatus;
    } else if (typeof rawStatus === "string") {
      normalizedStatus = rawStatus as EscrowStatus;
    }

    return {
      consumer:
        typeof consumer === "string" ? consumer : consumer?.toString?.() || "",
      provider:
        typeof provider === "string" ? provider : provider?.toString?.() || "",
      amount: BigInt(amount || 0),
      status: normalizedStatus,
      protocol_version: Number(protocolVersion),
      token_contract:
        typeof tokenContract === "string"
          ? tokenContract
          : tokenContract?.toString?.() || "",
      expires_at: BigInt(expiresAt),
    };
  }

  async getVault(
    escrowId: string,
    callerAddress?: string
  ): Promise<VaultEscrowRecord | null> {
    const sanitizedId = this.normalizeAndValidateId(escrowId);
    const address = (callerAddress || SIMULATION_FALLBACK_ACCOUNT).trim();
    this.assertValidStellarAddress(address, "caller");

    const dummyAccount = new Account(address, "0");
    const tx = new TransactionBuilder(dummyAccount, {
      fee: PI_BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        this.contract.call(
          "get_vault",
          nativeToScVal(sanitizedId, { type: "symbol" })
        )
      )
      .setTimeout(30)
      .build();

    let simRes: StellarRpc.Api.SimulateTransactionResponse;
    try {
      simRes = await this.rpcServer.simulateTransaction(tx);
    } catch (err: any) {
      throw new Error(
        `[VAULT-RPC] Failed to query vault '${sanitizedId}': ${err?.message || err}`
      );
    }

    if (StellarRpc.Api.isSimulationError(simRes)) {
      const errMsg = String((simRes as any).error || "");
      if (MISSING_VAULT_ERROR_RE.test(errMsg) || !errMsg) {
        return null;
      }
      throw new Error(
        `[VAULT-RPC] Simulation error for vault '${sanitizedId}': ${errMsg}`
      );
    }

    if (!simRes.result?.retval) {
      return null;
    }

    const raw = scValToNative(simRes.result.retval);
    if (!raw) return null;
    return this.parseEscrowRecord(raw);
  }

  async lockFunds(
    params: LockFundsParams,
    signer: Keypair | ((txXdr: string) => Promise<string>),
    sourceAccountOverride?: string
  ): Promise<VaultTxResponse> {
    const sanitizedId = this.normalizeAndValidateId(params.escrowId);
    const amountVal = this.parsePositiveBigInt(params.amount, "amount");
    const durationVal = this.parsePositiveBigInt(
      params.durationSecs ?? 172800,
      "durationSecs"
    );
    const tokenContract = String(params.tokenContract || SAC_TOKEN_CONTRACT).trim();
    const consumerAddress = String(params.consumerAddress || "").trim();
    const providerAddress = String(params.providerAddress || "").trim();

    this.assertValidStellarAddress(tokenContract, "tokenContract");
    this.assertValidStellarAddress(consumerAddress, "consumerAddress");
    this.assertValidStellarAddress(providerAddress, "providerAddress");

    if (consumerAddress === providerAddress) {
      throw new Error("[VAULT-GUARD] consumerAddress and providerAddress must be distinct.");
    }

    const existing = await this.getVault(sanitizedId, consumerAddress);
    if (existing) {
      throw new Error(
        `[VAULT-GUARD] Escrow '${sanitizedId}' already exists on-chain with status '${existing.status}'.`
      );
    }

    const callOp = this.contract.call(
      "lock_funds",
      nativeToScVal(sanitizedId, { type: "symbol" }),
      Address.fromString(tokenContract).toScVal(),
      Address.fromString(consumerAddress).toScVal(),
      Address.fromString(providerAddress).toScVal(),
      nativeToScVal(amountVal, { type: "i128" }),
      nativeToScVal(durationVal, { type: "u64" })
    );

    const txSource = String(
      sourceAccountOverride ||
        (signer instanceof Keypair ? signer.publicKey() : consumerAddress)
    ).trim();
    this.assertValidStellarAddress(txSource, "transaction source");

    return this.executeContractCall(txSource, callOp, signer);
  }

  async releaseFunds(
    escrowId: string,
    callerAddress: string,
    signer: Keypair | ((txXdr: string) => Promise<string>)
  ): Promise<VaultTxResponse> {
    const sanitizedId = this.normalizeAndValidateId(escrowId);
    const trimmedCaller = String(callerAddress || "").trim();
    this.assertValidStellarAddress(trimmedCaller, "callerAddress");
    await this.assertEscrowInStatus(sanitizedId, trimmedCaller, ["Locked"], "releaseFunds");

    const callOp = this.contract.call(
      "release_funds",
      nativeToScVal(sanitizedId, { type: "symbol" }),
      Address.fromString(trimmedCaller).toScVal()
    );

    return this.executeContractCall(trimmedCaller, callOp, signer);
  }

  async refundFunds(
    escrowId: string,
    initiatorAddress: string,
    signer: Keypair | ((txXdr: string) => Promise<string>)
  ): Promise<VaultTxResponse> {
    const sanitizedId = this.normalizeAndValidateId(escrowId);
    const trimmedInitiator = String(initiatorAddress || "").trim();
    this.assertValidStellarAddress(trimmedInitiator, "initiatorAddress");
    await this.assertEscrowInStatus(sanitizedId, trimmedInitiator, ["Locked"], "refundFunds");

    const callOp = this.contract.call(
      "refund_funds",
      nativeToScVal(sanitizedId, { type: "symbol" }),
      Address.fromString(trimmedInitiator).toScVal()
    );

    return this.executeContractCall(trimmedInitiator, callOp, signer);
  }

  async disputeEscrow(
    escrowId: string,
    claimantAddress: string,
    signer: Keypair | ((txXdr: string) => Promise<string>)
  ): Promise<VaultTxResponse> {
    const sanitizedId = this.normalizeAndValidateId(escrowId);
    const trimmedClaimant = String(claimantAddress || "").trim();
    this.assertValidStellarAddress(trimmedClaimant, "claimantAddress");
    await this.assertEscrowInStatus(sanitizedId, trimmedClaimant, ["Locked"], "disputeEscrow");

    const callOp = this.contract.call(
      "dispute_escrow",
      nativeToScVal(sanitizedId, { type: "symbol" }),
      Address.fromString(trimmedClaimant).toScVal()
    );

    return this.executeContractCall(trimmedClaimant, callOp, signer);
  }

  async resolveDisputeWithPq(
    params: {
      escrowId: string;
      adminAddress: string;
      payoutToAddress: string;
      amountStroops?: bigint | number | string;
      nonce: bigint | number | string;
      contractId?: string;
      pqSeed?: Uint8Array;
    },
    signer: Keypair | ((txXdr: string) => Promise<string>)
  ): Promise<VaultTxResponse> {
    const sanitizedId = this.normalizeAndValidateId(params.escrowId);
    const adminAddress = String(params.adminAddress || "").trim();
    const payoutToAddress = String(params.payoutToAddress || "").trim();

    this.assertValidStellarAddress(adminAddress, "adminAddress");
    this.assertValidStellarAddress(payoutToAddress, "payoutToAddress");

    if (
      params.nonce === undefined ||
      params.nonce === null ||
      String(params.nonce).trim() === ""
    ) {
      throw new Error(
        "[VAULT-GUARD] Explicit non-zero nonce is required for resolveDisputeWithPq."
      );
    }
    const nonceVal = this.parsePositiveBigInt(params.nonce, "nonce");

    const targetContractId = String(
      params.contractId || this.contract.contractId() || BAZAAR_VAULT_CONTRACT_ID
    ).trim();
    this.assertValidStellarAddress(targetContractId, "targetContractId");

    if (targetContractId !== this.contract.contractId()) {
      throw new Error(
        `[VAULT-GUARD] targetContractId (${targetContractId}) does not match service contract (${this.contract.contractId()}).`
      );
    }

    const vaultRecord = await this.assertEscrowInStatus(
      sanitizedId,
      adminAddress,
      ["Disputed", "Locked"],
      "resolveDisputeWithPq"
    );

    let resolvedAmount: bigint;
    if (params.amountStroops !== undefined && params.amountStroops !== null) {
      resolvedAmount = this.parsePositiveBigInt(params.amountStroops, "amountStroops");
      if (vaultRecord.amount > 0n && resolvedAmount !== BigInt(vaultRecord.amount)) {
        throw new Error(
          `[VAULT-GUARD] amountStroops (${resolvedAmount}) does not match on-chain vault amount (${vaultRecord.amount}).`
        );
      }
    } else {
      resolvedAmount = this.parsePositiveBigInt(
        BigInt(vaultRecord.amount),
        "on-chain vault amount"
      );
    }

    const pqAuth = signEscrowAuthWithMlDsa65(
      {
        contractId: targetContractId,
        action: "RESOLVE",
        escrowId: sanitizedId,
        amount: resolvedAmount,
        nonce: nonceVal,
      },
      params.pqSeed
    );

    try {
      const callOp = this.contract.call(
        "resolve_dispute_with_pq",
        nativeToScVal(sanitizedId, { type: "symbol" }),
        Address.fromString(adminAddress).toScVal(),
        Address.fromString(payoutToAddress).toScVal(),
        nativeToScVal(pqAuth.pqPublicKey, { type: "bytes" }),
        nativeToScVal(pqAuth.pqSignature, { type: "bytes" }),
        nativeToScVal(nonceVal, { type: "u64" })
      );

      return await this.executeContractCall(adminAddress, callOp, signer);
    } finally {
      pqAuth.zeroizeSecretKey();
    }
  }

  private async getAccountSequence(sourceAddress: string): Promise<string> {
    const trimmedAddress = sourceAddress.trim();
    const horizonBase = (
      process.env.PI_HORIZON_URL ||
      process.env.NEXT_PUBLIC_PI_HORIZON_URL ||
      PI_HORIZON_URL
    ).replace(/\/$/, "");

    // 1. Direct REST fetch to Pi Horizon
    try {
      const res = await fetch(`${horizonBase}/accounts/${trimmedAddress}`);
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data?.sequence) return String(data.sequence);
      }
    } catch {}

    // 2. Fallback to Horizon SDK
    try {
      const horizonAcc = await this.horizonServer.loadAccount(trimmedAddress);
      return horizonAcc.sequenceNumber();
    } catch {}

    // 3. Fallback to Soroban RPC
    try {
      const rpcAcc = await this.rpcServer.getAccount(trimmedAddress);
      return rpcAcc.sequenceNumber();
    } catch (err: any) {
      throw new Error(
        `Failed to load account sequence for ${trimmedAddress}: ${err?.message || err}`
      );
    }
  }

  private assertSignedTxMatchesPrepared(
    preparedTx: Transaction | FeeBumpTransaction,
    signedTx: Transaction | FeeBumpTransaction
  ): void {
    const preparedInner =
      preparedTx instanceof FeeBumpTransaction ? preparedTx.innerTransaction : preparedTx;
    const signedInner =
      signedTx instanceof FeeBumpTransaction ? signedTx.innerTransaction : signedTx;

    if (signedInner.source !== preparedInner.source) {
      throw new Error("[VAULT-GUARD] Signed transaction source does not match prepared source.");
    }
    if (signedInner.sequence !== preparedInner.sequence) {
      throw new Error("[VAULT-GUARD] Signed transaction sequence does not match prepared sequence.");
    }
    if (signedInner.operations.length !== preparedInner.operations.length) {
      throw new Error("[VAULT-GUARD] Signed transaction operation count mismatch.");
    }
  }

  private async executeContractCall(
    sourceAddress: string,
    operation: xdr.Operation,
    signer: Keypair | ((txXdr: string) => Promise<string>)
  ): Promise<VaultTxResponse> {
    const trimmedSource = sourceAddress.trim();
    const sequence = await this.getAccountSequence(trimmedSource);
    const account = new Account(trimmedSource, sequence);

    const tx = new TransactionBuilder(account, {
      fee: PI_BASE_FEE,
      networkPassphrase: this.networkPassphrase,
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
      signedTx = TransactionBuilder.fromXDR(signedXdr, this.networkPassphrase);
      this.assertSignedTxMatchesPrepared(preparedTx, signedTx);
    }

    const sendRes = await this.rpcServer.sendTransaction(signedTx);
    if (sendRes.status === "ERROR") {
      throw new Error(
        `Transaction submission error: ${JSON.stringify(sendRes.errorResult)}`
      );
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
      throw new Error(
        `Transaction ${sendRes.hash} confirmation timed out after 30s.`
      );
    }

    if (txStatus.status === StellarRpc.Api.GetTransactionStatus.FAILED) {
      const errorDetail = (txStatus as any).resultXdr || JSON.stringify(txStatus);
      throw new Error(
        `Transaction ${sendRes.hash} execution failed on-chain: ${errorDetail}`
      );
    }

    return Object.assign(txStatus, { hash: sendRes.hash });
  }
}

export const bazaarVaultService = new BazaarVaultService();
export default bazaarVaultService;