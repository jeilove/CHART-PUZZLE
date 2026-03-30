"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Play, Trophy, Settings, ChevronLeft, Loader2 } from "lucide-react";
import { PuzzleGame } from "@/components/puzzle/PuzzleGame";
import { motion, AnimatePresence } from "framer-motion";

// 테스트를 위한 Mock 주가 데이터 (KOSP 200/KOSDAQ 150 컨셉)
const MOCK_STOCK_DATA = Array.from({ length: 60 }, (_, i) => {
  const date = new Date(2024, 0, i + 1); // 2024년 1월 1일부터 시작하여 i일만큼 증가
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  
  return {
    time: `${yyyy}-${mm}-${dd}`,
    open: 300 + Math.random() * 50,
    high: 350 + Math.random() * 50,
    low: 250 + Math.random() * 50,
    close: 300 + Math.random() * 50,
    volume: Math.floor(Math.random() * 100000) + 20000,
  };
});

// 실제 KOSPI 상장 종목 리스트 (샘플)
const STOCK_LIST = [
  { name: "삼성전자", symbol: "005930" },
  { name: "SK하이닉스", symbol: "000660" },
  { name: "LG에너지솔루션", symbol: "373220" },
  { name: "삼성바이오로직스", symbol: "207940" },
  { name: "현대차", symbol: "005380" },
  { name: "기아", symbol: "000270" },
  { name: "셀트리온", symbol: "068270" },
  { name: "POSCO홀딩스", symbol: "005490" },
];

