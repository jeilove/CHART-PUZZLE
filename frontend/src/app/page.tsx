"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, Play, ChevronLeft, ChevronRight, Loader2, Star, Menu, X, Trash2, 
  GripVertical, Plus, Edit3, Check, CheckSquare, Square, Filter, ChevronDown 
} from "lucide-react";
import { PuzzleGame } from "@/components/puzzle/PuzzleGame";
import { motion, AnimatePresence } from "framer-motion";

// 테스트를 위한 Mock 주가 데이터 (KOSPI 200/KOSDAQ 150 컨셉)
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

interface Stock {
  name: string;
  symbol: string;
  industry?: string;
}

interface FavoriteGroup {
  id: string;
  name: string;
  stocks: Stock[];
}

const STOCK_LIST: (Stock & { industry: string })[] = [
  { name: "삼성전자", symbol: "005930", industry: "반도체" },
  { name: "SK하이닉스", symbol: "000660", industry: "반도체" },
  { name: "한미반도체", symbol: "042700", industry: "반도체" },
  { name: "DB하이텍", symbol: "000990", industry: "반도체" },
  { name: "리노공업", symbol: "058470", industry: "반도체" },
  { name: "HPSP", symbol: "403870", industry: "반도체" },
  { name: "LG에너지솔루션", symbol: "373220", industry: "이차전지" },
  { name: "에코프로비엠", symbol: "247540", industry: "이차전지" },
  { name: "에코프로", symbol: "086520", industry: "이차전지" },
  { name: "포스코퓨처엠", symbol: "003670", industry: "이차전지" },
  { name: "삼성바이오로직스", symbol: "207940", industry: "바이오" },
  { name: "셀트리온", symbol: "068270", industry: "바이오" },
  { name: "유한양행", symbol: "000100", industry: "바이오" },
  { name: "현대차", symbol: "005380", industry: "자동차" },
  { name: "기아", symbol: "000270", industry: "자동차" },
  { name: "POSCO홀딩스", symbol: "005490", industry: "철강" },
  { name: "카카오", symbol: "035720", industry: "IT서비스" },
  { name: "NAVER", symbol: "035420", industry: "IT서비스" },
];

