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

  const fetchSummary = async (refresh = false) => {
    setLoading(true);
    try {
      // 실제 API가 아직 없으므로 일단 mock 데이터를 로드하거나 
      // 나중에 구현할 /api/trigger/summary를 호출함
      const res = await fetch(`http://127.0.0.1:8000/api/trigger-summary${refresh ? "?refresh=true" : ""}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to fetch trigger summary:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
            {data?.change_stocks.slice(0, 12).map((s, i) => (
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
        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl md:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={16} />
              Sentiment Evolution Timeline
            </h3>
            <div className="flex gap-2">
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Positive</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Negative</span>
               </div>
            </div>
          </div>
          
          <div className="h-[240px] w-full flex items-end justify-between gap-2 px-2 relative mb-6">
            {/* Simple Mock Chart - Real chart would use a library like recharts or a custom SVG path */}
            <div className="absolute inset-0 border-b border-white/10 h-[50%]" />
            {data?.trends[0]?.data.map((point, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center group/p relative h-full">
                <motion.div 
                   initial={{ height: 0 }}
                   animate={{ height: `${50 + (point.score * 10)}%` }}
                   className={`w-full max-w-[12px] rounded-t-full transition-all ${point.score > 0 ? "bg-emerald-500/40 group-hover/p:bg-emerald-500/60" : "bg-rose-500/40 group-hover/p:bg-rose-500/60"}`}
                />
                {idx % 3 === 0 && (
                  <span className="text-[8px] text-slate-600 font-bold mt-2 absolute -bottom-6 rotate-45">{point.date.slice(5)}</span>
                )}
                <div className="absolute opacity-0 group-hover/p:opacity-100 bg-white text-black text-[9px] font-black px-2 py-1 rounded bottom-full mb-2 z-10 whitespace-nowrap pointer-events-none">
                  {point.score.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
             <p className="text-[9px] text-slate-600 italic">종목별 감성 지수의 시계열 변화를 분석하여 추세를 파악합니다.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
