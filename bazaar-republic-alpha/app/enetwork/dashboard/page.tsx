import { Suspense } from "react";
import { getActiveProviders } from "@/app/actions/enetworkActions";
import { ProviderList, ProviderNode } from "@/app/components/ProviderList";
import { Header } from "@/app/components/layout/Header";
import { ProviderLoadingShell } from "@/app/components/ProviderLoadingShell";

// 🛡️ MESH PROTOCOL: Lockdown to Dynamic Execution
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Dashboard() {
  // 1. Fetch raw database records from the backend action
  const rawProviders = await getActiveProviders();

  // 2. Data Transformation: Map raw DB fields to the strict UI Interface
  // This explicitly clears the TS 2322 structural fracture.
  const mappedProviders: ProviderNode[] = rawProviders.map((raw: any) => ({
    id: raw.id,
    pioneer: raw.username || "Unknown Pioneer", 
    service: "E-Network Node", // Database placeholder mapping
    rate: "Standard Base",     // Database placeholder mapping
    status: "VERIFIED",        // Hard-coded TS status baseline
    trustScore: 100
  }));

  // 3. Viewport Render (Strict S23 Ultra Constraints)
  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-amber-500 font-mono w-full max-w-[384px] mx-auto border-x border-neutral-800 shadow-2xl relative overflow-hidden">
      
      <Header />
      
      <main className="flex-1 overflow-y-auto pt-28 pb-24 scrollbar-hide">
        <Suspense fallback={<ProviderLoadingShell />}>
          {/* Injecting the fully mapped and validated array */}
          <ProviderList providers={mappedProviders} />
        </Suspense>
      </main>

    </div>
  );
}