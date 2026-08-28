import * as freighter from '@stellar/freighter-api';
import { ISignerDriver, WalletAccount } from '@/types/wallet';

export class FreighterDriver implements ISignerDriver {
  type = 'soroban_freighter' as const;
  name = 'Freighter Wallet';

  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const res = await freighter.isConnected();
      return !!res;
    } catch {
      return false;
    }
  }

  async connect(): Promise<WalletAccount> {
    // Request access prompts the extension and returns the public key
    const pubKey = await freighter.requestAccess();
    if (!pubKey || typeof pubKey !== 'string') {
      throw new Error('Freighter connection rejected or public key not found');
    }

    return {
      address: pubKey,
      publicKey: pubKey,
      driverType: this.type,
      network: process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet',
    };
  }

  async disconnect(): Promise<void> {}

  async signTransaction(xdr: string, opts?: { networkPassphrase?: string }): Promise<string> {
    const result = await freighter.signTransaction(xdr, {
      networkPassphrase: opts?.networkPassphrase || process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE,
    });
    if (typeof result === 'object' && 'error' in result && result.error) {
      throw new Error(String(result.error));
    }
    return typeof result === 'string' ? result : (result as any).signedTxXdr;
  }

  async signAuthEntry(entryHash: Buffer | Uint8Array): Promise<Buffer> {
    const hex = Buffer.from(entryHash).toString('hex');
    const signedHex = await freighter.signAuthEntry(hex, {
      networkPassphrase: process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE,
    });
    return Buffer.from(typeof signedHex === 'string' ? signedHex : '', 'hex');
  }
}