// Location: services/bazaarVaultService.ts
import {
  Account,
  Contract,
  Keypair,
  TransactionBuilder,
  Transaction,
  FeeBumpTransaction,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  xdr,
  rpc as StellarRpc,
  Horizon,
  Address,
} from '@stellar/stellar-sdk';
import { VaultEscrowRecord, EscrowStatus } from '@/types/bazaar-vault';

export const BAZAAR_VAULT_CONTRACT_ID =
  process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID ||
  'CCLEEATNMEUZGVSYL4NSZYADVCAPU2EFCJNCNV77KVOUDFO3CGM3SKKL';

export const SAC_TOKEN_CONTRACT =
  process.env.NEXT_PUBLIC_PI_TOKEN_CONTRACT ||
  'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

export const SOROBAN_RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
  process.env.SOROBAN_RPC_URL ||
  'https://soroban-testnet.stellar.org';

export const PI_HORIZON_URL =
  process.env.NEXT_PUBLIC_PI_HORIZON_URL ||
  'https://horizon-testnet.stellar.org';

export const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ||
  process.env.STELLAR_NETWORK_PASSPHRASE ||
  'Test SDF Network ; September 2015';

const SIMULATION_FALLBACK_ACCOUNT = 'GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3';

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
      allowHttp: rpcUrl.startsWith('http://'),
    });
    this.horizonServer = new Horizon.Server(horizonUrl);
    this.contract = new Contract(contractId);
  }

  async getPiAccount(accountId: string): Promise<Horizon.AccountResponse> {
    return this.horizonServer.loadAccount(accountId);
  }

  private parseEscrowRecord(raw: any): VaultEscrowRecord {
    const getField = (f: string) => (raw instanceof Map ? raw.get(f) : raw[f]);

    const consumer = getField('consumer');
    const provider = getField('provider');
    const amount = getField('amount');
    const rawStatus = getField('status');
    const protocolVersion = getField('protocol_version') ?? 28;
    const tokenContract = getField('token_contract') || SAC_TOKEN_CONTRACT;
    const expiresAt = getField('expires_at') || BigInt(0);

    let normalizedStatus: string = 'Locked';
    if (Array.isArray(rawStatus) && rawStatus.length > 0) {
      normalizedStatus = String(rawStatus[0]);
    } else if (typeof rawStatus === 'object' && rawStatus !== null) {
      normalizedStatus = String(rawStatus.name || Object.keys(rawStatus)[0] || 'Locked');
    } else if (typeof rawStatus === 'string') {
      normalizedStatus = rawStatus;
    }

    return {
      consumer: typeof consumer === 'string' ? consumer : consumer?.toString?.() || '',
      provider: typeof provider === 'string' ? provider : provider?.toString?.() || '',
      amount: BigInt(amount || 0),
      status: normalizedStatus as EscrowStatus,
      protocol_version: Number(protocolVersion),
      token_contract: typeof tokenContract === 'string' ? tokenContract : tokenContract?.toString?.() || '',
      expires_at: BigInt(expiresAt),
    };
  }

  async getVault(escrowId: string, callerAddress?: string): Promise<VaultEscrowRecord | null> {
    try {
      const address = callerAddress || SIMULATION_FALLBACK_ACCOUNT;
      const dummyAccount = new Account(address, '0');
      const sanitizedId = escrowId.replace(/-/g, '_');

      const tx = new TransactionBuilder(dummyAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          this.contract.call(
            'get_vault',
            nativeToScVal(sanitizedId, { type: 'symbol' })
          )
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
    params: {
      escrowId: string;
      tokenContract?: string;
      consumerAddress: string;
      providerAddress: string;
      amount: bigint | number | string;
      durationSecs?: bigint | number;
    },
    signer: Keypair | ((txXdr: string) => Promise<string>)
  ): Promise<StellarRpc.Api.GetTransactionResponse> {
    const amountVal = BigInt(params.amount);
    const durationVal = BigInt(params.durationSecs || 172800);
    const tokenContract = params.tokenContract || SAC_TOKEN_CONTRACT;
    const sanitizedId = params.escrowId.replace(/-/g, '_');

    const callOp = this.contract.call(
      'lock_funds',
      nativeToScVal(sanitizedId, { type: 'symbol' }),
      Address.fromString(tokenContract).toScVal(),
      Address.fromString(params.consumerAddress).toScVal(),
      Address.fromString(params.providerAddress).toScVal(),
      nativeToScVal(amountVal, { type: 'i128' }),
      nativeToScVal(durationVal, { type: 'u64' })
    );

    return this.executeContractCall(params.consumerAddress, callOp, signer);
  }

  async releaseFunds(
    escrowId: string,
    consumerAddress: string,
    signer: Keypair | ((txXdr: string) => Promise<string>)
  ): Promise<StellarRpc.Api.GetTransactionResponse> {
    const sanitizedId = escrowId.replace(/-/g, '_');
    const callOp = this.contract.call(
      'release_funds',
      nativeToScVal(sanitizedId, { type: 'symbol' }),
      Address.fromString(consumerAddress).toScVal()
    );

    return this.executeContractCall(consumerAddress, callOp, signer);
  }

  async disputeEscrow(
    escrowId: string,
    callerAddress: string,
    signer: Keypair | ((txXdr: string) => Promise<string>)
  ): Promise<StellarRpc.Api.GetTransactionResponse> {
    const sanitizedId = escrowId.replace(/-/g, '_');
    const callOp = this.contract.call(
      'dispute_escrow',
      nativeToScVal(sanitizedId, { type: 'symbol' }),
      Address.fromString(callerAddress).toScVal()
    );

    return this.executeContractCall(callerAddress, callOp, signer);
  }

  async refundFunds(
    escrowId: string,
    initiatorAddress: string,
    signer: Keypair | ((txXdr: string) => Promise<string>)
  ): Promise<StellarRpc.Api.GetTransactionResponse> {
    const sanitizedId = escrowId.replace(/-/g, '_');
    const callOp = this.contract.call(
      'refund_funds',
      nativeToScVal(sanitizedId, { type: 'symbol' }),
      Address.fromString(initiatorAddress).toScVal()
    );

    return this.executeContractCall(initiatorAddress, callOp, signer);
  }

  private async executeContractCall(
    sourceAddress: string,
    operation: xdr.Operation,
    signer: Keypair | ((txXdr: string) => Promise<string>)
  ): Promise<StellarRpc.Api.GetTransactionResponse> {
    const account = await this.rpcServer.getAccount(sourceAddress);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
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
    if (sendRes.status === 'ERROR') {
      throw new Error(`Transaction submission error: ${JSON.stringify(sendRes.errorResult)}`);
    }

    let txStatus = await this.rpcServer.getTransaction(sendRes.hash);
    while (txStatus.status === StellarRpc.Api.GetTransactionStatus.NOT_FOUND) {
      await new Promise((r) => setTimeout(r, 1500));
      txStatus = await this.rpcServer.getTransaction(sendRes.hash);
    }

    return txStatus;
  }
}
export const bazaarVaultService = new BazaarVaultService();

