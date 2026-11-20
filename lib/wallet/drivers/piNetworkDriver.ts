// Location: lib/wallet/drivers/piNetworkDriver.ts
import { ISignerDriver, WalletAccount } from '@/types/wallet';

export class PiNetworkDriver implements ISignerDriver {
  type = 'pi_network' as const;
  name = 'Pi Network SDK';

  async isAvailable(): Promise<boolean> {
    return typeof window !== 'undefined' && !!window.Pi;
  }

  async connect(): Promise<WalletAccount> {
    if (typeof window === 'undefined' || !window.Pi) {
      throw new Error('Pi SDK not available in window context.');
    }

    const isPiBrowser =
      typeof navigator !== 'undefined' && /PiBrowser/i.test(navigator.userAgent);

    try {
      window.Pi.init({ version: '2.0', sandbox: !isPiBrowser });
    } catch {
      // Already initialized on this window lifecycle
    }

    const scopes = ['username', 'payments', 'wallet_address'];
    const auth = await window.Pi.authenticate(scopes, async (incomplete: any) => {
      console.warn('[PiDriver] Incomplete payment detected:', incomplete?.identifier);
      if (incomplete?.identifier && incomplete?.transaction?.txid) {
        await fetch('/api/pi/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId: incomplete.identifier,
            txid: incomplete.transaction.txid,
          }),
        }).catch((err) => console.error('[PiDriver] Incomplete recovery failed:', err));
      }
    });

    const userAddress = auth?.user?.wallet_address || auth?.user?.uid || 'PI_NODE_GUEST';

    return {
      address: userAddress,
      publicKey: userAddress,
      driverType: this.type,
      network: process.env.NEXT_PUBLIC_SOROBAN_NETWORK || 'pi_mainnet_bridge',
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