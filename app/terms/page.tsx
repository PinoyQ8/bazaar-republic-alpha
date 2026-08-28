import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="relative min-h-screen bg-black text-slate-300 p-6 md:p-12 font-sans pb-24 overflow-hidden selection:bg-blue-500 selection:text-black">
      {/* 🔒 SUB-SURFACE SECURITY WATERMARK */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none select-none flex flex-col items-center justify-center overflow-hidden z-0 opacity-[0.025] space-y-32"
      >
        <div className="text-[14vw] font-black tracking-[0.25em] text-white uppercase transform -rotate-12 whitespace-nowrap">
          BAZAAR REPUBLIC
        </div>
        <div className="text-[8vw] font-mono font-bold tracking-[0.3em] text-blue-500 uppercase transform -rotate-12 whitespace-nowrap">
          DECENTRALIZED DAO MESH
        </div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto space-y-8">
        {/* 🛰️ HEADER NAVIGATION & PROTOCOL BADGE */}
        <div className="flex justify-between items-center border-b border-slate-900 pb-4">
          <Link
            href="/"
            className="text-blue-500 text-xs font-mono uppercase tracking-widest hover:text-blue-400 transition-colors"
          >
            &lt; RETURN TO COMMAND HUB
          </Link>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
            <span>DOC-ID: BZR-TERMS-2026-V2.3</span>
          </div>
        </div>

        {/* 📜 DOCUMENT HEADER */}
        <div className="border-b border-slate-800 pb-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold tracking-[0.2em] text-slate-100 uppercase">
              The Terms of the Republic
            </h1>
          </div>
          <div className="flex flex-wrap gap-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            <span className="text-blue-500/90 font-semibold">STATUS: MAINNET READY</span>
            <span>•</span>
            <span>LAST SYNC: AUGUST 27, 2026</span>
            <span>•</span>
            <span>NETWORK: PI MAINNET PROTOCOL V23</span>
          </div>
        </div>

        {/* 🔐 PASS-PHRASE SECURITY & ZERO-CUSTODY SHIELD */}
        <section className="p-4 rounded border border-blue-500/30 bg-blue-950/10 space-y-2 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest font-mono">
              1. Non-Custodial Declaration & Credential Ownership
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            Bazaar Republic is entirely non-custodial. We <strong>never</strong> ask for, hold, access, or recover your 24-word Pi Wallet Passphrase. You maintain complete, unilateral ownership of your private keys. All transaction authorizations occur exclusively through the client-side Pi Browser interface.
          </p>
        </section>

        {/* ⚖️ SECTION 2: ACCEPTANCE OF THE MESH */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-blue-500 uppercase tracking-widest font-mono">
            2. Acceptance & Node Registration
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            By authenticating with your Pi Network account, verifying your app-scoped UID, and interacting with the Bazaar Republic platform, you enter into a binding agreement with the DAO and consent to the operational parameters established across the MESH. If you do not accept these terms, you must disconnect from the platform immediately.
          </p>
        </section>

        {/* ⚖️ SECTION 3: ECOSYSTEM INTEGRITY & PI POLICY */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-blue-500 uppercase tracking-widest font-mono">
            3. Pi Network Ecosystem Utility & Rules of Engagement
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            All users and Pioneers agree to utilize Bazaar Republic exclusively for legitimate peer utility, decentralized coordination, digital commerce, and governance. The following actions are strictly prohibited:
          </p>
          <ul className="list-disc pl-5 text-sm leading-relaxed text-slate-400 space-y-2 marker:text-blue-500/60">
            <li>Unauthorized fiat-to-Pi off-ramping or prohibited speculative transactions outside Pi Core Team rules.</li>
            <li>Sybil attacks, automated script forgery, or memo spoofing designed to bypass payment verification gates.</li>
            <li>Exploiting platform consensus logic or attacking E-Network infrastructure.</li>
          </ul>
        </section>

        {/* ⚖️ SECTION 4: THE INCINERATION ENGINE & LEDGER FINALITY */}
        <section className="space-y-4 border-l-2 border-red-900 pl-4 py-2 bg-red-950/10">
          <h2 className="text-sm font-bold text-red-500 uppercase tracking-widest font-mono">
            4. The Incineration Engine & On-Chain Finality
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            The Republic employs programmatic deflationary mechanisms to regulate scarcity across the DAO. Interacting with the &quot;Exit Republic&quot; or &quot;Incinerate&quot; logic permanently burns designated micro-units (<code className="text-red-400 font-mono text-xs">mBZR</code>).
          </p>
          <p className="text-xs font-mono text-red-400 mt-2">
            [IMMUTABILITY NOTICE]: On-chain Pi ledger transfers, fees, and incineration events verified on the Stellar Consensus Protocol are atomic and mathematically irreversible. No developer, validator, or founder can alter or refund verified ledger executions.
          </p>
        </section>

        {/* ⚖️ SECTION 5: SERVICE AVAILABILITY & LIABILITY */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-blue-500 uppercase tracking-widest font-mono">
            5. Alpha Sector Stability & Limitation of Liability
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Bazaar Republic operates under an active development protocol targeting a 92% Uptime Shield. Service availability remains contingent on Pi Network Mainnet upgrades, Stellar Horizon sync stability, and edge network routing. Bazaar Republic, the Bazaar Founder, and contributing developers assume no liability for third-party consensus delays, network partitions, or client-side key mismanagement.
          </p>
        </section>

        {/* ⚖️ SECTION 6: DAO EVOLUTION */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-blue-500 uppercase tracking-widest font-mono">
            6. DAO Governance & Protocol Evolution
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Platform parameters, manual revisions, and governance tiers are continuously refined via decentralized consensus and security audits. Continued operation of your node within the ecosystem constitutes acceptance of updated logic sets.
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
                AUTHORIZED MESH PROTOCOL • DECENTRALIZED AUTONOMOUS REPOSITORY
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-blue-500 hover:text-blue-400 underline underline-offset-4 tracking-wider">
                PRIVACY PROTOCOL
              </Link>
            </div>
          </div>

          <div className="p-2 bg-slate-950/80 border border-slate-900 rounded font-mono text-[9px] text-slate-600 flex justify-between items-center">
            <span>HASH: 0x975417eb...8dbbb11c</span>
            <span className="text-blue-500/60 font-bold">PI MAINNET READY</span>
          </div>
        </footer>
      </div>
    </main>
  );
}