export default function Home() {
  const [view, setView] = useState<"HOME" | "GAME" | "CHART">("HOME");
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [stockData, setStockData] = useState<any[]>(MOCK_STOCK_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [apiResults, setApiResults] = useState<any[]>([]);
  const [favoriteGroups, setFavoriteGroups] = useState<FavoriteGroup[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  
  // v0.6.0 신규 상태
  const [selectedSearchSymbols, setSelectedSearchSymbols] = useState<string[]>([]);
  const [targetAddGroupId, setTargetAddGroupId] = useState<string>("");
  const [activeFilterGroupId, setActiveFilterGroupId] = useState<string | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [ungroupedStocks, setUngroupedStocks] = useState<Stock[]>([]);
  const [isTimeWarpTriggered, setIsTimeWarpTriggered] = useState(false);

  React.useEffect(() => {
    console.log("%c VIBE CODING • CHART PUZZLE v0.6.0-multiselect ", "background: #F08080; color: white; font-weight: bold; padding: 4px 8px; border-radius: 6px;");
    
    const savedGroups = localStorage.getItem("puzzle-favorite-groups");
    const oldFavs = localStorage.getItem("puzzle-favorites");
    const savedUngrouped = localStorage.getItem("puzzle-ungrouped-stocks");

    if (savedUngrouped) {
      setUngroupedStocks(JSON.parse(savedUngrouped));
    }

    if (savedGroups) {
      const parsed = JSON.parse(savedGroups);
      setFavoriteGroups(parsed);
      if (parsed.length > 0) setTargetAddGroupId(parsed[0].id);
    } else if (oldFavs) {
      const parsedOld = JSON.parse(oldFavs);
      setUngroupedStocks(parsedOld);
      localStorage.setItem("puzzle-ungrouped-stocks", JSON.stringify(parsedOld));
    } else {
      const initialGroups: FavoriteGroup[] = [{ id: "default", name: "기본 그룹", stocks: [] }];
      setFavoriteGroups(initialGroups);
      setTargetAddGroupId("default");
    }
  }, []);

  const saveUngrouped = (stocks: Stock[]) => {
    setUngroupedStocks(stocks);
    localStorage.setItem("puzzle-ungrouped-stocks", JSON.stringify(stocks));
  };

  const saveGroups = (groups: FavoriteGroup[]) => {
    setFavoriteGroups(groups);
    localStorage.setItem("puzzle-favorite-groups", JSON.stringify(groups));
  };

  const addGroup = () => {
    const newGroup: FavoriteGroup = {
      id: Date.now().toString(),
      name: "새 그룹",
      stocks: []
    };
    saveGroups([newGroup, ...favoriteGroups]);
  };

  const deleteGroup = (id: string) => {
    if (favoriteGroups.length <= 1) {
      alert("최소 하나의 그룹은 유지되어야 합니다.");
      return;
    }
    const newGroups = favoriteGroups.filter(g => g.id !== id);
    saveGroups(newGroups);
    
    // 삭제한 그룹이 현재 필터링 중이라면 필터 초기화
    if (activeFilterGroupId === id) {
      setActiveFilterGroupId(null);
    }
    
    // 타겟 추가 그룹이 삭제되었다면 첫 번째 그룹으로 변경
    if (targetAddGroupId === id && newGroups.length > 0) {
      setTargetAddGroupId(newGroups[0].id);
    }
  };

  const startEditGroup = (group: FavoriteGroup) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  const finishEditGroup = () => {
    if (!editingGroupId) return;
    const newGroups = favoriteGroups.map(g => 
      g.id === editingGroupId ? { ...g, name: editingGroupName || "이름 없는 그룹" } : g
    );
    saveGroups(newGroups);
    setEditingGroupId(null);
  };

  const toggleFavorite = (stock: Stock, e: React.MouseEvent) => {
    e.stopPropagation();
    const isExist = ungroupedStocks.find(s => s.symbol === stock.symbol);

    if (isExist) {
      saveUngrouped(ungroupedStocks.filter(s => s.symbol !== stock.symbol));
    } else {
      saveUngrouped([...ungroupedStocks, stock]);
    }
  };

  // v0.6.0 일괄 추가 로직
  const handleMultiAdd = () => {
    if (selectedSearchSymbols.length === 0 || !targetAddGroupId) return;
    
    // 현재 필터링된 검색 결과에서 실제 주식 객체 추출
    const stocksToAdd = filteredStocks.filter(s => selectedSearchSymbols.includes(s.symbol));
    
    const newGroups = favoriteGroups.map(g => {
      if (g.id === targetAddGroupId) {
        const existingSymbols = g.stocks.map(s => s.symbol);
        const uniqueNewStocks = stocksToAdd.filter(s => !existingSymbols.includes(s.symbol));
        return { ...g, stocks: [...g.stocks, ...uniqueNewStocks] };
      }
      return g;
    });
    
    saveGroups(newGroups);
    setSelectedSearchSymbols([]);
  };

  const toggleSearchSelection = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSearchSymbols(prev => 
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    );
  };

  const deleteFavorite = (symbol: string, groupId: string) => {
    const newGroups = favoriteGroups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          stocks: g.stocks.filter(s => s.symbol !== symbol)
        };
      }
      return g;
    });
    saveGroups(newGroups);
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
      if (mode === "GAME") setIsTimeWarpTriggered(false);
    }
  };

  const flatFavorites = [...ungroupedStocks, ...favoriteGroups.flatMap(g => g.stocks)];

  const handlePrevFavorite = () => {
    if (flatFavorites.length === 0 || !selectedStock) return;
    const currentIndex = flatFavorites.findIndex(f => f.symbol === selectedStock.symbol);
    const prevIndex = (currentIndex - 1 + flatFavorites.length) % flatFavorites.length;
    const prevStock = flatFavorites[prevIndex];
    selectStock(prevStock.name, prevStock.symbol, view === "GAME" ? "GAME" : "CHART");
  };

  const handleNextFavorite = () => {
    if (flatFavorites.length === 0 || !selectedStock) return;
    const currentIndex = flatFavorites.findIndex(f => f.symbol === selectedStock.symbol);
    const nextIndex = (currentIndex + 1) % flatFavorites.length;
    const nextStock = flatFavorites[nextIndex];
    selectStock(nextStock.name, nextStock.symbol, view === "GAME" ? "GAME" : "CHART");
  };

  const [searchTerm, setSearchTerm] = useState("");
  React.useEffect(() => {
    if (searchTerm.length >= 1) {
      const fetchApiSearch = async () => {
        setIsSearchLoading(true);
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/search?q=${encodeURIComponent(searchTerm)}`);
          if (res.ok) {
            const data = await res.json();
            setApiResults(data.results || []);
          }
        } catch (e) {} finally {
          setIsSearchLoading(false);
        }
      };
      
      const timeoutId = setTimeout(fetchApiSearch, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setApiResults([]);
      setIsSearchLoading(false);
    }
  }, [searchTerm]);

  const filteredStocks = Array.from(new Map([
    ...STOCK_LIST.filter(s => 
      s.name.includes(searchTerm) || 
      s.symbol.includes(searchTerm) ||
      (s.industry && s.industry.includes(searchTerm))
    ),
    ...apiResults
  ].map(s => [s.symbol, s])).values()).slice(0, 40);

  return (
    <main className="min-h-screen bg-[#0d1117] text-slate-200 flex flex-col items-center justify-center p-4 overflow-hidden relative font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#F08080]/5 rounded-full blur-[140px]" />
      
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
              className="fixed top-0 left-0 bottom-0 w-[340px] bg-[#161b22] border-r border-white/10 z-[110] p-6 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Star className="text-yellow-500 fill-yellow-500" size={20} />
                  <h2 className="text-xl font-black text-white">즐겨찾기</h2>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={addGroup} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-[#F08080] transition-colors" title="그룹 추가">
                    <Plus size={20} />
                  </button>
                  <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* 그룹 필터 칩 */}
              <div className="flex flex-wrap gap-2 mb-8 pr-2">
                <button 
                  onClick={() => setActiveFilterGroupId(null)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${!activeFilterGroupId ? 'bg-[#F08080] border-[#F08080] text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                >
                  전체보기
                </button>
                {favoriteGroups.map(g => (
                  <button 
                    key={g.id}
                    onClick={() => {
                      setActiveFilterGroupId(g.id);
                      console.log("Filtering by:", g.name, g.id);
                    }}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${activeFilterGroupId === g.id ? 'bg-[#F08080] border-[#F08080] text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                  >
                    {g.name} <span className="opacity-50 ml-1">({g.stocks.length})</span>
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                {/* 미분류 즐겨찾기 섹션 */}
                <div className="space-y-3">
                  <div className="px-1">
                    <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest italic">미분류 (Ungrouped)</h3>
                  </div>
                  <div className="space-y-1.5 ml-1">
                    {ungroupedStocks.length > 0 ? (
                      ungroupedStocks.map((fav) => (
                        <div key={`ungrouped-${fav.symbol}`} className="group relative flex items-center bg-white/10 hover:bg-white/20 border border-rose-500/20 rounded-2xl transition-all overflow-hidden shadow-lg shadow-rose-500/5">
                          <button 
                            onClick={() => selectStock(fav.name, fav.symbol, "CHART")}
                            className="flex-1 py-3 px-4 text-left"
                          >
                            <p className="font-bold text-slate-200 text-sm leading-tight mb-0.5 group-hover:text-rose-400 transition-colors">{fav.name}</p>
                            <p className="text-[10px] text-rose-400/60 font-black tracking-tight uppercase">Fast Access</p>
                          </button>
                          <button 
                            onClick={() => saveUngrouped(ungroupedStocks.filter(s => s.symbol !== fav.symbol))}
                            className="p-4 text-slate-500 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-white/10 italic">
                        <p className="text-[9px]">직접 추가한 종목이 없습니다</p>
                      </div>
                    )}
                  </div>
                </div>

                {favoriteGroups
                  .map((group) => (
                  <div key={group.id} className="space-y-3">
                    <div className="flex items-center justify-between px-1 group/header">
                      {editingGroupId === group.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input 
                            value={editingGroupName} 
                            onChange={(e) => setEditingGroupName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && finishEditGroup()}
                            className="h-8 bg-black/40 border-white/20 text-xs text-white"
                            autoFocus
                          />
                          <button onClick={finishEditGroup} className="text-emerald-400"><Check size={16} /></button>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest">{group.name}</h3>
                          <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                            <button onClick={() => startEditGroup(group)} className="p-1 text-white/20 hover:text-white"><Edit3 size={12} /></button>
                            <button onClick={() => deleteGroup(group.id)} className="p-1 text-white/20 hover:text-rose-400"><Trash2 size={12} /></button>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-1.5 ml-1">
                      {group.stocks.length > 0 ? (
                        group.stocks.map((fav) => (
                          <div key={`${group.id}-${fav.symbol}`} className="group relative flex items-center bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all overflow-hidden">
                            <button 
                              onClick={() => selectStock(fav.name, fav.symbol, "CHART")}
                              className="flex-1 py-3 px-4 text-left"
                            >
                              <p className="font-bold text-slate-200 text-sm leading-tight mb-0.5">{fav.name}</p>
                              <p className="text-[10px] text-white/30 font-medium tracking-tight">시장 데이터 분석 완료</p>
                            </button>
                            <button 
                              onClick={() => {
                                console.log(`Deleting ${fav.symbol} from group ${group.id}`);
                                deleteFavorite(fav.symbol, group.id);
                              }}
                              className="p-4 text-slate-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-white/10">
                          <p className="text-[10px]">이 그룹에 종목이 없습니다</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {favoriteGroups.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                    <Star size={32} className="mb-4 opacity-10" />
                    <p className="text-sm">등록된 즐겨찾기가 없습니다.</p>
                  </div>
                )}
              </div>
              
              <div className="mt-auto pt-6 border-t border-white/5">
                <p className="text-[10px] text-white/20 font-mono text-center uppercase tracking-tighter">VIBE CODING • CHART PUZZLE v0.6.0</p>
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
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedSearchSymbols([]);
                  }}
                  className="w-full h-14 bg-black/20 border-white/10 rounded-2xl pl-12 focus-visible:ring-0"
                />
                
                <AnimatePresence>
                  {(searchTerm || isSearchLoading) && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute top-16 left-0 w-full bg-[#161b22] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">
                      
                      {isSearchLoading && (
                        <div className="p-4 flex items-center justify-center gap-2 border-b border-white/5">
                          <Loader2 size={16} className="animate-spin text-[#F08080]" />
                          <span className="text-xs text-white/40">검색 중...</span>
                        </div>
                      )}
                      
                      {/* 다중 선택 관리 바 */}
                      {selectedSearchSymbols.length > 0 && (
                        <div className="bg-[#F08080]/10 border-b border-white/10 p-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-[10px] font-bold text-[#F08080] whitespace-nowrap">{selectedSearchSymbols.length}종목 선택됨</span>
                            <div className="relative">
                              <select 
                                value={targetAddGroupId}
                                onChange={(e) => setTargetAddGroupId(e.target.value)}
                                className="bg-black/40 border border-white/10 rounded-lg text-[10px] px-2 py-1.5 pr-6 appearance-none text-slate-200 outline-none focus:border-[#F08080] min-w-[80px]"
                              >
                                {favoriteGroups.map(g => (
                                  <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                              </select>
                              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#F08080] pointer-events-none" />
                            </div>
                          </div>
                          <button 
                            onClick={handleMultiAdd}
                            className="bg-[#F08080] hover:bg-[#F08080]/90 text-white text-[10px] font-black px-4 py-1.5 rounded-lg whitespace-nowrap transition-colors"
                          >
                            일괄 추가
                          </button>
                        </div>
                      )}

                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {filteredStocks.map((stock) => {
                          const isSelected = selectedSearchSymbols.includes(stock.symbol);
                          return (
                            <div key={stock.symbol} className="w-full flex items-center hover:bg-white/5 border-b border-white/5 group/row">
                              <button 
                                onClick={(e) => toggleSearchSelection(stock.symbol, e)}
                                className="pl-4 pr-1 py-4 text-slate-600 hover:text-[#F08080] transition-colors"
                              >
                                {isSelected ? <CheckSquare size={18} className="text-[#F08080]" /> : <Square size={18} />}
                              </button>
                              <button onClick={() => selectStock(stock.name, stock.symbol, "CHART")} className="flex-1 px-4 py-4 text-left flex items-center justify-between outline-none group/btn">
                                <span className="font-bold text-slate-200 group-hover/btn:text-rose-400 transition-colors">{stock.name}</span>
                                <div className="flex items-center gap-2">
                                  {stock.industry && <span className="text-[10px] px-2 py-0.5 bg-[#F08080]/10 text-[#F08080] rounded-md border border-[#F08080]/20 font-medium">{stock.industry}</span>}
                                  <span className="text-xs text-slate-500 font-mono tracking-tighter">{stock.symbol}</span>
                                </div>
                              </button>
                              <button onClick={(e) => toggleFavorite(stock, e)} className="p-4 text-gray-500 hover:text-yellow-500 transition-all active:scale-125">
                                <Star className={ungroupedStocks.find(f => f.symbol === stock.symbol) ? "fill-yellow-500 text-yellow-500" : ""} size={18} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
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
            <div className="w-full flex items-center justify-center mb-6 px-4 relative h-16">
              <Button variant="ghost" className="absolute left-4 text-gray-400 hover:text-white" onClick={() => setView("HOME")}><ChevronLeft className="mr-1" /> 홈으로</Button>
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
                  disabled={flatFavorites.length <= 1}
                  className="p-1 sm:p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white disabled:opacity-20 transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="w-4 sm:w-12 h-px" />
                <button 
                  onClick={handleNextFavorite}
                  disabled={flatFavorites.length <= 1}
                  className="p-1 sm:p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white disabled:opacity-20 transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="w-20" />
            </div>
            <div className="w-full min-h-[70vh] h-auto bg-white/5 border border-white/10 rounded-3xl p-4 sm:p-6 backdrop-blur-xl relative pb-20 overflow-visible">
              <PuzzleGame 
                stockData={stockData} 
                isOnlyChart={true} 
                stockName={selectedStock?.name} 
                stockSymbol={selectedStock?.symbol} 
                isTimeWarpTriggered={isTimeWarpTriggered}
              />
              
              <div className="mt-12 flex justify-center z-[100]">
                <Button 
                  onClick={() => setView("GAME")} 
                  className="bg-[#F08080] hover:bg-[#F08080]/90 text-white font-black rounded-3xl h-16 px-14 shadow-2xl shadow-rose-500/30 flex items-center gap-2 text-lg active:scale-95 transition-all outline-none"
                >
                  <Play size={22} fill="currentColor" /> 블라인드 챌린지 시작
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ y: 100 }} 
        animate={{ y: 0 }} 
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-9999 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-full px-8 py-4 flex items-center gap-10 shadow-2xl shadow-black/80"
      >
        <button onClick={() => setView("HOME")} className={`flex flex-col items-center gap-1.5 group transition-all relative ${view === "HOME" ? "scale-110" : "opacity-40 hover:opacity-100"}`}>
          <div className="relative">
            <img src="/icons/v4_home.png" alt="Home" className="w-10 h-10 object-contain transition-all group-hover:scale-110" style={{ filter: view === "HOME" ? "drop-shadow(0 0 12px rgba(240,128,128,0.6))" : "none" }} />
            {view === "HOME" && <motion.div layoutId="tab-dot" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#F08080] rounded-full shadow-[0_0_8px_#F08080]" />}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-tighter transition-colors ${view === "HOME" ? "text-[#F08080]" : "text-white/40"}`}>Home</span>
        </button>
        <button 
          onClick={() => {
            if (selectedStock) { setView("CHART"); setIsTimeWarpTriggered(false); }
            else alert("먼저 종목을 선택해 주세요.");
          }} 
          className={`flex flex-col items-center gap-1.5 group transition-all relative ${view === "CHART" ? "scale-110" : "opacity-40 hover:opacity-100"}`}
        >
          <div className="relative">
            <img src="/icons/v3_chart.png" alt="Chart" className="w-10 h-10 object-contain transition-all group-hover:scale-110" style={{ filter: view === "CHART" ? "drop-shadow(0 0 12px rgba(240,128,128,0.6))" : "none" }} />
            {view === "CHART" && <motion.div layoutId="tab-dot" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#F08080] rounded-full shadow-[0_0_8px_#F08080]" />}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-tighter transition-colors ${view === "CHART" ? "text-[#F08080]" : "text-white/40"}`}>Chart</span>
        </button>
        <button 
          onClick={() => {
            if (selectedStock) { setView("GAME"); setIsTimeWarpTriggered(false); }
            else alert("먼저 종목을 선택해 주세요.");
          }} 
          className={`flex flex-col items-center gap-1.5 group transition-all relative ${view === "GAME" && !isTimeWarpTriggered ? "scale-110" : "opacity-40 hover:opacity-100"}`}
        >
          <div className="relative">
            <img src="/icons/v3_puzzle.png" alt="Puzzle" className="w-10 h-10 object-contain transition-all group-hover:scale-110" style={{ filter: (view === "GAME" && !isTimeWarpTriggered) ? "drop-shadow(0 0 12px rgba(240,128,128,0.6))" : "none" }} />
            {(view === "GAME" && !isTimeWarpTriggered) && <motion.div layoutId="tab-dot" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#F08080] rounded-full shadow-[0_0_8px_#F08080]" />}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-tighter transition-colors ${(view === "GAME" && !isTimeWarpTriggered) ? "text-[#F08080]" : "text-white/40"}`}>Puzzle</span>
        </button>
        <button 
          onClick={() => {
            if (selectedStock) {
              setView("GAME");
              setIsTimeWarpTriggered(true);
            } else {
              alert("먼저 종목을 선택해 주세요.");
            }
          }} 
          className={`flex flex-col items-center gap-1.5 group transition-all relative ${isTimeWarpTriggered ? "scale-110" : "opacity-40 hover:opacity-100"}`}
        >
          <div className="relative">
            <img src="/icons/v3_warp.png" alt="TimeWarp" className="w-10 h-10 object-contain transition-all group-hover:scale-110" style={{ filter: isTimeWarpTriggered ? "drop-shadow(0 0 12px rgba(240,128,128,0.6))" : "none" }} />
            {isTimeWarpTriggered && <motion.div layoutId="tab-dot" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#F08080] rounded-full shadow-[0_0_8px_#F08080]" />}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-tighter transition-colors ${isTimeWarpTriggered ? "text-[#F08080]" : "text-white/40"}`}>Warp</span>
        </button>
      </motion.div>

      <footer className="mt-20 py-20 text-[10px] text-white/20 tracking-widest font-mono uppercase z-50 text-center w-full">VIBE CODING • CHART PUZZLE v0.8.5-stable</footer>
    </main>
  );
}
