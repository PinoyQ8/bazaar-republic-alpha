"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProviderNode = {
  id: string;
  username: string;
  rate: number;
};

export default function ProfileActionPanel({ node }: { node: ProviderNode }) {
  const [isDeploying, setIsDeploying] = useState(false);
  const router = useRouter();

  const handleInitiateContract = async () => {
    setIsDeploying(true);
    console.log(`[MESH-BRIDGE] Initializing contract handshake for node: ${node.id}`);
    
    // Route the consumer directly to the contract deployment form with parameters
    router.push(`/e-network/contract/deploy?providerId=${node.id}&rate=${node.rate}&name=${node.username}`);
  };

  return (
    <div className="pt-4 flex flex-col sm:flex-row gap-3 w-full">
      <button
        onClick={handleInitiateContract}
        disabled={isDeploying}
        className={`flex-1 font-bold py-3 px-4 rounded transition-colors uppercase tracking-wider text-black ${
          isDeploying 
            ? "bg-zinc-600 cursor-not-allowed" 
            : "bg-emerald-600 hover:bg-emerald-500"
        }`}
      >
        {isDeploying ? "Deploying Handshake..." : "Initiate Smart Contract"}
      </button>
      
      <button 
        onClick={() => router.push("/e-network/dashboard")}
        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-center font-bold py-3 px-4 rounded transition-colors uppercase tracking-wider"
      >
        Return to Dashboard
      </button>
    </div>
  );
}