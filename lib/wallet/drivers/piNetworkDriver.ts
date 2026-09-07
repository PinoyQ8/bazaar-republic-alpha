import { ISignerDriver, WalletAccount } from '@/types/wallet';

export class PiNetworkDriver implements ISignerDriver {
  type = 'pi_network' as const;
  name = 'Pi Network SDK';

  async isAvailable(): Promise<boolean> {
    return typeof window !== 'undefined' && !!window.Pi;
  }

  async connect(): Promise<WalletAccount> {
    if (typeof window === 'undefined' || !window.Pi) {
      throw new Error('Pi SDK not detected in active window. Open inside Pi Browser.');
    }

    const pi = window.Pi;

    // 1. Initialize SDK runtime prior to authentication
    await pi.init({
      version: '2.0',
      sandbox: process.env.NODE_ENV !== 'production',
    });

    // 2. Single unified authentication handshake
    const scopes = ['username', 'payments', 'wallet_address'];
    const auth = await pi.authenticate(scopes, (payment) => {
      console.warn('[MESH-DRIVER] Incomplete payment caught:', payment);
    });

    const userAddress = auth?.user?.wallet_address || auth?.user?.uid || 'PI_NODE_GUEST';

    return {
      address: userAddress,
      publicKey: userAddress,
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