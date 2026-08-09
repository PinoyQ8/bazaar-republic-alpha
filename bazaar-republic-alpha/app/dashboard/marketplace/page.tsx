// Location: app/dashboard/marketplace/page.tsx
"use client";

import { useState, useEffect } from "react";
import { getActiveListings, executeMarketTransaction, seedVirtualMarket } from "@/actions/marketActions";

export default function MarketplacePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("🛡️ MESH Connected under Protocol 26.1. Ready for zk-circuit transaction.");
  
  // 🛡️ Local development node session simulation
  const session = { uid: "local_x570_node", username: "PinoyQ8_Dev" };

  const fetchMarketData = async () => {
    const data = await getActiveListings();
    setListings(data);
  };

  useEffect(() => {
    fetchMarketData();
  }, []);

  const handlePurchase = async (merchantId: string, pricePi: number) => {
    if (!session?.uid) return;
    setIsLoading(true);
    setStatusMsg("🛡️ Executing Protocol 25.2.2 zk-Circuit Transaction...");

    const res = await executeMarketTransaction(session.uid, merchantId, pricePi);
    const payload = res as any;
    
    if (payload.success && payload.receipt) {
      setStatusMsg(
        `✅ TX SECURED: ${payload.receipt.grossTotal.toFixed(2)} mBZR TOTAL. ` +
        `Breakdown ➔ [Unit Price: ${payload.receipt.unitPrice.toFixed(2)} | ` +
        `DAO Ops: ${payload.receipt.daoOperations.toFixed(2)} | ` +
        `Shield: ${payload.receipt.republicShield.toFixed(2)} | ` +
        `e-VAT: ${payload.receipt.eVat.toFixed(2)}]`
      );
    } else {
      setStatusMsg(`🚨 TX REJECTED: ${payload.message || 'Unknown Error'}`);
    }
    
    setIsLoading(false);
    await fetchMarketData(); 
  };

  return (
    <div className="min-h-screen bg-black text-emerald-400 p-6 font-mono selection:bg-emerald-500 selection:text-black">
      
      {/* 🧭 HEADER & SEEDER ACTION BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-emerald-900 pb-6">
        <div>
          <div className="text-xs tracking-widest text-emerald-500 uppercase">PROTOCOL 26.1 // SECURE GATEWAY</div>
          <h1 className="text-2xl font-bold text-white tracking-wider mt-1">E-NETWORK MARKETPLACE</h1>
          <p className="text-xs text-emerald-600 mt-1">Quad-Ledger Taxation & zk-Circuit Verification Active</p>
        </div>
        
        {/* ⚡ THE SANDBOX SEEDER BUTTON */}
        <button
          onClick={async () => {
            setStatusMsg("🌱 Seeding Virtual Market & Injecting 1M mBZR into Node...");
            const res = await seedVirtualMarket();
            setStatusMsg(res.message);
            await fetchMarketData();
          }}
          className="bg-emerald-950/80 border border-emerald-500 text-emerald-400 hover:bg-emerald-400 hover:text-black px-4 py-2.5 rounded text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
        >
          ⚡ SEED VIRTUAL MARKET (1M mBZR)
        </button>
      </div>

      {/* 📊 REAL-TIME TELEMETRY STATUS BANNER */}
      <div className="bg-emerald-950/20 border border-emerald-800/80 p-4 rounded-lg mb-8 text-xs text-emerald-300 flex items-center gap-3">
  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
  <div>
    <span className="font-bold text-white uppercase tracking-wider">Telemetry Adjudicator:</span> {statusMsg}
  </div>
</div>

      {/* 🛍️ ACTIVE LISTINGS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {listings.length === 0 ? (
          <div className="col-span-3 text-center py-12 border border-dashed border-emerald-900/60 rounded-lg text-emerald-600 text-xs">
            NO ACTIVE LISTINGS FOUND. CLICK &quot;SEED VIRTUAL MARKET&quot; ABOVE TO POPULATE TEST NODES.
          </div>
        ) : (
          listings.map((item) => (
            <div key={item.listingId} className="bg-emerald-950/10 border border-emerald-900/60 p-5 rounded-lg flex flex-col justify-between hover:border-emerald-700/60 transition-all">
              <div>
                <div className="text-[10px] text-emerald-500 tracking-wider uppercase mb-1">
                  {item.serviceCategory} // ID: {item.listingId}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-emerald-300/70 mb-6 leading-relaxed">{item.description}</p>
              </div>
              
              <div className="border-t border-emerald-900/50 pt-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-emerald-500 uppercase">Valuation</div>
                  <div className="text-sm font-bold text-white">
                    {item.pricePi} Pi <span className="text-[10px] text-emerald-400 font-normal">({item.pricePi * 1000} mBZR)</span>
                  </div>
                </div>
                
                <button
                  disabled={isLoading}
                  onClick={() => handlePurchase(item.providerId, item.pricePi)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  ⚡ EXECUTE CONTRACT
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}