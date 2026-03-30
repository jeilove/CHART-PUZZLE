"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Play, ChevronLeft, ChevronRight, Loader2, Star, Menu, X, Trash2, GripVertical } from "lucide-react";
import { PuzzleGame } from "@/components/puzzle/PuzzleGame";
import { motion, AnimatePresence } from "framer-motion";

// 테스트를 위한 Mock 주가 데이터 (KOSP 200/KOSDAQ 150 컨셉)
const MOCK_STOCK_DATA = Array.from({ length: 60 }, (_, i) => {
  const date = new Date(2024, 0, i + 1);
  return {
    time: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
    open: 300 + Math.random() * 50,
    high: 350 + Math.random() * 50,
    low: 250 + Math.random() * 50,
    close: 300 + Math.random() * 50,
    volume: Math.floor(Math.random() * 100000) + 20000,
  };
});

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  React.useEffect(() => {
    console.log("%c VIBE CODING • CHART PUZZLE v0.2.6-stable ", "background: #F08080; color: white; font-weight: bold; padding: 4px 8px; border-radius: 6px;");
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

  const deleteFavorite = (symbol: string) => {
    const newFavs = favorites.filter(f => f.symbol !== symbol);
    setFavorites(newFavs);
    localStorage.setItem("puzzle-favorites", JSON.stringify(newFavs));
  };

  const selectStock = async (name: string, symbol: string, mode: "GAME" | "CHART" = "GAME") => {
    setIsLoading(true);
    setIsDrawerOpen(false);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/stock/${symbol}`);
      if (!response.ok) throw new Error("API 실패");
      const result = await response.json();
      if (result.data) setStockData(result.data);
    } catch (e) {
      setStockData(MOCK_STOCK_DATA);
    } finally {
      setSelectedStock({ name, symbol });
      setView(mode);
      setIsLoading(false);
    }
  };

  const handlePrevFavorite = () => {
    if (favorites.length === 0 || !selectedStock) return;
    const currentIndex = favorites.findIndex(f => f.symbol === selectedStock.symbol);
    const prevIndex = (currentIndex - 1 + favorites.length) % favorites.length;
    const prevStock = favorites[prevIndex];
    selectStock(prevStock.name, prevStock.symbol, view === "GAME" ? "GAME" : "CHART");
  };

  const handleNextFavorite = () => {
    if (favorites.length === 0 || !selectedStock) return;
    const currentIndex = favorites.findIndex(f => f.symbol === selectedStock.symbol);
    const nextIndex = (currentIndex + 1) % favorites.length;
    const nextStock = favorites[nextIndex];
    selectStock(nextStock.name, nextStock.symbol, view === "GAME" ? "GAME" : "CHART");
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

  return (
    <main className="min-h-screen bg-[#0d1117] text-slate-200 flex flex-col items-center justify-center p-4 overflow-hidden relative font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#F08080]/5 rounded-full blur-[140px]" />
      
      {/* 햄버거 메뉴 버튼 */}
      {view === "HOME" && (
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="absolute top-8 left-8 z-50 p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group"
        >
          <Menu size={24} className="text-slate-400 group-hover:text-white" />
        </button>
      )}

      {/* 즐겨찾기 드로어 (Drawer) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[300px] bg-[#161b22] border-r border-white/10 z-[110] p-6 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Star className="text-yellow-500 fill-yellow-500" size={20} />
                  <h2 className="text-xl font-black text-white">즐겨찾기</h2>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {favorites.length > 0 ? (
                  favorites.map((fav) => (
                    <div key={fav.symbol} className="group relative flex items-center bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all overflow-hidden">
                      <div className="p-3 text-white/20 cursor-grab active:cursor-grabbing">
                        <GripVertical size={16} />
                      </div>
                      <button 
                        onClick={() => selectStock(fav.name, fav.symbol, "CHART")}
                        className="flex-1 py-4 text-left"
                      >
                        <p className="font-bold text-slate-200 text-sm">
                          {fav.name} <span className="text-[10px] text-white/30 font-mono ml-1">[{fav.symbol}]</span>
                        </p>
                      </button>
                      <button 
                        onClick={() => deleteFavorite(fav.symbol)}
                        className="p-4 text-slate-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                    <Star size={32} className="mb-4 opacity-10" />
                    <p className="text-sm">등록된 즐겨찾기가 없습니다.</p>
                  </div>
                )}
              </div>
              
              <div className="mt-auto pt-6 border-t border-white/5">
                <p className="text-[10px] text-white/20 font-mono text-center">VIBE CODING • CHART PUZZLE v0.2.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
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

              <Button 
                onClick={() => {
                  const randomStock = STOCK_LIST[Math.floor(Math.random() * STOCK_LIST.length)];
                  selectStock(randomStock.name, randomStock.symbol);
                }} 
                className="w-full h-16 bg-[#F08080] hover:bg-[#F08080]/90 text-white rounded-2xl text-lg font-black flex items-center justify-center gap-2"
              >
                <Play size={20} fill="currentColor" /> 블라인드 챌린지 시작
              </Button>
            </div>
          </motion.div>
        ) : view === "GAME" ? (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="z-10 w-full max-w-4xl flex flex-col items-center">
            <div className="w-full flex items-center justify-center mb-6 px-4 relative">
              <Button variant="ghost" className="absolute left-4 text-gray-400 hover:text-white" onClick={() => setView("HOME")}><ChevronLeft className="mr-1" /> 홈으로</Button>
              <h2 className="text-xl font-black flex items-center gap-2 text-white">
                {selectedStock?.name}
                <span className="text-[10px] text-white/40 font-mono font-normal">[{selectedStock?.symbol}]</span>
              </h2>
            </div>
            <PuzzleGame stockData={stockData} gridSize={2} stockName={selectedStock?.name} stockSymbol={selectedStock?.symbol} />
          </motion.div>
        ) : (
          <motion.div key="chart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="z-10 w-full max-w-4xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4 px-4">
              <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => setView("HOME")}><ChevronLeft className="mr-1" /> 홈으로</Button>
              
              <div className="flex items-center gap-1 sm:gap-4">
                <button 
                  onClick={handlePrevFavorite}
                  disabled={favorites.length <= 1}
                  className="p-1 sm:p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white disabled:opacity-20 transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <h2 className="text-base sm:text-lg font-black text-white">{selectedStock?.name}</h2>
                  <span className="text-[9px] text-white/40 font-mono">[{selectedStock?.symbol}]</span>
                </div>
                <button 
                  onClick={handleNextFavorite}
                  disabled={favorites.length <= 1}
                  className="p-1 sm:p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white disabled:opacity-20 transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* 챌린지 시작 버튼은 나중에 하단으로 이동됨 */}
              <div className="w-20" />
            </div>
            <div className="w-full h-[70vh] bg-white/5 border border-white/10 rounded-3xl p-4 sm:p-6 backdrop-blur-xl relative">
              <PuzzleGame stockData={stockData} isOnlyChart={true} stockName={selectedStock?.name} stockSymbol={selectedStock?.symbol} />
              
              {/* 챌린지 시작 메뉴 하단 이동 */}
              <div className="absolute -bottom-10 left-0 right-0 flex justify-center z-[100]">
                <Button 
                  onClick={() => setView("GAME")} 
                  className="bg-[#F08080] hover:bg-[#F08080]/90 text-white font-black rounded-2xl h-14 px-10 shadow-2xl shadow-[#F08080]/20 flex items-center gap-2"
                >
                  <Play size={18} fill="currentColor" /> 블라인드 챌린지 시작
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <footer className="fixed bottom-6 text-[10px] text-white/30 tracking-widest font-mono uppercase z-50">VIBE CODING • CHART PUZZLE v0.3.5-stable</footer>
    </main>
  );
}
