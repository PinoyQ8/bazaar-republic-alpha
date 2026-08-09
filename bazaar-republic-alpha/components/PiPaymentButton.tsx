// Location: components/PiPaymentButton.tsx
"use client";

import { useState } from 'react';
import { approvePayment } from '@/app/actions/paymentActions';

export default function PiPaymentButton({ amount, memo, metadata }: { amount: number, memo: string, metadata: any }) {
  const [status, setStatus] = useState<string>('INIT');

  const initiatePayment = async () => {
    try {
      setStatus('AUTHENTICATING');
      
      // @ts-ignore - window.Pi is injected by the Pi Browser
      window.Pi.createPayment({
        amount: amount,
        memo: memo,
        metadata: metadata
      }, {
        onReadyForServerApproval: async (paymentId: string) => {
          setStatus('VERIFYING_WITH_ADJUDICATOR');
          const result = await approvePayment(paymentId, metadata);
          if (result.success) {
            setStatus('TRANSACTION_SECURED');
          } else {
            setStatus('HALT_FAILED');
          }
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          setStatus('COMPLETED');
          alert(`Payment Successful! Tx: ${txid}`);
        },
        onCancel: (paymentId: string) => {
          setStatus('CANCELLED');
        },
        onError: (error: any, paymentId: string) => {
          setStatus(`ERROR: ${error.message}`);
        }
      });
    } catch (err) {
      console.error("Pi SDK Integration Fracture:", err);
    }
  };

  return (
    <button 
      onClick={initiatePayment}
      disabled={status === 'AUTHENTICATING'}
      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-lg transition-all"
    >
      {status === 'INIT' ? `PAY ${amount} π` : status}
    </button>
  );
}