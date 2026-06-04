// 🛡️ MESH PROTOCOL: Lockdown to Dynamic Execution
// This prevents Next.js from pre-rendering the page at build time.
// 🛡️ MESH PROTOCOL: Lockdown to Dynamic Execution
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Update the import to match your confirmed file name from the previous scan
import GovernanceSector from "@/app/components/GovernanceDashboard"; 

export default function GovernancePage() {
  // If you have a way to retrieve the ID server-side, insert it here.
  // For now, satisfy the TypeScript contract with a placeholder or session-retrieval logic:
  const targetId = "GHOST_NODE_INIT"; // 🛡️ Replace with your dynamic session ID or user ID

  return (
    <main className="min-h-screen bg-slate-950">
      {/* 🛡️ CONTRACT RESOLUTION: Pass the required ID */}
      <GovernanceSector activePioneerId={targetId} />
    </main>
  );
}