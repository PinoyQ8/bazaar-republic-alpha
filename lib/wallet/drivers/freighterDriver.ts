import { isConnected, requestAccess, signTransaction, signAuthEntry } from '@stellar/freighter-api';
import { ISignerDriver, WalletAccount } from '@/types/wallet';

export class FreighterDriver implements ISignerDriver {
  type = 'soroban_freighter' as const;
  name = 'Freighter Wallet';

  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const result = await isConnected();
      // Handle boolean or result object return from different api versions
      return typeof result === 'boolean' ? result : !!(result && !result.error && result.isConnected);
    } catch {
      return false;
    }
  }

  async connect(): Promise<WalletAccount> {
    const access = await requestAccess();

    if (access.error) {
      throw new Error(`Freighter connection rejected: ${access.error}`);
    }

    const pubKey = access.address;
    if (!pubKey) {
      throw new Error('No public key returned from Freighter');
    }

    return {
      address: pubKey,
      publicKey: pubKey,
      driverType: this.type,
      network: process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet',
    };
  }

  async disconnect(): Promise<void> {
    // Client-side session clear
  }

  async signTransaction(xdr: string, opts?: { networkPassphrase?: string }): Promise<string> {
    const result = await signTransaction(xdr, {
      networkPassphrase: opts?.networkPassphrase || process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE,
    });

    if (result.error) {
      throw new Error(`Transaction signing failed: ${result.error}`);
    }

    return result.signedTxXdr;
  }

  async signAuthEntry(entryHash: Buffer | Uint8Array): Promise<Buffer> {
    const hex = Buffer.from(entryHash).toString('hex');
    const result = await signAuthEntry(hex, {
      networkPassphrase: process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE,
    });

    if (result.error || !result.signedAuthEntry) {
      throw new Error(`Auth entry signing failed: ${result.error || 'Empty signature'}`);
    }

    return Buffer.from(result.signedAuthEntry, 'hex');
  }
}