import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen bg-black text-slate-300 p-6 md:p-12 font-sans pb-24 overflow-hidden selection:bg-green-500 selection:text-black">
      {/* 🔒 SUB-SURFACE SECURITY WATERMARK */}
      <div 
        aria-hidden="true" 
        className="fixed inset-0 pointer-events-none select-none flex flex-col items-center justify-center overflow-hidden z-0 opacity-[0.025] space-y-32"
      >
        <div className="text-[14vw] font-black tracking-[0.25em] text-white uppercase transform -rotate-12 whitespace-nowrap">
          BAZAAR REPUBLIC
        </div>
        <div className="text-[8vw] font-mono font-bold tracking-[0.3em] text-green-500 uppercase transform -rotate-12 whitespace-nowrap">
          NON-CUSTODIAL MESH
        </div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto space-y-8">
        {/* 🛰️ HEADER NAVIGATION & PROTOCOL BADGE */}
        <div className="flex justify-between items-center border-b border-slate-900 pb-4">
          <Link
            href="/"
            className="text-green-500 text-xs font-mono uppercase tracking-widest hover:text-green-400 transition-colors"
          >
            &lt; RETURN TO COMMAND HUB
          </Link>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
            <span>DOC-ID: BZR-PRIV-2026-V2.3</span>
          </div>
        </div>

        {/* 🛡️ DOCUMENT HEADER */}
        <div className="border-b border-slate-800 pb-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold tracking-[0.2em] text-slate-100 uppercase">
              The Privacy Protocol
            </h1>
          </div>
          <div className="flex flex-wrap gap-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            <span className="text-green-500/90 font-semibold">STATUS: MAINNET READY</span>
            <span>•</span>
            <span>LAST SYNC: AUGUST 27, 2026</span>
            <span>•</span>
            <span>ENCRYPTION: HORIZON/STELLAR SCP</span>
          </div>
        </div>

        {/* 🔐 ZERO-CUSTODY SHIELD (CRITICAL FOR REVIEWERS) */}
        <section className="p-4 rounded border border-green-500/30 bg-green-950/10 space-y-2 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="text-xs font-bold text-green-400 uppercase tracking-widest font-mono">
              1. Non-Custodial Architecture & Passphrase Shield
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            Bazaar Republic operates on a strictly non-custodial framework. We <strong>never</strong> request, access, collect, process, or store your 24-word Pi Wallet Passphrase or private signing keys. All transaction signatures are authorized directly and exclusively within the official, client-side Pi Browser environment.
          </p>
        </section>

        {/* ⚖️ SECTION 2: DATA WE VAULT */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-green-500 uppercase tracking-widest font-mono">
            2. Minimal Telemetry & Vault Data
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            The Republic enforces absolute data minimalism. We only record parameters strictly required to establish node routing and verify peer utility through the official Pi Network SDK:
          </p>
          <ul className="list-disc pl-5 text-sm leading-relaxed text-slate-400 space-y-2 marker:text-green-500/60">
            <li>
              <strong>Pioneer App UID:</strong> Application-scoped identifier to authenticate your decentralized session without accessing personal credentials.
            </li>
            <li>
              <strong>Pi Username:</strong> Displayed on the public ledger and community governance rosters.
            </li>
            <li>
              <strong>Public Wallet Address (<code className="text-green-400 font-mono text-xs">G...</code>):</strong> To route App-to-User (A2U) rewards, verify User-to-App (U2A) transactions, and validate DAO tier status.
            </li>
            <li>
              <strong>Transaction Metadata:</strong> Stellar ledger Transaction IDs (TXIDs), payment identifiers, and settlement timestamps to maintain verified payment states.
            </li>
          </ul>
        </section>

        {/* ⚖️ SECTION 3: DATA UTILIZATION */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-green-500 uppercase tracking-widest font-mono">
            3. Operational Utilization (The Logic Forge)
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Vaulted data is used solely to power decentralized platform features: completing the bidirectional payment handshake, computing ecosystem TrustScores, preventing Sybil attacks, and displaying verified macroeconomic statistics across the DAO.
          </p>
        </section>

        {/* ⚖️ SECTION 4: THIRD PARTIES & ISOLATION */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-green-500 uppercase tracking-widest font-mono">
            4. Isolation & Zero Commercial Profiling
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            We do not sell, rent, monetize, or disclose your UID, username, or wallet address to third-party ad networks or data brokers. All external interactions are restricted to official Pi Platform API endpoints (<code className="text-slate-200 font-mono text-xs">api.minepi.com</code>) and Horizon testnet/mainnet consensus nodes.
          </p>
        </section>

        {/* ⚖️ SECTION 5: PURGE PROTOCOL */}
        <section className="space-y-4 border-l-2 border-slate-700 pl-4 py-2">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest font-mono">
            5. The Purge Protocol & Ledger Immutability
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Citizens may disconnect and purge their off-chain session data from the Republic&apos;s NoSQL Vault at any time by revoking access or initiating the exit routine.
          </p>
          <p className="text-xs italic text-slate-500 mt-2">
            Notice: Verified on-chain transactions broadcasted to the Pi Stellar Consensus Protocol are cryptographically permanent and immutable by design. On-chain settlement records cannot be altered, forged, or deleted.
          </p>
        </section>

        {/* 📜 COPYRIGHT & IMMUTABLE LEGAL FOOTER */}
        <footer className="pt-10 mt-12 border-t border-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[11px] font-mono text-slate-500">
            <div>
              <p className="text-slate-400 font-semibold tracking-wider">
                © 2026 BAZAAR REPUBLIC DAO. ALL RIGHTS RESERVED.
              </p>
              <p className="text-[10px] text-slate-600 mt-0.5 tracking-tight">
                AUTHENTICATED MESH ARCHITECTURE • DECENTRALIZED AUTONOMOUS REPOSITORY
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="text-green-500 hover:text-green-400 underline underline-offset-4 tracking-wider">
                TERMS OF SERVICE
              </Link>
            </div>
          </div>

          <div className="p-2 bg-slate-950/80 border border-slate-900 rounded font-mono text-[9px] text-slate-600 flex justify-between items-center">
            <span>HASH: 0x8dbbb11cf8...ce66513c</span>
            <span className="text-green-500/60 font-bold">PI MAINNET READY</span>
          </div>
        </footer>
      </div>
    </main>
  );
}