// Location: app/components/PiPaymentForge.tsx
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ensurePiInitialized, safePiAuthenticate } from '@/app/utils/safePi';
import { Loader2, Coins, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface PiPaymentForgeProps {
  amount: number;
  memo: string;
  metadata?: Record<string, any>;
  onSuccess?: (txid: string) => void;
}

export default function PiPaymentForge({
  amount,
  memo,
  metadata = {},
  onSuccess,
}: PiPaymentForgeProps) {
  const { pioneer, isHydrated } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStake = async () => {
    setErrorMsg(null);

    if (typeof window === 'undefined' || !(window as any).Pi) {
      setErrorMsg('Pi SDK gateway unavailable. Open in Pi Browser.');
      return;
    }

    setProcessing(true);
    setStatusMsg('1/4: Initializing MESH Sandbox & Scopes...');

    const Pi = (window as any).Pi;

    try {
      // 1. Mandatory Pi.init call on current window context
      ensurePiInitialized(true);

      // 2. Re-assert authentication with 'payments' scope
      const auth = await safePiAuthenticate(['username', 'payments']);
      const currentUid = auth?.user?.uid || pioneer?.uid;

      if (!currentUid) {
        throw new Error('Node Identity Unverified.');
      }

      setStatusMsg('2/4: Invoking Native Payment Modal...');

      const paymentData = {
        amount: Number(amount),
        memo: String(memo),
        metadata: { 
          network: 'MESH_TESTNET',
          pioneer_uid: currentUid,
          ...metadata
        },
      };

      const paymentCallbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          setStatusMsg(`3/4: Authorizing Payment (${paymentId.slice(0, 8)}...)...`);
          console.log('[PAYMENT_FLOW] onReadyForServerApproval:', paymentId);

          try {
            const res = await fetch('/api/payments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'approve', paymentId }),
            });
            
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
              const reason = data.details || data.error || `HTTP ${res.status}`;
              console.error('[PAYMENT_FAULT] Approval rejected:', reason);
              setErrorMsg(`Approval Fault: ${reason}`);
              setProcessing(false);
              return;
            }

            setStatusMsg('Awaiting Pioneer Signature in Pi Modal...');
          } catch (err: any) {
            console.error('[PAYMENT_FAULT] Approval network error:', err);
            setErrorMsg(`Approval Network Fault: ${err.message}`);
            setProcessing(false);
          }
        },

        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          setStatusMsg('4/4: Signature captured! Finalizing ledger stake...');
          console.log('[PAYMENT_FLOW] onReadyForServerCompletion:', { paymentId, txid });

          try {
            const res = await fetch('/api/payments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                action: 'complete', 
                paymentId, 
                txid,
                uid: currentUid,
                username: auth?.user?.username || pioneer?.username
              }),
            });
            
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
              const reason = data.details || data.error || `HTTP ${res.status}`;
              console.error('[PAYMENT_FAULT] Completion rejected:', reason);
              setErrorMsg(`Completion Fault: ${reason}`);
              setProcessing(false);
              return;
            }

            setStatusMsg('Verified: Stake Locked on MESH Ledger!');
            if (onSuccess) onSuccess(txid);
          } catch (err: any) {
            console.error('[PAYMENT_FAULT] Completion network error:', err);
            setErrorMsg(`Completion Fault: ${err.message}`);
          } finally {
            setProcessing(false);
          }
        },

        onCancel: (paymentId: string) => {
          console.warn(`[PAYMENT_LOG] Cancelled by Pioneer: ${paymentId}`);
          setErrorMsg('Payment cancelled by user.');
          setStatusMsg(null);
          setProcessing(false);
        },

        onError: (error: Error, payment?: any) => {
          console.error(`[PAYMENT_CRITICAL] SDK Runtime Fault:`, error, payment);
          setErrorMsg(error?.message || 'Transaction execution failed in sandbox.');
          setStatusMsg(null);
          setProcessing(false);
        },
      };

      console.log('[PAYMENT_INIT] Invoking Pi.createPayment:', paymentData);
      Pi.createPayment(paymentData, paymentCallbacks);

    } catch (err: any) {
      console.error('[PAYMENT_FAULT] Execution crash:', err);
      setErrorMsg(`SDK Bridge Crash: ${err?.message || 'Check Pi Browser environment.'}`);
      setProcessing(false);
    }
  };

  if (!isHydrated) return null;

  return (
    <div className="w-full space-y-3 font-mono">
      <button
        onClick={handleStake}
        disabled={processing}
        className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
      >
        {processing ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
        ) : (
          <Coins className="w-4 h-4 text-slate-950" />
        )}
        <span>{processing ? 'Connecting Native Modal...' : `Execute ${amount} Test-Pi Stake`}</span>
      </button>

      {(statusMsg || errorMsg) && (
        <div className={`p-3 rounded-lg border text-[10px] tracking-wide flex flex-col gap-1 ${
          errorMsg ? 'bg-rose-950/40 border-rose-900/60' : 'bg-slate-950 border-slate-800/80'
        }`}>
          {statusMsg && !errorMsg && (
            <p className="text-emerald-400 font-bold uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>{statusMsg}</span>
            </p>
          )}
          
          {errorMsg && (
            <p className="text-rose-400 flex items-start gap-1.5 leading-relaxed">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}