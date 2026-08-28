// app/launchpad/page.tsx
import FaucetClaim from '../components/FaucetClaim'; // 🛡️ MESH-PATCH: Adjusted for app-level nesting

export default function LaunchpadSector() {
  return (
    <main className="min-h-screen bg-black text-green-500 p-8 font-mono selection:bg-green-900">
      <header className="max-w-3xl mx-auto mb-10 border-b border-green-700 pb-4">
        <h1 className="text-3xl font-bold tracking-widest text-white">REPUBLIC LAUNCHPAD</h1>
        <p className="text-sm text-gray-400 mt-2">
          Sector Status: <span className="text-green-400">SECURE</span> | Node: Active
        </p>
      </header>

      <section className="max-w-3xl mx-auto">
        <div className="mb-6 p-4 border border-gray-800 bg-gray-950 rounded">
          <h2 className="text-lg font-bold text-gray-300 mb-2">GENESIS DISTRIBUTION</h2>
          <p className="text-sm text-gray-500">
            Real Pioneers may claim their initial mBZR allocation here. 
            The MESH will enforce a strict one-claim-per-UID protocol via the MongoDB Ledger.
          </p>
        </div>

        {/* 🛡️ MESH-LOCK: Pre-Flight Activation Manual */}
        <details className="group border border-gray-700 bg-gray-900 rounded-lg p-4 mb-8 transition-all duration-300">
          <summary className="flex cursor-pointer items-center justify-between font-bold text-green-400 focus:outline-none">
            <span className="flex items-center gap-2">
              <span>🛠️</span> 
              <span>PRE-FLIGHT CHECK: Activate mBZR in Wallet</span>
            </span>
            <span className="transition-transform duration-300 group-open:rotate-180">
              <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20">
                <path d="M6 9l6 6 6-6"></path>
              </svg>
            </span>
          </summary>
          
          <div className="mt-4 text-sm text-gray-300 space-y-4 border-t border-gray-700 pt-4">
            <div>
              <p className="font-bold text-gray-100 mb-1">PHASE 1: THE VIEWPORT IGNITION</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Open your <strong>wallet.pi</strong> inside the Pi Browser and unlock your vault.</li>
                <li>Ensure the network toggle at the top is strictly set to <strong className="text-yellow-400">Pi Testnet</strong>.</li>
              </ol>
            </div>

            <div>
              <p className="font-bold text-gray-100 mb-1">PHASE 2: THE ASSET SEARCH</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Click the <strong>Token icon</strong> located at the right lower sector of the screen.</li>
                <li>Scroll down and click <strong>Add Tokens</strong>.</li>
                <li>Select <strong>More tokens</strong> to access the global registry.</li>
                <li>In the search box, strictly type: <code className="bg-black text-green-400 px-1.5 py-0.5 rounded font-mono">Mbzr</code></li>
              </ol>
            </div>

            <div>
              <p className="font-bold text-gray-100 mb-1">PHASE 3: THE ACTIVATION</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Locate the <code className="bg-black text-green-400 px-1.5 py-0.5 rounded font-mono">mBZR</code> asset (you will see the official Bazaar Logo).</li>
                <li>Click the <strong>Enable</strong> button next to the asset.</li>
                <li>Strike <strong>Confirm</strong> to lock in the changes, then close the menu.</li>
                <li>Verify that mBZR now visibly populates in your main wallet dashboard.</li>
              </ol>
            </div>
          </div>
        </details>

        {/* 🛡️ INJECTING THE FAUCET ENGINE */}
        <FaucetClaim />
        
      </section>
    </main>
  );
}