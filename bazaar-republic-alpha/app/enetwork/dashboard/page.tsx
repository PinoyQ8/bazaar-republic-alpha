import { Suspense } from "react";
import { getActiveProviders } from "@/app/actions/enetworkActions";
import { ProviderList } from "@/components/ProviderList";
import { Header } from "@/components/layout/Header";
import { ProviderLoadingShell } from "@/components/ProviderLoadingShell";

export default async function Dashboard() {
  const providers = await getActiveProviders();

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <Header />
      <div className="flex-1 overflow-y-auto pt-28 pb-24">
        <Suspense fallback={<ProviderLoadingShell />}>
          <ProviderList providers={providers} />
        </Suspense>
      </div>
    </div>
  );
}