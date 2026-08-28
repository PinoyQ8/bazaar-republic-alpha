// components/AlphaGuardrail.tsx
export const AlphaGuardrail = () => {
  return (
    <div className="w-full bg-amber-950/30 border-b border-amber-900/50 backdrop-blur-sm z-50">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center">
        <span className="text-[10px] font-mono tracking-widest text-amber-500/80 uppercase">
          ⚠️ MESH-STATUS: ALPHA NODE (STATELESS MVP) • BALANCES RESET ON REFRESH
        </span>
      </div>
    </div>
  );
};