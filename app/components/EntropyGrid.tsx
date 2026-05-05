// Path: J:\Project-Bazaar\bazaar-republic-alpha\app\components\EntropyGrid.tsx

import React from 'react';

// 1. The Strict-Type Handshake: Define the incoming data payload
interface EntropyGridProps {
  words: string[];
}

// 2. The Functional Component
export default function EntropyGrid({ words }: EntropyGridProps) {
  // 3. The Fallback Shield: If the array is missing, render nothing to prevent a crash
  if (!words || words.length === 0) {
    return <div className="text-red-500 text-sm">Adjudicator: Entropy data missing.</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-4">
      {words.map((word: string, index: number) => (
        <div 
          key={index} 
          className="flex items-center p-2 border border-blue-500/30 bg-black/50 rounded shadow-inner"
        >
          <span className="text-blue-400/50 mr-2 text-xs">{index + 1}</span>
          <span className="text-white text-sm font-mono break-all truncate">
            {word}
          </span>
        </div>
      ))}
    </div>
  );
}