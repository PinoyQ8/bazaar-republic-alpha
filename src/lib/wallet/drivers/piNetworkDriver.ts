import { ISignerDriver, WalletAccount } from '@/types/wallet';

export class PiNetworkDriver implements ISignerDriver {
  type = 'pi_network' as const;
  name = 'Pi Network SDK';

  async isAvailable(): Promise<boolean> {
    return typeof window !== 'undefined' && !!(window as any).Pi;
  }

  async connect(): Promise<WalletAccount> {
    const Pi = (window as any).Pi;
    if (!Pi) throw new Error('Pi SDK not loaded in active viewport');

    const scopes = ['username', 'payments', 'wallet_address'];
    const auth = await Pi.authenticate(scopes, () => {});
    
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