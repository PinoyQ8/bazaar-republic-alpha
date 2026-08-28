'use client';

import { useState } from 'react';
import { usePasskeyAuth } from '@/app/hooks/usePasskeyAuth';

export default function EscrowLockPanel({ pioneerUid, providerId }: { pioneerUid: string; providerId: string }) {
  const { registerPasskey, loading: passkeyLoading } = usePasskeyAuth();
  const [amount, setAmount] = useState('');
  const [escrowId, setEscrowId] = useState('');
  const [signerSecret, setSignerSecret] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLockFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      // 1. Ensure Passkey / WebAuthn validation is triggered first
      const credentialId = await registerPasskey(pioneerUid);
      if (!credentialId) throw new Error('Passkey verification failed.');

      // 2. Invoke backend escrow lock API (triggers Soroban Relayer & DB sync)
      const res = await fetch('/api/escrow/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pioneerUid,
          providerId,
          amount: parseFloat(amount),
          escrowId,
          signerSecret,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to lock funds.');

      setStatus(`✅ Escrow successfully locked! TX Hash: ${data.txHash}`);
    } catch (err: any) {
      setStatus(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800">
      <h2 className="text-xl font-bold mb-4 text-emerald-400">🛡️ Project Bazaar Escrow Vault</h2>
      <form onSubmit={handleLockFunds} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Escrow ID (e.g. ESC-001)</label>
          <input
            type="text"
            value={escrowId}
            onChange={(e) => setEscrowId(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Amount (Stroops / Base Units)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Signer Secret Key</label>
          <input
            type="password"
            value={signerSecret}
            onChange={(e) => setSignerSecret(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading || passkeyLoading}
          className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-md transition disabled:opacity-50"
        >
          {loading ? 'Processing Escrow Lock...' : 'Authorize & Lock Funds'}
        </button>
      </form>
      {status && <p className="mt-4 text-sm whitespace-pre-wrap">{status}</p>}
    </div>
  );
}