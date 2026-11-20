import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen bg-black text-slate-300 p-6 md:p-12 font-sans pb-24 overflow-hidden selection:bg-green-500 selection:text-black">
      {/* SUB-SURFACE SECURITY WATERMARK */}
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
        {/* HEADER NAVIGATION & PROTOCOL BADGE */}
        <div className="flex justify-between items-center border-b border-slate-900 pb-4">
          <Link
            href="/"
            className="text-green-500 text-xs font-mono uppercase tracking-widest hover:text-green-400 transition-colors"
          >
            {"<"} RETURN TO COMMAND HUB
          </Link>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            <span>DOC-ID: BZR-PRIV-2026-V2.4</span>
          </div>
        </div>

        {/* DOCUMENT HEADER */}
        <div className="border-b border-slate-800 pb-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold tracking-[0.2em] text-slate-100 uppercase">
              Privacy Policy — Bazaar Republic Alpha
            </h1>
          </div>
          <div className="flex flex-wrap gap-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            <span className="text-green-500/90 font-semibold">
              STATUS: PI HACKATHON ALPHA (TESTNET / PI SDK)
            </span>
            <span>•</span>
            <span>LAST UPDATED: NOVEMBER 20, 2026</span>
            <span>•</span>
            <span>SCOPE: PI BROWSER & SOLOHOST</span>
          </div>
        </div>

        {/* 1. NON-CUSTODIAL ARCHITECTURE */}
        <section className="p-4 rounded border border-green-500/30 bg-green-950/10 space-y-2 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            <h2 className="text-xs font-bold text-green-400 uppercase tracking-widest font-mono">
              1. Non-Custodial Architecture & Passphrase Shield
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            Bazaar Republic Alpha operates on a non-custodial model. We{" "}
            <strong>never</strong> request, collect, log, or store your 24-word Pi
            Wallet passphrase or private signing keys. Wallet signatures and
            authentication take place inside the official Pi environment.
          </p>
        </section>

        {/* 2. DATA COLLECTED */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-green-500 uppercase tracking-widest font-mono">
            2. Minimal Data & Ledger Records
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            We collect only the minimum information required to authenticate
            Pioneers, route Pi payments and escrow states, and maintain node
            reliability:
          </p>
          <ul className="list-disc pl-5 text-sm leading-relaxed text-slate-400 space-y-2 marker:text-green-500/60">
            <li>
              <strong>App-Scoped Pioneer UID:</strong> Scoped identifier returned
              by Pi authentication to link your session to your application
              profile.
            </li>
            <li>
              <strong>Pi Username:</strong> Public display handle used for
              marketplace, node, and governance activity.
            </li>
            <li>
              <strong>Wallet Public Key / Address:</strong> Used to verify
              escrow deposits, releases, refunds, or payouts without exposing
              private secrets.
            </li>
            <li>
              <strong>Pi Payment & Transaction Identifiers:</strong> Payment
              IDs, transaction hashes (TXIDs), timestamps, and native{" "}
              <code className="text-green-400 font-mono text-xs">PI</code>{" "}
              settlement records verified via server-side Pi Platform API calls.
              Internal <code className="text-green-400 font-mono text-xs">mBZR</code>{" "}
              entries represent internal utility/governance accounting only.
            </li>
          </ul>
        </section>

        {/* 3. HOW DATA IS USED */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-green-500 uppercase tracking-widest font-mono">
            3. Operational Use & Storage
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Data is used strictly to operate Bazaar Republic Alpha features—such
            as Pioneer sign-in, <code className="text-slate-200 font-mono text-xs">PI</code>{" "}
            payment approval/completion, non-custodial escrow tracking, and node
            telemetry—stored in our application database or local SoloHost node
            environment.
          </p>
        </section>

        {/* 4. THIRD PARTIES & NO DATA BROKERING */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-green-500 uppercase tracking-widest font-mono">
            4. Zero Ad Tracking or Data Sales
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            We do not sell, rent, or broker Pioneer data to third-party ad
            networks. Payment verification communicates with official Pi Platform
            API endpoints (<code className="text-slate-200 font-mono text-xs">api.minepi.com</code>)
            and configured Pi RPC/Horizon endpoints.
          </p>
        </section>

        {/* 5. RETENTION, REMOVAL & ON-CHAIN FINALITY */}
        <section className="space-y-4 border-l-2 border-slate-700 pl-4 py-2">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest font-mono">
            5. Off-Chain Data Removal & On-Chain Finality
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Pioneers may sign out, clear local browser storage, or request
            removal of off-chain profile/session records by contacting the
            Bazaar Republic team via the repository{" "}
            <Link
              href="https://github.com/PinoyQ8/bazaar-republic-alpha"
              target="_blank"
              rel="noreferrer"
              className="text-green-400 underline underline-offset-4"
            >
              GitHub repository (PinoyQ8/bazaar-republic-alpha)
            </Link>
            .
          </p>
          <p className="text-xs italic text-slate-500 mt-2">
            Note: Transactions settled on-chain are immutable on the underlying
            ledger and cannot be altered or erased once confirmed.
          </p>
        </section>

        {/* FOOTER */}
        <footer className="pt-10 mt-12 border-t border-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[11px] font-mono text-slate-500">
            <div>
              <p className="text-slate-400 font-semibold tracking-wider">
                BAZAAR REPUBLIC ALPHA (PROJECT BAZAAR)
              </p>
              <p className="text-[10px] text-slate-600 mt-0.5 tracking-tight">
                WORKING GROUP: PINOYQ8 & BAZAAR TECH • PI NEXT HACKATHON
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/terms"
                className="text-green-500 hover:text-green-400 underline underline-offset-4 tracking-wider"
              >
                TERMS OF SERVICE
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}