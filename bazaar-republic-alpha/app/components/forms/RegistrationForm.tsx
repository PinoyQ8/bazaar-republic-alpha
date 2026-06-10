"use client";

import { useState } from "react";
import { registerServiceProvider } from "@/app/actions/enetworkActions";
import { useRouter } from "next/navigation";

export function RegisterForm({ pioneerId }: { pioneerId: string }) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    const result = await registerServiceProvider({
  uid: formData.get("uid") as string || `node_${Date.now()}`,
  username: formData.get("username") as string,
  walletAddress: formData.get("walletAddress") as string,
});
    
    if (result.success) {
      router.push("/enetwork/dashboard");
    } else {
      alert("Registration Fracture: " + result.message);
    }
    setIsPending(false);
  }

  return (
    <form action={handleSubmit} className="space-y-4 w-full max-w-sm mx-auto p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
      <input type="hidden" name="pioneerId" value={pioneerId} />
      
      <div>
        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Service Title</label>
        <input name="title" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:border-emerald-500 outline-none" placeholder="e.g. MESH-Node Hosting" />
      </div>

      <div>
        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Rate (Pi)</label>
        <input name="rate" type="number" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:border-emerald-500 outline-none" placeholder="0.00" />
      </div>

      <button 
        disabled={isPending}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-xl transition-all uppercase tracking-widest disabled:opacity-50"
      >
        {isPending ? "TRANSMITTING..." : "REGISTER PROVIDER"}
      </button>
    </form>
  );
}