"use client";
import { useState, useEffect } from 'react';

export default function PiPaymentButton({ amount, memo, metadata }: { amount: number, memo: string, metadata: any }) {
  const [status, setStatus] = useState<string>('INIT');

  // 1. Initialize the Pi SDK when the button mounts
  useEffect(() => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Pi) {
        // Set sandbox: true since we are testing in the alpha-track
        // @ts-ignore
        window.Pi.init({ version: "2.0", sandbox: true });
        console.log("[MESH-SCAN] 🟢 Pi SDK Initialized (Sandbox Mode)");
      }
    } catch (err) {
      console.error("[MESH-SCAN] ❌ Pi SDK Init Fracture:", err);
    }
  }, []);

  const initiatePayment = async () => {
    try {
      setStatus('AUTHENTICATING');
      
      // 2. Define the mandatory scopes
      const scopes = ['payments', 'username'];
      
      // 3. Define the mandatory incomplete payment fallback
      const onIncompletePaymentFound = async (payment: any) => {
        console.warn("[MESH-SCAN] 🚨 Incomplete Payment Detected:", payment.identifier);
        setStatus('RESOLVING_OLD_PAYMENT');
        
        // If a past payment got stuck, we clear it through our REST Vault
        if (payment.transaction && payment.transaction.txid) {
          await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'complete', paymentId: payment.identifier, txid: payment.transaction.txid })
          });
          setStatus('OLD_PAYMENT_CLEARED');
        }
      };

      // 4. Authenticate the Pioneer (This is where Stage 1 was freezing)
      // @ts-ignore
      const auth = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
      console.log(`[MESH-SCAN] 🛡️ Pioneer Authenticated: ${auth.user.username}`);

      // 5. Initiate Phase I & II: Create the Payment
      // @ts-ignore
      window.Pi.createPayment({ amount, memo, metadata }, {
        onReadyForServerApproval: async (paymentId: string) => {
          setStatus('VERIFYING_WITH_ADJUDICATOR');
          
          const res = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'approve', paymentId })
          });
          
          if (res.ok) setStatus('TRANSACTION_SECURED');
          else setStatus('HALT_FAILED');
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          setStatus('FINALIZING_LEDGER');
          
          const res = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'complete', paymentId, txid })
          });
          
          if (res.ok) setStatus('COMPLETED');
          else setStatus('COMPLETION_FAILED');
        },
        onCancel: () => setStatus('CANCELLED'),
        onError: (err: any) => {
          console.error("[MESH-SCAN] SDK Error:", err);
          setStatus('ERROR_DETECTED');
        }
      });
    } catch (err) {
      console.error("[MESH-SCAN] Authentication Fracture:", err);
      setStatus('FRACTURE_DETECTED');
    }
  };

  return (
    <button 
      onClick={initiatePayment}
      disabled={['AUTHENTICATING', 'VERIFYING_WITH_ADJUDICATOR', 'FINALIZING_LEDGER', 'RESOLVING_OLD_PAYMENT'].includes(status)}
      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-lg transition-all"
    >
      {status === 'INIT' ? `PAY ${amount} π` : status}
    </button>
  );
}