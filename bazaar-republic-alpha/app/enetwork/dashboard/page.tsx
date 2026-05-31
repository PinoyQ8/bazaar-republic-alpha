import { Suspense } from "react";
import { getActiveProviders } from "@/app/actions/enetworkActions";
import { ProviderList } from "@/app/components/ProviderList";
import { Header } from "@/app/components/layout/Header";
import { ProviderLoadingShell } from "@/app/components/ProviderLoadingShell";

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