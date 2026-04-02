"use client";

import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d1117] text-white">
      <div className="relative mb-10 w-24 h-24">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-rose-500/20 blur-[30px] rounded-full animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={48} className="animate-spin text-rose-500" strokeWidth={2} />
        </div>
      </div>
      <h2 className="text-xl font-black mb-1 bg-gradient-to-r from-rose-400 to-rose-600 bg-clip-text text-transparent tracking-tighter">CHART PUZZLE</h2>
      <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Initializing System...</p>
    </div>
  );
}
