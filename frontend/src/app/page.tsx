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
  const [view, setView] = useState<"HOME" | "GAME" | "RESULT">("HOME");
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [stockData, setStockData] = useState<any[]>(MOCK_STOCK_DATA);
  const [isLoading, setIsLoading] = useState(false);

  const startBlindChallenge = async () => {
    // 블라인드 모드는 상위 10개 중 랜덤 하나를 선택 및 코드 기반 데이터 호출
    const randomIndex = Math.floor(Math.random() * STOCK_LIST.length);
    const target = STOCK_LIST[randomIndex];
    await selectStock(target.name, target.symbol);
  };

  const selectStock = async (name: string, symbol: string) => {
    setIsLoading(true);
    try {
      // 로컬 백엔드 API 호출 (Phase 6 실데이터 연동 - IPv4 정적 주소 사용)
      const response = await fetch(`http://127.0.0.1:8000/api/stock/${symbol}`);
      if (!response.ok) throw new Error("API 연결 실패");
      
      const result = await response.json();
      if (result.data && result.data.length > 0) {
        setStockData(result.data);
      }
    } catch (e) {
      console.error("실데이터 로딩 실패, Mock 데이터 사용:", e);
      setStockData(MOCK_STOCK_DATA);
    } finally {
      setSelectedStock(name);
      setView("GAME");
      setIsLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const filteredStocks = STOCK_LIST
    .filter(s => s.name.includes(searchTerm))
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-[#0d1117] text-slate-200 flex flex-col items-center justify-center p-4 overflow-hidden relative font-sans transition-colors">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[140px]" />

      <AnimatePresence mode="wait">
        {view === "HOME" ? (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="z-10 w-full max-w-md flex flex-col items-center"
          >
            {/* 브랜딩 로고 영역 */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-extrabold tracking-tighter bg-gradient-to-r from-[#F08080] to-rose-400 bg-clip-text text-transparent mb-2">
                CHART PUZZLE
              </h1>
              <p className="text-slate-400 text-lg font-medium">차트 조각을 맞춰 주가를 예측하세요</p>
            </div>

            {/* 메인 액션 영역 */}
            <div className="w-full bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl space-y-8">
              <div className="space-y-4">
                <Button 
                  onClick={startBlindChallenge}
                  disabled={isLoading}
                  className="w-full h-16 text-xl font-bold bg-[#F08080] hover:bg-[#F08080]/90 text-white transition-all rounded-2xl group flex items-center justify-between px-6 shadow-lg shadow-[#F08080]/20"
                >
                  <span className="flex items-center gap-3">
                    {isLoading ? <Loader2 className="animate-spin" /> : <Play className="fill-current" />}
                    블라인드 챌린지
                  </span>
                  <span className="text-sm bg-white/10 px-3 py-1 rounded-full font-normal">START</span>
                </Button>
                
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                  <Input 
                    placeholder="종목 검색" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-14 bg-black/40 border-white/10 focus:border-blue-500/50 rounded-2xl pl-12 text-lg focus-visible:ring-0 transition-all placeholder:text-gray-600"
                  />
                  
                  {searchTerm && (
                    <div className="absolute top-16 left-0 w-full bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      {filteredStocks.length > 0 ? (
                        filteredStocks.map((stock) => (
                          <button 
                            key={stock.symbol}
                            onClick={() => selectStock(stock.name, stock.symbol)}
                            className="w-full px-6 py-4 text-left hover:bg-blue-600/20 transition-colors border-b border-white/5 last:border-0"
                          >
                            <span className="font-medium">{stock.name}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-6 py-4 text-gray-500 text-sm italic">결과가 없습니다.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">최고 기록</p>
                  <p className="text-2xl font-bold font-mono">01:24</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">예측 성공률</p>
                  <p className="text-2xl font-bold text-[#F08080] font-mono">68%</p>
                </div>
              </div>
            </div>

            {/* 하위 메뉴 */}
            <div className="flex justify-center gap-6 mt-8 text-gray-400">
              <button className="flex items-center gap-2 hover:text-white transition-colors">
                <Trophy size={18} />
                <span className="text-sm">랭킹</span>
              </button>
              <button className="flex items-center gap-2 hover:text-white transition-colors">
                <Settings size={18} />
                <span className="text-sm">설정</span>
              </button>
            </div>
          </motion.div>
        ) : view === "GAME" ? (
          <motion.div 
            key="game"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="z-10 w-full max-w-4xl flex flex-col items-center"
          >
            {/* 상단 바 */}
            <div className="w-full flex items-center justify-between mb-8 px-4">
              <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => setView("HOME")}>
                <ChevronLeft className="mr-2" /> 나가기
              </Button>
              <div className="text-center flex-1">
                <h2 className="text-xl font-bold">{selectedStock || "???"}</h2>
                <p className="text-xs text-yellow-500 font-mono">TIME 00:00 • MOVES 0</p>
              </div>
              <div className="w-20" /> {/* 밸런싱용 */}
            </div>

            {/* 퍼즐 영역 */}
            <PuzzleGame stockData={stockData} gridSize={4} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* 푸터 버전 정보 */}
      <footer className="fixed bottom-6 text-[10px] text-gray-800 tracking-widest font-mono select-none">
        VIBE CODING • CHART PUZZLE v0.1.0-alpha
      </footer>
    </main>
  );
}
