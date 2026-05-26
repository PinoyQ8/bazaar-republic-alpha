"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// 🛡️ INGEST THE GENESIS BRIDGE COMPONENTS
import { usePiAuth, PiAuthBridge } from "@/app/components/mesh/PiAuthBridge";

/**
 * 🛡️ MASTER GATEWAY WRAPPER
 * This ensures the background build workers compile the page safely within context boundaries.
 */
export default function SecurityTraining() {
  return (
    <PiAuthBridge>
      <SecurityTrainingContent />
    </PiAuthBridge>
  );
}

/**
 * 🛡️ ACTIVE TERMINAL LOGIC
 * Safely executes hooks now that context guarantees a steady upstream provider signal.
 */
function SecurityTrainingContent() {
  const [mounted, setMounted] = useState(false);
  const [activePioneer, setActivePioneer] = useState<string | null>(null);
  const [currentModule, setCurrentModule] = useState(0);
  const router = useRouter();
  
  // Safe Context Hook Injection
  const { pioneer, isAuthenticated } = usePiAuth();

  // 🛡️ SECURITY SYNC
  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated || !pioneer) {
      router.push("/");
    } else {
      setActivePioneer(pioneer.username);
    }
  }, [isAuthenticated, pioneer, router]);

  if (!mounted || !activePioneer) return null;

  const trainingData = [
    {
      id: "MESH-01",
      title: "The MESH Architecture",
      content: "The MESH Protocol is a decentralized security layer where every Pioneer acts as an Adjudicator. Unlike legacy systems, the MESH relies on peer-to-peer verification and localized 'Logic Gates' to prevent centralized failure.",
      task: "Verify: Do you accept the responsibility of the MESH Adjudicator?"
    },
    {
      id: "VAULT-02",
      title: "Seed Phrase Integrity",
      content: "Your Seed Phrase is the master key to your Republic identity. It is NEVER to be typed into any prompt ending in .txt, .exe, or unverified browser extensions. Bazaar Republic staff will NEVER request your passphrase.",
      task: "Analyze: Where should your Seed Phrase be stored?"
    },
    {
      id: "SOCIAL-03",
      title: "Security Circle Defense",
      content: "The first 10 citizens are the 'Moral Anchor.' Malicious actors will attempt to impersonate pioneers to breach the Security Circle. If an identity cannot be verified through a MESH-SCAN, it is a statistical mirage.",
      task: "Protocol: How do you treat an unverified node requesting access?"
    }
  ];

  const nextModule = () => {
    if (currentModule < trainingData.length - 1) {
      setCurrentModule(prev => prev + 1);
    } else {
      localStorage.setItem(`MESH_SECURITY_${activePioneer}`, "CERTIFIED");
      router.push("/academy");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen">
      
      {/* 🛡️ NAVIGATION & PROGRESS */}
      <div className="flex justify-between items-center mb-8">
        <Link href="/academy" className="text-xs font-mono text-slate-500 hover:text-blue-400 transition-colors uppercase tracking-widest">
          &larr; Back to Academy
        </Link>
        <div className="text-right">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Progress</p>
          <div className="flex gap-1 mt-1">
            {trainingData.map((_, idx) => (
              <div key={idx} className={`h-1 w-8 rounded-full ${idx <= currentModule ? 'bg-blue-600' : 'bg-slate-800'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* 🛡️ THE TRAINING TERMINAL */}
      <main className="relative group">
        <div className="absolute -inset-0.5 bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl blur-xs opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          
          <div className="flex items-center gap-3 mb-6">
            <span className="px-2 py-1 rounded-sm bg-blue-900/30 text-blue-500 font-mono text-[10px] border border-blue-900/50">
              {trainingData[currentModule].id}
            </span>
            <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
              {trainingData[currentModule].title}
            </h1>
          </div>

          <p className="text-slate-300 text-lg font-light leading-relaxed mb-10">
            {trainingData[currentModule].content}
          </p>

          <div className="border-t border-slate-900 pt-8 mt-8">
            <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">LOGIC CHECK: {trainingData[currentModule].task}</h3>
            
            <div className="space-y-3">
              <button 
                onClick={nextModule}
                className="w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-blue-900/10 hover:border-blue-700/50 text-slate-400 hover:text-blue-300 transition-all group/btn"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-mono uppercase tracking-widest">Acknowledge & Sync</span>
                  <span className="opacity-0 group-hover/btn:opacity-100 transition-opacity text-blue-500">→</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 🛡️ SECURITY FOOTER */}
      <footer className="mt-8 text-center">
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
          Secured by MESH Protocol v23 Alpha Node
        </p>
      </footer>

    </div>
  );
}