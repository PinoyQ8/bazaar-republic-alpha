export type EscrowStatus = 'Locked' | 'Released' | 'Disputed' | 'Refunded';

export interface VaultEscrowRecord {
  consumer: string;
  provider: string;
  amount: bigint;
  status: EscrowStatus;
  protocol_version: number;
  token_contract?: string;
  expires_at?: bigint;
}

export interface LockFundsParams {
  escrowId: string;
  consumerAddress: string;
  providerAddress: string;
  amount: bigint | number | string;
  tokenContract?: string;
  durationSecs?: bigint | number;
}

export interface ResolveDisputeParams {
  escrowId: string;
  adminAddress: string;
  payoutToAddress: string;
}