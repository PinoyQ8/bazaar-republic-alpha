export type EscrowStatus = 'Locked' | 'Released' | 'Disputed' | 'Refunded';

export interface VaultEscrowRecord {
  consumer: string;
  provider: string;
  amount: bigint | number | string;
  status: EscrowStatus;
  protocol_version?: number;
  token_contract?: string;
  expires_at?: bigint | number | string;
}
