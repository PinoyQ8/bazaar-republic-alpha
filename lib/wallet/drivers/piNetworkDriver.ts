import { ISignerDriver, WalletAccount } from '@/types/wallet';

declare global {
  interface Window {
     }
}

export class PiNetworkDriver implements ISignerDriver {
  type = 'pi_network' as const;
  name = 'Pi Network SDK';

  async isAvailable(): Promise<boolean> {
    return typeof window !== 'undefined' && !!window.Pi;
  }

  async connect(): Promise<WalletAccount> {
    if (typeof window !== 'undefined' && window.Pi) {
  await window.Pi.authenticate(['username', 'payments', 'wallet_address']);
}

    const scopes = ['username', 'payments', 'wallet_address'];
    const auth = await window.Pi.authenticate(scopes, () => {});

    return {
      address: auth.user.wallet_address || auth.user.uid,
      publicKey: auth.user.wallet_address || auth.user.uid,
      driverType: this.type,
      network: 'pi_mainnet_bridge',
    };
  }

  async disconnect(): Promise<void> {}

  async signTransaction(xdr: string): Promise<string> {
    return xdr;
  }

  async signAuthEntry(entryHash: Buffer | Uint8Array): Promise<Buffer | Uint8Array> {
    return entryHash;
  }
}