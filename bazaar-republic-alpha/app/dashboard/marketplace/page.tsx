// Location: app/dashboard/marketplace/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PioneerAuthGate from "@/app/components/PioneerAuthGate";
// 🛡️ ADJUDICATOR FIX: Added seedVirtualMarket to the import payload
import { getActiveListings, createMarketListing, executeMarketTransaction, seedVirtualMarket } from "@/app/actions/marketActions";
import { ShieldCheck, Server, Cpu, Briefcase, Zap, Lock } from "lucide-react";

interface IMarketListing {
  listingId: string;
  providerId: string;
  title: string;
  description: string;
  serviceCategory: 'COMPUTE' | 'DIGITAL_ASSET' | 'NODE_HOSTING' | 'CONSULTING';
  pricePi: number;
  requiredCollateral: number;
  status: string;
}

export default function MarketplaceViewport() {
  const router = useRouter();
  const [session, setSession] = useState<{ username: string; uid: string } | null>(null);
  const [listings, setListings] = useState<IMarketListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [isPiBrowser, setIsPiBrowser] = useState(true); 
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "", description: "", category: "COMPUTE", pricePi: 10, requiredCollateral: 50
  });

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const inPi = ua.includes("PiBrowser");
    const isLocalDev = process.env.NODE_ENV === "development";
    setIsPiBrowser(inPi || isLocalDev);

    const storedAuth = localStorage.getItem("pi_auth_user");
    const authData = storedAuth ? JSON.parse(storedAuth) : { username: "PinoyQ8_Dev", uid: "PinoyQ8_Dev" };
    setSession(authData);
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      const data = await getActiveListings();
      setListings(data);
    } catch (error) {
      console.error("[MESH-MARKET] Sync Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.uid || !isPiBrowser) return; 
    setIsLoading(true);
    setStatusMsg("Authenticating Collateral Bounds...");

    const res = await createMarketListing(
      session.uid,
      formData.title,
      formData.description,
      formData.category as any,
      Number(formData.pricePi),
      Number(formData.requiredCollateral)
    );

    if (res.success) {
      setStatusMsg(`✅ ${res.message}`);
      setShowForm(false);
      await fetchMarketData();
    } else {
      setStatusMsg(`🚨 ${res.message}`);
      setIsLoading(false);
    }
  };

  const handlePurchase = async (merchantId: string, price: number) => {
    if (!session?.uid) return;
    setIsLoading(true);
    setStatusMsg("🛡️ Executing Zero-Trust Subsidy & Sandbox Payment...");

    const res = await executeMarketTransaction(session.uid, merchantId, price);
    
    // 🛡️ ADJUDICATOR FIX: Typecast payload to safely bypass strict TS checking on receipt object
    const payload = res as any;
    
    if (payload.success && payload.receipt) {
      setStatusMsg(`✅ SANDBOX TX SECURED: Paid ${payload.receipt.buyerPaid.toFixed(2)} Pi. (DAO Subsidy Applied: -${payload.receipt.discountApplied.toFixed(2)} Pi)`);
    } else {
      setStatusMsg(`🚨 TX REJECTED: ${res.message}`);
    }
    setIsLoading(false);
    await fetchMarketData(); 
  };

  // 🛡️ ADJUDICATOR FIX: Virtual Market Seeder Logic implementation
  const handleSeedMarket = async () => {
    setIsLoading(true);
    setStatusMsg("Seeding Virtual Market & Test Nodes...");
    const res = await seedVirtualMarket();
    if (res.success) {
      setStatusMsg(`✅ ${res.message}`);
      await fetchMarketData();
    } else {
      setStatusMsg(`🚨 SEED FRACTURE: ${res.message}`);
    }
    setIsLoading(false);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'COMPUTE': return <Server className="w-4 h-4 text-blue-400" />;
      case 'NODE_HOSTING': return <Cpu className="w-4 h-4 text-emerald-400" />;
      case 'CONSULTING': return <Briefcase className="w-4 h-4 text-amber-400" />;
      default: return <Zap className="w-4 h-4 text-purple-400" />;
    }
  };

  if (isLoading && listings.length === 0) {
    return (
      <div className="min-h-screen bg-black text-amber-500 font-mono flex flex-col items-center justify-center space-y-4">
        <div className="animate-pulse text-2xl font-bold tracking-widest">SYNCING E-NETWORK...</div>
      </div>
    );
  }

  return (
    <PioneerAuthGate>
      <div className="min-h-screen bg-black text-neutral-300 font-mono p-4 md:p-8 space-y-6 pb-24">
        
        {/* 🛰️ HEADER MATRIX */}
        <header className="border-b border-amber-900/60 pb-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-amber-500" />
              <h1 className="text-xl font-bold tracking-tight text-amber-500 uppercase">
                Service Provider Marketplace
              </h1>
            </div>
            <button 
              onClick={() => router.push('/dashboard')}
              className="text-xs px-3 py-1 bg-neutral-900 border border-neutral-700 rounded text-neutral-400 hover:text-amber-400 transition-colors"
            >
              DASHBOARD
            </button>
          </div>
          <p className="text-xs text-neutral-500 uppercase tracking-widest flex items-center justify-between">
            <span>Zero-Trust Subsidies Active • High TS Yields Lower Tax</span>
            {!isPiBrowser && <span className="text-red-500 font-bold flex items-center gap-1"><Lock className="w-3 h-3"/> READ-ONLY MODE</span>}
          </p>
        </header>

        {/* 📢 TELEMETRY FEEDBACK */}
        {statusMsg && (
          <div className="p-3 bg-neutral-900 border border-amber-600/60 text-amber-400 text-xs rounded shadow-[0_0_10px_rgba(217,119,6,0.2)]">
            {statusMsg}
          </div>
        )}

        {/* ➕ ACTION BAR: Includes new Virtual Seeder UI */}
        <div className="flex justify-end gap-2">
          <button 
            onClick={handleSeedMarket}
            disabled={isLoading}
            className="px-3 py-1 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/60 text-amber-400 font-bold text-xs uppercase tracking-widest rounded transition-all shadow-[0_0_10px_rgba(217,119,6,0.2)] disabled:opacity-30"
          >
            ⚡ SEED VIRTUAL MARKET
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={!isPiBrowser} 
            className="px-4 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700 text-emerald-400 font-bold text-xs uppercase tracking-widest rounded transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {showForm ? "CANCEL LISTING" : "+ CREATE SERVICE LISTING"}
          </button>
        </div>

        {/* 📝 CREATE LISTING FORM */}
        {showForm && isPiBrowser && (
          <form onSubmit={handleCreateSubmit} className="p-4 bg-neutral-900/80 border border-emerald-900/50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-500 uppercase tracking-widest">Service Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black border border-neutral-800 p-2 text-xs rounded focus:border-emerald-500 focus:outline-none" placeholder="e.g., Pi Node VM Hosting" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-500 uppercase tracking-widest">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-black border border-neutral-800 p-2 text-xs rounded focus:border-emerald-500 focus:outline-none text-neutral-300">
                  <option value="COMPUTE">Compute Resource</option>
                  <option value="NODE_HOSTING">Node Hosting</option>
                  <option value="DIGITAL_ASSET">Digital Asset / API</option>
                  <option value="CONSULTING">Consulting / Logic Forge</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-500 uppercase tracking-widest">Price (Pi)</label>
                <input required type="number" min="1" value={formData.pricePi} onChange={e => setFormData({...formData, pricePi: Number(e.target.value)})} className="w-full bg-black border border-neutral-800 p-2 text-xs rounded focus:border-emerald-500 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-500 uppercase tracking-widest">Required Collateral (Pi)</label>
                <input required type="number" min="0" value={formData.requiredCollateral} onChange={e => setFormData({...formData, requiredCollateral: Number(e.target.value)})} className="w-full bg-black border border-neutral-800 p-2 text-xs rounded focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-500 uppercase tracking-widest">Service Description</label>
              <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-black border border-neutral-800 p-2 text-xs rounded h-20 focus:border-emerald-500 focus:outline-none" placeholder="Detail your service parameters..."></textarea>
            </div>
            <button type="submit" disabled={isLoading} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs uppercase tracking-widest rounded disabled:opacity-50">
              DEPLOY TO E-NETWORK
            </button>
          </form>
        )}

        {/* 🛒 ACTIVE LISTINGS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.length === 0 && !isLoading && (
            <div className="col-span-full p-8 border border-neutral-800 bg-neutral-900/30 rounded text-center text-xs text-neutral-500 tracking-widest uppercase">
              No Active Services Detected on the E-Network.
            </div>
          )}
          
          {listings.map((item) => (
            <div key={item.listingId} className="bg-neutral-900/40 border border-neutral-800 rounded flex flex-col justify-between hover:border-amber-900/50 transition-colors">
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(item.serviceCategory)}
                    <span className="text-[10px] text-neutral-500 tracking-widest">{item.serviceCategory}</span>
                  </div>
                  <span className="text-xs font-bold text-amber-500">{item.pricePi} Pi</span>
                </div>
                
                <div>
                  <h3 className="text-sm font-bold text-neutral-200">{item.title}</h3>
                  <p className="text-[10px] text-neutral-500 mt-1">Provider: <span className="text-blue-400">{item.providerId}</span></p>
                </div>
                
                <p className="text-xs text-neutral-400 line-clamp-3 bg-black/40 p-2 rounded border border-neutral-800/50">
                  {item.description}
                </p>
                
                <div className="flex justify-between items-center text-[10px] text-neutral-500 pt-2 border-t border-neutral-800">
                  <span>Collateral Lock: {item.requiredCollateral} Pi</span>
                  {/* 🛡️ ADJUDICATOR FIX: Safe split for listing IDs */}
                  <span>ID: {item.listingId?.split('-')[1] || item.listingId}</span>
                </div>
              </div>
              
              <button 
                onClick={() => handlePurchase(item.providerId, item.pricePi)}
                disabled={session?.uid === item.providerId || isLoading}
                className={`w-full py-2.5 border-t border-neutral-800 text-xs font-bold uppercase tracking-widest transition-colors ${
                  session?.uid === item.providerId
                    ? 'bg-neutral-900 text-neutral-500 cursor-not-allowed'
                    : 'bg-neutral-800 hover:bg-amber-900/80 text-amber-500'
                }`}
              >
                {session?.uid === item.providerId ? 'YOUR LISTING' : '⚡ EXECUTE SANDBOX CONTRACT'}
              </button>
            </div>
          ))}
        </div>

      </div>
    </PioneerAuthGate>
  );
}