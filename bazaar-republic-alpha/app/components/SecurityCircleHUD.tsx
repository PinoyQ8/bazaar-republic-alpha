"use client";
import { useState, useEffect } from "react";
import { registerSecurityCircle, getSecurityCircleStatus } from "@/app/actions/defiActions"; // 🟢 SECURED

export default function SecurityCircleHUD({ pioneerId }: { pioneerId: string }) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  useEffect(() => {
    getSecurityCircleStatus(pioneerId).then((res: any) => { 
  setStatus(res); 
})
  }, [pioneerId]);

  // 🛡️ THE WRAPPER (TS2322 Fix)
  async function handleClientSubmit(formData: FormData) {
    setFormMessage("Processing Vault Transaction...");
    
    // Execute the Server Action
    const response = await registerSecurityCircle(formData);
    
    // Read the intelligent return object
    setFormMessage(response.message);
    
    if (response.success) {
       // Re-scan the node to update the UI from Form to Status View
       const updated = await getSecurityCircleStatus(pioneerId);
       if (updated.success) setStatus(updated.data);
    }
  }

  if (loading) return <div className="text-zinc-400 font-mono">MESH-SCANNING...</div>;

  // 🛡️ VIEW 1: NODE ALREADY ENROLLED
  if (status) {
    return (
      <div className="p-4 border border-emerald-900 bg-zinc-900 rounded-md font-mono">
        <h3 className="text-emerald-400 font-bold mb-2">NODE SECURITY STATUS: ACTIVE</h3>
        <p className="text-zinc-300">KYC Status: <span className="text-emerald-400">{status.kyc_status}</span></p>
        <p className="text-zinc-300">Stake Amount: {status.stakeAmount} Test-Pi</p>
        <p className="text-zinc-500 text-xs mt-2">Treasury Lock Verified</p>
      </div>
    );
  }

  // 🛡️ VIEW 2: STAKING INTERFACE
  return (
    <form action={handleClientSubmit} className="space-y-4 p-4 border border-zinc-700 rounded-md font-mono">
      <h3 className="text-zinc-300 font-bold">INITIALIZE SECURITY CIRCLE</h3>
      <input type="hidden" name="pioneerId" value={pioneerId} />
      
      <input 
        name="publicAddress" 
        placeholder="Enter Burner Wallet Address" 
        className="w-full bg-zinc-800 text-zinc-300 p-2 rounded border border-zinc-700" 
        required 
      />
      
      <input 
        name="stakeAmount" 
        type="number" 
        step="0.01"
        placeholder="Stake Amount (Min 10)" 
        className="w-full bg-zinc-800 text-zinc-300 p-2 rounded border border-zinc-700" 
        required 
      />
      
      <button 
        type="submit" 
        className="w-full bg-emerald-900 hover:bg-emerald-800 text-emerald-400 transition-colors p-2 rounded font-bold uppercase"
      >
        Enroll Node
      </button>

      {/* 🛡️ DYNAMIC RESPONSE TERMINAL */}
      {formMessage && (
        <div className="text-xs p-2 bg-zinc-950 border border-zinc-800 text-emerald-500 rounded">
          {formMessage}
        </div>
      )}
    </form>
  );
}