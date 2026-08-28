"use client";

export default function PiArtForge() {
  // The canvas is locked to Fireside's optimal 4:5 ratio (1080x1350)
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8 font-mono">
      
      {/* THE CANVAS CONTAINER - Scaled to fit dev screen, but true export size is 1080x1350 */}
      <div 
        id="pi-art-canvas"
        className="relative w-270 h-[...] bg-[#050505] overflow-hidden flex items-center justify-center border border-zinc-900 shadow-2xl origin-center scale-[0.6] lg:scale-[0.7]"
      >
        
        {/* THE MESH GLOW CORE */}
        <div className="absolute blur-[120px]-[700px] bg-emerald-600/15 rounded-full blur-[120px]" />

        {/* TYPOGRAPHY OVERLAY */}
        <div className="absolute top-20 left-0 right-0 text-center z-50">
          <h1 className="text-4xl font-bold text-emerald-400 tracking-[0.5em] uppercase">
            Project Bazaar
          </h1>
          <p className="text-xl text-zinc-500 tracking-widest mt-4">
            MESH PROTOCOL v26.1
          </p>
        </div>

        {/* ISOMETRIC SCREEN STACK - Shifted up slightly */}
        <div className="relative w-full h-full flex items-center justify-center -mt-8">
          
          {/* Screen 1: Far Left (Background) */}
          <div className="absolute -rotate-12- [360px] sclae-[0.70]ranslate-y-[20px] -rotate-12 scale-[0.70] z-10 opacity-50 transition-all">
            <ScreenMockup src="/screen-1.png" />
          </div>

          {/* Screen 2: Mid Left */}
          <div className="absolute -rotate-12- [360px] sclae-[0.70] -rotate-6 scale-[0.85] z-20 opacity-80 shadow-2xl transition-all">
            <ScreenMockup src="/screen-2.png" />
          </div>

          {/* Screen 4: Mid Right */}
          <div className="absolute -rotate-12- [360px] sclae-[0.70]] rotate-6 scale-[0.85] z-20 opacity-80 shadow-2xl transition-all">
            <ScreenMockup src="/screen-4.png" />
          </div>

          {/* Screen 5: Far Right (Background) */}
          <div className="absolute -rotate-12- [360px] sclae-[0.70] rotate-12 scale-[0.70] z-10 opacity-50 transition-all">
            <ScreenMockup src="/screen-5.png" />
          </div>

          {/* Screen 3: The Center Hero (Dashboard) - Hoisted to clear text */}
          <div className="absolute z-30 scale-[1.05]shadow-[0_0_80px_rgba(16,185,129,0.25)] rounded-4xl transition-all">
            <ScreenMockup src="/screen-3.png" />
          </div>

        </div>

        {/* BOTTOM MANIFESTO PANEL - Pushed down to edge */}
        <div className="absolute bottom-12 left-0 right-0 z-50 px-24">
          <div className="border-l-4 border-l-emerald-500 border-y border-r border-zinc-800/80 bg-zinc-950/90 p-8 rounded backdrop-blur-md shadow-2xl">
            <p className="text-2xl text-zinc-300 leading-relaxed tracking-wide">
              A zero-trust digital economy where Real Pioneers lock stakes to secure the E-Network with hard-coded governance.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

// 🛡️ SUB-COMPONENT: The S23 Hardware Frame
function ScreenMockup({ src }: { src: string }) {
  return (
    <div className="w-[384px] h-213.5 rounded-[2.5rem] overflow-hidden border-[6px] border-zinc-800 shadow-[20px_20px_60px_rgba(0,0,0,0.8)] relative bg-zinc-950">
       {/* Fallback wireframe if image is missing */}
       <div className="absolute inset-0 flex items-center justify-center flex-col text-emerald-900 border border-emerald-900/30 m-6 rounded font-mono text-sm text-center">
          <span className="animate-pulse">[AWAITING ASSET]</span>
          <span className="text-xs mt-2 text-zinc-600">{src}</span>
       </div>
       
       {/* eslint-disable-next-line @next/next/no-img-element */}
       <img 
         src={src} 
         alt="Republic UI Sector" 
         className="absolute inset-0 w-full h-full object-cover z-10" 
       />
    </div>
  );
}