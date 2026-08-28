export type WalletDriverType = 'local_dev' | 'soroban_freighter' | 'pi_network' | 'none';

export interface WalletAccount {
  address: string;
  publicKey: string;
  driverType: WalletDriverType;
  network: string;
  balanceStroops?: string;
}

export interface ISignerDriver {
  type: WalletDriverType;
  name: string;
  isAvailable(): Promise<boolean>;
  connect(): Promise<WalletAccount>;
  disconnect(): Promise<void>;
  signTransaction(xdr: string, opts?: { networkPassphrase?: string }): Promise<string>;
  signAuthEntry(entryHash: Buffer | Uint8Array): Promise<Buffer | Uint8Array>;
}

export interface WalletContextState {
  account: WalletAccount | null;
  driverType: WalletDriverType;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: (driver: WalletDriverType) => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (xdr: string) => Promise<string>;
}