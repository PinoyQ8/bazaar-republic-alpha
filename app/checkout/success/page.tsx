'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { OrderEscrowWidget } from '@/components/vault/OrderEscrowWidget';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || 'TEST_UI_02';

  // Active consumer wallet address (replace dynamically when wallet context is integrated)
  const consumerWallet = 'GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3';

  return (
    <div className="max-w-xl mx-auto p-6 text-center space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 mb-2">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-white">Payment Secured in Escrow!</h1>
        <p className="text-sm text-zinc-400">
          Your payment is locked on-chain in the Bazaar Vault contract until you confirm receipt.
        </p>
      </div>

      <div className="text-left">
        <OrderEscrowWidget 
          orderId={orderId} 
          consumerAddress={consumerWallet} 
        />
      </div>

      <div className="pt-4 flex justify-center space-x-4 text-sm">
        <Link 
          href={`/orders/${orderId}`}
          className="font-medium text-purple-400 hover:text-purple-300 hover:underline transition"
        >
          View Full Order Details →
        </Link>
        <span className="text-zinc-600">|</span>
        <Link 
          href="/dashboard/marketplace"
          className="font-medium text-zinc-400 hover:text-zinc-200 transition"
        >
          Back to Marketplace
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center text-zinc-400">
        Loading escrow confirmation...
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}