"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, TrendingUp, TrendingDown, Activity, Calendar, RefreshCw, BarChart3 } from "lucide-react";

interface TriggerSummary {
  positive_stocks: { name: string; symbol: string; score: number }[];
  negative_stocks: { name: string; symbol: string; score: number }[];
  change_stocks: { name: string; symbol: string; score: number; top_change_word: string }[];
  trends: { symbol: string; name: string; data: { date: string; score: number }[] }[];
}

export function TriggerAnalysis() {
  const [data, setData] = useState<TriggerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState("MARKET");

  const fetchSummary = async (refresh = false) => {
    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const res = await fetch(`/api/market/trigger-summary${refresh ? "?refresh=true" : ""}&t=${Date.now()}`, {
        signal: controller.signal,
        cache: 'no-store'
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        throw new Error(`HTTP Error: ${res.status}`);
      }
    } catch (e) {
      console.error("Failed to fetch trigger summary:", e);
      // v2.10.8: 첫 시도 실패 시 1회 재시도 (Jitter 방식)
      if (!refresh) {
          setTimeout(() => fetchSummary(true), 500);
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  useEffect(() => {
    // v2.10.8: 즉시 로드를 보장하기 위해 마운트 시 호출
    fetchSummary();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Activity className="animate-pulse text-blue-400" size={48} />
        <p className="text-blue-400/60 font-black tracking-widest text-xs uppercase">Analyzing Market Triggers...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-8 pb-32 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tighter flex items-center gap-2">
            <Zap className="text-yellow-400 fill-yellow-400" size={24} />
            TRIGGER PULSE
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Real-time Sentiment & Change Analysis</p>
        </div>
        <button 
          onClick={() => fetchSummary(true)}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group"
          title="Refresh Analysis"
        >
          <RefreshCw size={18} className={`text-slate-400 group-hover:text-white ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Positive Trigger Cloud */}
        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={64} className="text-emerald-400" />
          </div>
          <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Positive Trigger Cloud
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {data?.positive_stocks.map((s, i) => (
              <motion.div 
                key={s.symbol}
                whileHover={{ scale: 1.1 }}
                className="cursor-pointer"
                style={{ 
                  fontSize: `${Math.max(12, 12 + s.score * 5)}px`,
                  color: `rgba(52, 211, 153, ${0.4 + (s.score / 10)})`,
                  fontWeight: s.score > 3 ? 900 : 700
                }}
              >
                {s.name}
              </motion.div>
            ))}
          </div>
        </section>

        {/* 2. Negative Trigger Cloud */}
        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown size={64} className="text-rose-400" />
          </div>
          <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            Negative Trigger Cloud
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {data?.negative_stocks.map((s, i) => (
              <motion.div 
                key={s.symbol}
                whileHover={{ scale: 1.1 }}
                className="cursor-pointer"
                style={{ 
                  fontSize: `${Math.max(12, 12 + s.score * 5)}px`,
                  color: `rgba(251, 113, 133, ${0.4 + (s.score / 10)})`,
                  fontWeight: s.score > 3 ? 900 : 700
                }}
              >
                {s.name}
              </motion.div>
            ))}
          </div>
        </section>

        {/* 3. Change Trigger Cloud */}
        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl md:col-span-2 relative group">
          <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[140%] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
          <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <BarChart3 size={16} />
            Change Intensity Cloud
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(data?.change_stocks || []).slice(0, 12).map((s, i) => (
              <div key={s.symbol} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-white/10 transition-all border-b-2 border-b-blue-500/20">
                <span className="text-sm font-black text-white mb-1">{s.name}</span>
                <div className="px-2 py-0.5 bg-blue-500/20 rounded text-[9px] font-bold text-blue-300 uppercase">
                  {s.top_change_word}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Timeline View */}
        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl md:col-span-2 relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-rose-500/5 pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 relative z-10">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                <Calendar size={16} />
                Sentiment Evolution Timeline
              </h3>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative group/select">
                <select 
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[11px] font-black text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 appearance-none pr-8 cursor-pointer hover:bg-black/60 transition-all"
                >
                  <option value="MARKET">🌐 Market Pulse</option>
                  {(data?.trends || []).map(t => (
                    <option key={t.symbol} value={t.symbol}>{t.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <Activity size={12} />
                </div>
              </div>
              
              <div className="hidden sm:flex gap-2">
                 <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                 </div>
                 <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                 </div>
              </div>
            </div>
          </div>
          
          <div className="h-[240px] w-full flex items-center justify-between gap-1 sm:gap-2 px-2 relative mb-6 z-10">
            {/* Center Baseline */}
            <div className="absolute left-0 right-0 top-1/2 border-t border-white/10 z-0" />
            
            {(() => {
              // Calculate or pick data
              let plotData: { date: string; score: number }[] = [];
              const trends = data?.trends || [];
              
              if (selectedSymbol === "MARKET" && trends.length > 0) {
                // Ensure all trends have internal data arrays
                const validTrends = trends.filter(t => Array.isArray(t.data));
                if (validTrends.length > 0) {
                  plotData = validTrends[0].data.map((point, idx) => {
                    let sum = 0;
                    validTrends.forEach(t => {
                        const score = t.data[idx]?.score;
                        sum += (typeof score === 'number' ? score : 0);
                    });
                    return { date: point.date, score: sum / validTrends.length };
                  });
                }
              } else {
                const found = trends.find(t => t.symbol === selectedSymbol);
                plotData = (found?.data || []) as { date: string; score: number }[];
              }

              if (plotData.length === 0) {
                return (
                  <div className="absolute inset-0 flex items-center justify-center text-white/5 italic text-[10px] uppercase tracking-widest">
                    No timeline data available for selection
                  </div>
                );
              }

              return plotData.map((point, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center group/p relative h-full">
                  <motion.div 
                     initial={{ height: 0 }}
                     animate={{ height: `${Math.min(45, Math.abs(point.score || 0) * 9)}%` }}
                     transition={{ type: "spring", damping: 20 }}
                     className={`w-full max-w-[14px] absolute transition-all z-10 ${
                        (point.score || 0) >= 0 
                          ? "bottom-1/2 bg-gradient-to-t from-emerald-500/40 to-emerald-500 rounded-t-lg" 
                          : "top-1/2 bg-gradient-to-b from-rose-500/40 to-rose-500 rounded-b-lg"
                     }`}
                  />
                  {idx % 3 === 0 && (
                    <span className="text-[8px] text-slate-600 font-bold absolute -bottom-10 opacity-60 tracking-tighter">{(point.date || "").slice(5)}</span>
                  )}
                  <div className={`absolute opacity-0 group-hover/p:opacity-100 bg-white/90 backdrop-blur-md text-black text-[9px] font-black px-2 py-1 rounded z-20 whitespace-nowrap shadow-xl border border-white/20 transition-all scale-75 group-hover/p:scale-100 ${
                    (point.score || 0) >= 0 ? "bottom-[calc(50%+10px)]" : "top-[calc(50%+10px)]"
                  }`}>
                    {(point.score || 0) > 0 ? "+" : ""}{(point.score || 0).toFixed(2)}
                  </div>
                </div>
              ));
            })()}
          </div>
          <div className="mt-12 text-center border-t border-white/5 pt-4">
             <p className="text-[9px] text-slate-600 italic tracking-tight uppercase font-bold opacity-60">Selection-based Sentiment Analytics & Growth Trajectory</p>
          </div>
        </section>
      </div>
    </div>
  );
}
