// 🛡️ BAZAAR REPUBLIC // DEPRECATED FREIGHTER DRIVER STUB
// Freighter has been purged in favor of Pi Network & Samsung Knox passkeys.

import { ISignerDriver, WalletAccount } from '@/types/wallet';

export class FreighterDriver implements ISignerDriver {
  name = 'Freighter (Deprecated)';
  type = 'freighter' as any;

  async isAvailable(): Promise<boolean> {
    return false;
  }

  async isConnected(): Promise<boolean> {
    return false;
  }

  async connect(): Promise<WalletAccount> {
    throw new Error(
      "ERR_FREIGHTER_DEPRECATED: Bazaar Republic uses Pi Network and Samsung Knox passkeys. Extension wallets are disabled."
    );
  }

  async disconnect(): Promise<void> {
    // No-op for deprecated driver
  }

  async signTransaction(txXdr: string): Promise<string> {
    throw new Error(
      "ERR_FREIGHTER_DEPRECATED: Client-side extension signing is disabled. Use backend relayer /api/vault."
    );
  }

  async signAuthEntry(entryHash: Buffer | Uint8Array): Promise<Buffer | Uint8Array> {
    throw new Error(
      "ERR_FREIGHTER_DEPRECATED: Client-side auth entry signing is disabled."
    );
  }
}