export default function Home() {
  const [view, setView] = useState<"HOME" | "GAME" | "CHART">("HOME");
  const [selectedStock, setSelectedStock] = useState<{name: string, symbol: string} | null>(null);
  const [stockData, setStockData] = useState<any[]>(MOCK_STOCK_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [apiResults, setApiResults] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<{name: string, symbol: string}[]>([]);

  // 로컬 스토리지에서 즐겨찾기 불러오기
  React.useEffect(() => {
    const saved = localStorage.getItem("puzzle-favorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  const toggleFavorite = (stock: {name: string, symbol: string}, e: React.MouseEvent) => {
    e.stopPropagation();
    let newFavs;
    if (favorites.find(f => f.symbol === stock.symbol)) {
      newFavs = favorites.filter(f => f.symbol !== stock.symbol);
    } else {
      newFavs = [...favorites, stock];
    }
    setFavorites(newFavs);
    localStorage.setItem("puzzle-favorites", JSON.stringify(newFavs));
  };

  const selectStock = async (name: string, symbol: string, mode: "GAME" | "CHART" = "GAME") => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/stock/${symbol}`);
      if (!response.ok) throw new Error("API 연결 실패");
      const result = await response.json();
      if (result.data && result.data.length > 0) setStockData(result.data);
    } catch (e) {
      setStockData(MOCK_STOCK_DATA);
    } finally {
      setSelectedStock({ name, symbol });
      setView(mode);
      setIsLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  React.useEffect(() => {
    if (searchTerm.length >= 2) {
      const fetchApiSearch = async () => {
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/search?q=${encodeURIComponent(searchTerm)}`);
          if (res.ok) {
            const data = await res.json();
            setApiResults(data.results || []);
          }
        } catch (e) {}
      };
      fetchApiSearch();
    } else {
      setApiResults([]);
    }
  }, [searchTerm]);

  const filteredStocks = Array.from(new Map([
    ...STOCK_LIST.filter(s => s.name.includes(searchTerm) || s.symbol.includes(searchTerm)),
    ...apiResults
  ].map(s => [s.symbol, s])).values()).slice(0, 8);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && filteredStocks.length > 0) {
      selectStock(filteredStocks[0].name, filteredStocks[0].symbol);
    }
  };

  return (
    <main className="min-h-screen bg-[#0d1117] text-slate-200 flex flex-col items-center justify-center p-4 overflow-hidden relative font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#F08080]/5 rounded-full blur-[140px]" />
      
      <AnimatePresence mode="wait">
        {view === "HOME" ? (
          <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="z-10 w-full max-w-md flex flex-col items-center">
            <div className="text-center mb-10">
              <h1 className="text-5xl font-extrabold tracking-tighter bg-gradient-to-r from-[#F08080] to-rose-400 bg-clip-text text-transparent mb-2">CHART PUZZLE</h1>
              <p className="text-slate-500 text-sm font-medium">실시간 차트 데이터 기반 블라인드 챌린지</p>
            </div>

            <div className="w-full bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <Input 
                  placeholder="종목 검색 (삼성전자, 005930...)" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-14 bg-black/20 border-white/10 rounded-2xl pl-12 focus-visible:ring-0"
                />
                <AnimatePresence>
                  {searchTerm && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute top-16 left-0 w-full bg-[#161b22] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">
                      {filteredStocks.map((stock) => (
                        <div key={stock.symbol} className="w-full flex items-center hover:bg-white/5 border-b border-white/5">
                          <button onClick={() => selectStock(stock.name, stock.symbol, "CHART")} className="flex-1 px-6 py-4 text-left flex items-center justify-between">
                            <span className="font-bold text-slate-200">{stock.name}</span>
                            <span className="text-xs text-slate-500 font-mono">{stock.symbol}</span>
                          </button>
                          <button onClick={(e) => toggleFavorite(stock, e)} className="p-4 text-gray-500 hover:text-yellow-500 transition-colors">
                            <Star className={favorites.find(f => f.symbol === stock.symbol) ? "fill-yellow-500 text-yellow-500" : ""} size={18} />
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Button onClick={() => selectStock(STOCK_LIST[Math.floor(Math.random()*STOCK_LIST.length)].name, STOCK_LIST[Math.floor(Math.random()*STOCK_LIST.length)].symbol)} className="w-full h-16 bg-[#F08080] hover:bg-[#F08080]/90 text-white rounded-2xl text-lg font-black flex items-center justify-center gap-2">
                  <Play size={20} fill="currentColor" /> 블라인드 챌린지 시작
                </Button>
                
                {favorites.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2 px-1">My Favorites</p>
                    <div className="grid grid-cols-2 gap-2">
                      {favorites.slice(0, 4).map(fav => (
                        <button key={fav.symbol} onClick={() => selectStock(fav.name, fav.symbol, "CHART")} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-left transition-all group">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold truncate pr-2">{fav.name}</span>
                            <Star size={10} className="fill-yellow-500 text-yellow-500" />
                          </div>
                          <span className="text-[9px] text-white/30 font-mono">{fav.symbol}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : view === "GAME" ? (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="z-10 w-full max-w-4xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-6 px-4">
              <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => setView("HOME")}><ChevronLeft className="mr-1" /> 홈으로</Button>
              <h2 className="text-xl font-black">{selectedStock?.name}</h2>
              <div className="w-20" />
            </div>
            <PuzzleGame stockData={stockData} gridSize={2} stockName={selectedStock?.name} stockSymbol={selectedStock?.symbol} />
          </motion.div>
        ) : (
          <motion.div key="chart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="z-10 w-full max-w-4xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-6 px-4">
              <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => setView("HOME")}><ChevronLeft className="mr-1" /> 홈으로</Button>
              <div className="flex flex-col items-center">
                <h2 className="text-xl font-black">{selectedStock?.name}</h2>
                <span className="text-[10px] text-white/40 font-mono">{selectedStock?.symbol}</span>
              </div>
              <Button onClick={() => setView("GAME")} className="bg-[#F08080] hover:bg-[#F08080]/90 text-white font-black rounded-xl">챌린지 시작</Button>
            </div>
            <div className="w-full h-[70vh] bg-white/5 border border-white/10 rounded-3xl p-4 sm:p-6 backdrop-blur-xl">
              <PuzzleGame stockData={stockData} isOnlyChart={true} stockName={selectedStock?.name} stockSymbol={selectedStock?.symbol} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <footer className="fixed bottom-6 text-[10px] text-white/10 tracking-widest font-mono uppercase">VIBE CODING • CHART PUZZLE v0.2.0</footer>
    </main>
  );
}

// Star 아이콘 추가 (lucide-react에서 가져옴)
import { Star } from "lucide-react";
