import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-slate-300 p-6 md:p-12 font-sans pb-24">
      {/* 🛰️ HEADER BACK-LINK */}
      <div className="mb-8">
        <Link href="/registry" className="text-blue-500 text-xs font-mono uppercase tracking-widest hover:text-blue-400 transition-colors">
          &lt; RETURN TO GENESIS REGISTRY
        </Link>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* 📜 DOCUMENT HEADER */}
        <div className="border-b border-slate-800 pb-6 mb-8">
          <h1 className="text-2xl font-bold tracking-[0.2em] text-slate-100 uppercase mb-2">
            The Terms of the Republic
          </h1>
          <div className="flex gap-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            <span>LAST SYNC DATE: MAY 16, 2026</span>
            <span>PROTOCOL: ALPHA SECTOR V1.0</span>
          </div>
        </div>

        {/* ⚖️ CLAUSES */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-blue-500 uppercase tracking-widest">1. Acceptance of the MESH</h2>
          <p className="text-sm leading-relaxed text-slate-400">
            By connecting your Pi Network Wallet, verifying your Pioneer UID, and registering as a Genesis Node within the Bazaar Republic, you are executing a binding smart-contract with the DAO. If you do not agree with the decentralized logic outlined below, you must sever your connection immediately.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold text-blue-500 uppercase tracking-widest">2. Node Identity & Wallet Integration</h2>
          <ul className="list-disc pl-5 text-sm leading-relaxed text-slate-400 space-y-2 marker:text-slate-700">
            <li>Your identity in the Republic is tethered directly to your <code className="bg-slate-900 px-1 py-0.5 rounded text-blue-400 font-mono text-xs">pioneer_uid</code> and <code className="bg-slate-900 px-1 py-0.5 rounded text-blue-400 font-mono text-xs">pi_wallet_address</code>.</li>
            <li>You are solely responsible for the security of your Pi Wallet passphrase. The Republic does not store, access, or possess the capability to recover lost wallet credentials.</li>
            <li>Any breach of your local node is your responsibility. The MESH cannot reverse unauthorized transactions executed from a compromised wallet.</li>
          </ul>
        </section>

        <section className="space-y-4 border-l-2 border-red-900 pl-4 py-2 bg-red-950/10">
          <h2 className="text-sm font-bold text-red-500 uppercase tracking-widest">3. The Incineration Engine (Deflationary Protocol)</h2>
          <p className="text-sm leading-relaxed text-slate-400">
            The Republic utilizes a strict deflationary logic to manage global scarcity. By triggering the "Exit Republic" or "Incinerate" function, you authorize the permanent burning of your designated mBZR tokens.
          </p>
          <p className="text-xs font-mono text-red-400 mt-2">
            [ADJUDICATOR DECREE]: Incineration is atomic and irreversible. Once the MESH updates the global ledger and purges your Genesis Node record from the Alpha Vault, the assets cannot be recovered under any circumstances.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold text-blue-500 uppercase tracking-widest">4. Alpha Sector Stability & No Liability</h2>
          <p className="text-sm leading-relaxed text-slate-400">
            The Bazaar Republic is currently in its Alpha iteration. While the MESH maintains a target of 92% Uptime Shield, the infrastructure is subject to Pi Network Mainnet upgrades (e.g., Protocol v23 anomalies), node synchronization delays, and active development. The Bazaar Founder, core developers, and affiliated node operators are entirely absolved of any liability for data loss, token misrouting, or temporary stasis resulting from network fractures.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold text-blue-500 uppercase tracking-widest">5. DAO Governance & Modification</h2>
          <p className="text-sm leading-relaxed text-slate-400">
            The logic of the Republic evolves. The parameters of these terms, including the Incineration quotas and Security Circle clearance tiers, may be updated via decentralized consensus or direct MESH-SCAN audits. Continued operation of your node implies consent to the upgraded logic.
          </p>
        </section>
      </div>
    </main>
  );
}