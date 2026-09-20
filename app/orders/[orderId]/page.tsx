'use client';

import React, { use } from 'react';
import { OrderEscrowWidget } from '@/components/vault/OrderEscrowWidget';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default function OrderTrackingPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const rawId = resolvedParams?.orderId || '';

  const consumerWallet = 'GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3';

  if (!rawId) {
    return <div className="p-8 text-center text-neutral-400">Loading order details...</div>;
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-neutral-900">Order Tracking</h1>
        <p className="text-sm text-neutral-500 font-mono">Order ID: {rawId}</p>
      </header>

      <OrderEscrowWidget orderId={rawId} consumerAddress={consumerWallet} />
    </main>
  );
}