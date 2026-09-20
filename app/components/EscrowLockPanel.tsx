'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePasskeyAuth } from '@/app/hooks/usePasskeyAuth';

interface EscrowLockPanelProps {
  pioneerUid: string;
  providerId: string;
  defaultAmount?: string;
}

export default function EscrowLockPanel({
  pioneerUid,
  providerId,
  defaultAmount = '',
}: EscrowLockPanelProps) {
  const router = useRouter();
  const { registerPasskey, loading: passkeyLoading } = usePasskeyAuth();
  const [amount, setAmount] = useState(defaultAmount);
  const [orderId, setOrderId] = useState('');
  const [signerSecret, setSignerSecret] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLockFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      // 1. Passkey / WebAuthn validation
      const credentialId = await registerPasskey(pioneerUid);
      if (!credentialId) throw new Error('Passkey verification failed.');

      // 2. Format order/escrow identifier
      const cleanOrderId = (orderId || `ORD_${Date.now().toString().slice(-6)}`).replace(/-/g, '_');
      const normalizedEscrowId = cleanOrderId.startsWith('ESC_') ? cleanOrderId : `ESC_${cleanOrderId}`;

      // 3. Post LOCK action to the verified Soroban vault route
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOCK',
          escrowId: normalizedEscrowId,
          consumerAddress: pioneerUid,
          providerAddress: providerId,
          amount: amount.toString(),
          secretKey: signerSecret || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to lock funds on-chain.');
      }

      setStatusMessage(`Payment locked! Tx: ${data.txHash}`);

      // 4. Route directly to success confirmation
      setTimeout(() => {
        router.push(`/checkout/success?orderId=${cleanOrderId}`);
      }, 1000);
    } catch (err: any) {
      setStatusMessage(`Error: ${err?.message || 'Transaction failed'}`);
    } finally {
      setLoading(false);
    }
  };

  const isSubmitting = loading || passkeyLoading;

  return (
    <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/80 shadow-lg text-white max-w-md mx-auto space-y-4">
      <header>
        <h2 className="text-lg font-bold text-white">Lock Payment in Vault</h2>
        <p className="text-xs text-zinc-400">Pi Testnet Protocol 28 Smart Contract</p>
      </header>

      <form onSubmit={handleLockFunds} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Order Reference ID
          </label>
          <input
            type="text"
            placeholder="e.g. ALPHA_TEST_03"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Amount (Stroops / 10,000,000 = 1 Pi)
          </label>
          <input
            type="number"
            placeholder="e.g. 500000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Signer Secret <span className="text-zinc-500">(Optional if server relayer enabled)</span>
          </label>
          <input
            type="password"
            placeholder="S..."
            value={signerSecret}
            onChange={(e) => setSignerSecret(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-purple-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-white font-medium text-sm rounded-lg transition shadow"
        >
          {isSubmitting ? 'Authenticating & Locking Funds...' : 'Authorize & Lock in Escrow'}
        </button>
      </form>

      {statusMessage && (
        <div
          className={`p-3 rounded-lg text-xs break-all ${
            statusMessage.startsWith('Error')
              ? 'bg-red-950/60 border border-red-800 text-red-300'
              : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
          }`}
        >
          {statusMessage}
        </div>
      )}
    </div>
  );
}