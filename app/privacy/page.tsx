import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-slate-300 p-6 md:p-12 font-sans pb-24">
      {/* 🛰️ HEADER BACK-LINK */}
      <div className="mb-8">
        <Link href="/registry" className="text-green-500 text-xs font-mono uppercase tracking-widest hover:text-green-400 transition-colors">
          &lt; RETURN TO GENESIS REGISTRY
        </Link>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* 🛡️ DOCUMENT HEADER */}
        <div className="border-b border-slate-800 pb-6 mb-8">
          <h1 className="text-2xl font-bold tracking-[0.2em] text-slate-100 uppercase mb-2">
            The Privacy Protocol
          </h1>
          <div className="flex gap-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            <span>LAST SYNC DATE: MAY 16, 2026</span>
          </div>
        </div>

        {/* ⚖️ CLAUSES */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-green-500 uppercase tracking-widest">1. The Data We Vault</h2>
          <p className="text-sm leading-relaxed text-slate-400">
            The Bazaar Republic operates on a principle of absolute data minimalism. We only collect the hard-coded parameters required to maintain the structural integrity of the MESH. When you register, the Alpha Vault captures:
          </p>
          <ul className="list-disc pl-5 text-sm leading-relaxed text-slate-400 space-y-2 marker:text-slate-700">
            <li><strong>Pioneer UID:</strong> To verify your unique status within the Pi Network.</li>
            <li><strong>Pi Wallet Address:</strong> To route transactions and enforce the Incineration Engine.</li>
            <li><strong>Username:</strong> For public ledger display and decentralized interaction.</li>
            <li><strong>Telemetry Data:</strong> Timestamps of your synchronization and designated clearance level (e.g., "GENESIS_TIER").</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold text-green-500 uppercase tracking-widest">2. Data Utilization (The Logic Forge)</h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Your data is strictly utilized to operate the DAO. We use this telemetry to validate your Security Circle standing, maintain the global "Total Burned" ledger, prevent sybil attacks, and display public-facing network stability metrics.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold text-green-500 uppercase tracking-widest">3. Data Isolation & Third Parties</h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Your data is sealed within the Republic's designated NoSQL Vault. We do not sell, rent, or distribute your UID or Wallet Address to external marketing entities. Your data only interacts with the official Pi Network APIs required to execute decentralized consensus.
          </p>
        </section>

        <section className="space-y-4 border-l-2 border-slate-700 pl-4 py-2">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">4. The Right to Purge (Exit Protocol)</h2>
          <p className="text-sm leading-relaxed text-slate-400">
            True decentralization requires the freedom to leave. Any citizen may invoke the "Exit Republic" command at any time. Executing this command physically deletes your personal node data from the primary collections within the Alpha Vault. 
          </p>
          <p className="text-xs italic text-slate-500 mt-2">
            Note: While your personal node data is purged, anonymous macroeconomic metrics resulting from your time in the Republic (such as your contribution to the total burned mBZR ledger) will remain permanently hard-coded in the global statistics.
          </p>
        </section>
      </div>
    </main>
  );
}