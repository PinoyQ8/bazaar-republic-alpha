'use client';

import { useRouter } from 'next/navigation';

export default function PiLoginPage() {
  const router = useRouter();

  // 🛡️ THE RESOLUTION PROTOCOL
  const onIncompletePaymentFound = async (payment: any) => {
    console.warn("MESH ALERT: Ghost transaction detected.", payment.identifier);
    try {
      // 🚀 Send the ghost transaction to our backend for adjudication
      const res = await fetch('/api/mesh-transactions/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: payment.identifier, txid: payment.transaction.txid })
      });

      if (!res.ok) throw new Error("Failed to clear ghost transaction.");
      console.log("MESH SYNC: Ghost transaction cleared.");
    } catch (error) {
      console.error("FRACTURE: Could not resolve incomplete payment.", error);
    }
  };

  const handleLogin = async () => {
    try {
      const auth = await window.Pi.authenticate(['username', 'payments'], onIncompletePaymentFound);
      localStorage.setItem('pioneer_uid', auth.user.uid);
      router.push('/dashboard');
    } catch (err) {
      console.error("AUTH FRACTURE: Pi Login Failed.", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-6">
      <button 
        onClick={handleLogin}
        className="w-full max-w-85 py-4 bg-amber-600 text-black font-bold uppercase tracking-widest rounded-sm shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:bg-amber-500 transition-all"
      >
        Authenticate Pioneer
      </button>
    </div>
  );
}