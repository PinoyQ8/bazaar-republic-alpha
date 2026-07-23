'use client';

import { useState, useEffect, useMemo } from "react";
import { getActiveProviders } from "@/app/actions/enetworkActions";
import { ProviderList, type ProviderNode } from "@/app/components/ProviderList";
import { Header } from "@/app/components/layout/Header";
import { ProviderLoadingShell } from "@/app/components/ProviderLoadingShell";
import MeshStaking from '@/components/MeshStaking';
import PioneerAuthGate from '@/components/PioneerAuthGate';
import ENetworkConsole from '@/components/ENetworkConsole';

export default function Dashboard() {
  const [pioneerIdentity, setPioneerIdentity] = useState<string | null>(null);
  // NEW: State to track if the Pioneer has locked their liquidity
  const [isStaked, setIsStaked] = useState<boolean>(false); 
  const [mappedProviders, setMappedProviders] = useState<ProviderNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 📡 Client-Side State Synchronization Loop
  useEffect(() => {
    async function loadNetworkData() {
      try {
        const rawProviders = await getActiveProviders();
        const mapped: ProviderNode[] = rawProviders.map((raw: any) => ({
          id: raw.id,
          pioneer: raw.username || "Unknown Pioneer", 
          service: "E-Network Node", 
          rate: "Standard Base",     
          status: "VERIFIED",        
          trustScore: 100
        }));
        setMappedProviders(mapped);
      } catch (err) {
        console.error("DATA_LOAD_FRACTURE:", err);
      } finally {
        setLoading(false);
      }
    }
    loadNetworkData();
  }, []);

  const handleIdentityLink = (pioneerId: string) => {
    setPioneerIdentity(pioneerId);
  };

  // NEW: Handler for successful staking confirmation
  const handleStakingConfirmation = () => {
    setIsStaked(true);
  };

  const operatorHUD = useMemo(() => {
    if (!pioneerIdentity) return null;
    return (
      <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-lg p-2 text-center text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
        [ SECURE SESSION ACTIVE // OPERATOR: {pioneerIdentity} ]
      </div>
    );
  }, [pioneerIdentity]);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-amber-500 font-mono w-full max-w-[384px] mx-auto border-x border-neutral-800 shadow-2xl relative overflow-hidden">
      
      <Header />
      
      <main className="flex-1 overflow-y-auto pt-28 pb-24 scrollbar-hide px-3 flex flex-col justify-start">
        
        {!pioneerIdentity ? (
          /* PHASE 01: IDENTITY TIMEOUT - STANDBY GATEWAY ACTIVE */
          <div className="w-full my-auto animate-fadeIn">
            <PioneerAuthGate onLinkEstablished={handleIdentityLink} />
          </div>
        ) : !isStaked ? (
          /* PHASE 02: IDENTITY VERIFIED, AWAITING LIQUIDITY SHIELD */
          <div className="w-full my-auto animate-fadeIn space-y-6">
            {operatorHUD}
            <div className="text-center text-xs text-red-500 font-bold tracking-widest border border-red-900/50 bg-red-950/20 p-2 rounded">
              LIQUIDITY LOCK REQUIRED
            </div>
            <MeshStaking onStakeSuccess={handleStakingConfirmation} />
          </div>
        ) : (
          /* PHASE 03: FULL CORE ACCESS UNLOCKED (Identity + Liquidity Verified) */
          <div className="w-full space-y-6 animate-fadeIn">
            
            {operatorHUD}

            {/* SIMULATION MONITOR: MULTI-SECTOR CONTROL CONSOLE */}
            <section className="w-full">
              <ENetworkConsole />
            </section>

            {/* LEDGER FEED: ACTIVE PEER REGISTRY STREAM */}
            <section className="w-full">
              <h3 className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2 px-1 font-bold">
                Registered Peer Network
              </h3>
              {loading ? (
                <ProviderLoadingShell />
              ) : (
                <ProviderList providers={mappedProviders} />
              )}
            </section>

          </div>
        )}

      </main>
    </div>
  );
}