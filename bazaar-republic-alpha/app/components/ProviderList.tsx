import { ProviderNodeItem } from "@/components/ProviderNodeItem";

export function ProviderList({ providers }: { providers: any[] }) {
  if (providers.length === 0) {
    return <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center py-20">No Active Nodes in MESH</p>;
  }

  return (
    <div className="space-y-3">
      {providers.map((node: any) => (
        <ProviderNodeItem key={node.id} node={node} />
      ))}
    </div>
  );
}