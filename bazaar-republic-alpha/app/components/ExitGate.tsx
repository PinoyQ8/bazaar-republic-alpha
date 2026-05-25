{/* 🛡️ THE EXIT GATE (HIGH FRICTION) */}
<div className="mt-8 p-4 border border-red-900/30 bg-red-950/5 rounded-xl">
  <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-2">Republic Exit Sector</h3>
  <p className="text-[9px] text-slate-500 leading-relaxed mb-4 uppercase">
    Warning: Exiting the MESH will incinerate your entire mBZR stake. 
    This action is permanent and increases the scarcity of BZR for all remaining Pioneers.
  </p>
  
  <button 
    className="w-full py-3 border border-red-900 text-red-900 text-[10px] font-bold uppercase hover:bg-red-900 hover:text-white transition-all active:scale-95"
    // 🛡️ Attach the 5-second hold logic here
  >
    Hold 5s to Incinerate Stake & Exit
  </button>
</div>