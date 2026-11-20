import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="relative min-h-screen bg-black text-slate-300 p-6 md:p-12 font-sans pb-24 overflow-hidden selection:bg-blue-500 selection:text-black">
      {/* SUB-SURFACE SECURITY WATERMARK */}
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
        {/* HEADER NAVIGATION & PROTOCOL BADGE */}
        <div className="flex justify-between items-center border-b border-slate-900 pb-4">
          <Link
            href="/"
            className="text-blue-500 text-xs font-mono uppercase tracking-widest hover:text-blue-400 transition-colors"
          >
            {"<"} RETURN TO COMMAND HUB
          </Link>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
            <span>DOC-ID: BZR-TERMS-2026-V2.4</span>
          </div>
        </div>

        {/* DOCUMENT HEADER */}
        <div className="border-b border-slate-800 pb-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold tracking-[0.2em] text-slate-100 uppercase">
              Terms of Service — Bazaar Republic Alpha
            </h1>
          </div>
          <div className="flex flex-wrap gap-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            <span className="text-blue-500/90 font-semibold">
              STATUS: PI HACKATHON ALPHA (TESTNET / PI SDK)
            </span>
            <span>•</span>
            <span>LAST UPDATED: NOVEMBER 20, 2026</span>
            <span>•</span>
            <span>STACK: PI SDK & SOROBAN PROTOCOL 28</span>
          </div>
        </div>

        {/* 1. NON-CUSTODIAL DECLARATION */}
        <section className="p-4 rounded border border-blue-500/30 bg-blue-950/10 space-y-2 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest font-mono">
              1. Non-Custodial Declaration & Credential Ownership
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            Bazaar Republic Alpha operates on a non-custodial framework. We{" "}
            <strong>never</strong> request, hold, access, or recover your 24-word
            Pi Wallet passphrase or private signing keys. Authentication and
            transaction signing take place inside the official Pi environment.
          </p>
        </section>

        {/* 2. ACCEPTANCE & ELIGIBILITY */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-blue-500 uppercase tracking-widest font-mono">
            2. Acceptance of Terms & Node Participation
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            By authenticating with your Pi account, verifying your app-scoped
            UID, or interacting with Bazaar Republic Alpha via Pi Browser or
            SoloHost, you agree to these Terms of Service. If you do not agree,
            please disconnect and refrain from using the application.
          </p>
        </section>

        {/* 3. STRICT PI DENOMINATION & ECOSYSTEM RULES */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-blue-500 uppercase tracking-widest font-mono">
            3. Native PI Settlement & Ecosystem Rules
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            All commercial transactions, payments, and escrow amounts in Bazaar
            Republic Alpha are denominated strictly in{" "}
            <code className="text-blue-400 font-mono text-xs">PI</code>.
            Internal <code className="text-blue-400 font-mono text-xs">mBZR</code>{" "}
            records serve solely as non-monetary internal utility/governance
            accounting within the application. The following actions are
            prohibited:
          </p>
          <ul className="list-disc pl-5 text-sm leading-relaxed text-slate-400 space-y-2 marker:text-blue-500/60">
            <li>
              Exchanging <code className="text-slate-200 font-mono text-xs">PI</code>{" "}
              for fiat currency or external cryptocurrencies in violation of Pi
              ecosystem rules.
            </li>
            <li>
              Attempting payment verification spoofing, Sybil abuse, or replay
              attacks against API or escrow endpoints.
            </li>
            <li>
              Interfering with node availability, smart contract operations, or
              dispute resolution workflows.
            </li>
          </ul>
        </section>

        {/* 4. ESCROW, DISPUTES & ON-CHAIN FINALITY */}
        <section className="space-y-4 border-l-2 border-amber-800 pl-4 py-2 bg-amber-950/10">
          <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest font-mono">
            4. Escrow Timelocks, Disputes & Ledger Finality
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Escrow workflows use deterministic timelocks, release/refund
            actions, and dispute adjudication rules defined by the contract and
            application logic.
          </p>
          <p className="text-xs font-mono text-amber-300/90 mt-2">
            [FINALITY NOTICE]: Confirmed on-chain transactions on the underlying
            ledger are irreversible once finalized. Neither the application
            developers nor node operators can reverse or alter confirmed
            on-chain ledger executions.
          </p>
        </section>

        {/* 5. ALPHA AVAILABILITY & LIMITATION OF LIABILITY */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-blue-500 uppercase tracking-widest font-mono">
            5. Alpha Build Status & Limitation of Liability
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Bazaar Republic Alpha is an active alpha release tested on Pi
            Testnet and SoloHost environments. Availability depends on Pi
            Platform APIs, RPC/Horizon endpoints, network connectivity, and
            user hardware/wallet security. To the extent permitted by applicable
            law, the Bazaar Republic team is not liable for service
            interruptions, RPC/network delays, or client-side key mismanagement.
          </p>
        </section>

        {/* 6. UPDATES */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-blue-500 uppercase tracking-widest font-mono">
            6. Protocol & Terms Updates
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            These terms and platform features may be updated as Bazaar Republic
            evolves. Continued use of the application after updates are posted
            constitutes acceptance of the revised terms.
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
                href="/privacy"
                className="text-blue-500 hover:text-blue-400 underline underline-offset-4 tracking-wider"
              >
                PRIVACY PROTOCOL
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}