import { Keypair } from '@stellar/stellar-sdk';
import { ISignerDriver, WalletAccount } from '@/types/wallet';

export class LocalDevDriver implements ISignerDriver {
  type = 'local_dev' as const;
  name = 'Local Dev Signer';
  private keypair: Keypair | null = null;

  async isAvailable(): Promise<boolean> {
    return process.env.NODE_ENV !== 'production' || !!process.env.NEXT_PUBLIC_LOCAL_DEV_SECRET;
  }

  async connect(): Promise<WalletAccount> {
    // Falls back to standard test_admin secret or env secret
    const secret = process.env.NEXT_PUBLIC_LOCAL_DEV_SECRET || 'SD2Q4X7BWB4Y3K43F6O5WJ4H3Y...';
    this.keypair = Keypair.fromSecret(secret);

    return {
      address: this.keypair.publicKey(),
      publicKey: this.keypair.publicKey(),
      driverType: this.type,
      network: 'local',
    };
  }

  async disconnect(): Promise<void> {
    this.keypair = null;
  }

  async signTransaction(xdr: string): Promise<string> {
    if (!this.keypair) throw new Error('Local dev wallet not initialized');
    // Transaction signing logic with @stellar/stellar-sdk TransactionBuilder
    return xdr; 
  }

  async signAuthEntry(entryHash: Uint8Array): Promise<Uint8Array> {
    if (!this.keypair) throw new Error('Local dev wallet not initialized');
    return this.keypair.sign(Buffer.from(entryHash));
  }
}