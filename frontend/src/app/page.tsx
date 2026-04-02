"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, Play, ChevronLeft, ChevronRight, Loader2, Star, Menu, X, Trash2, 
  GripVertical, Plus, Edit3, Check, CheckSquare, Square, Filter, ChevronDown,
  Bell, LayoutGrid, TrendingUp
} from "lucide-react";
import { PuzzleGame } from "@/components/puzzle/PuzzleGame";
import { motion, AnimatePresence } from "framer-motion";
import StockHeatmap from "@/components/ui/StockHeatmap";
import { TriggerAnalysis } from "@/components/ui/TriggerAnalysis";

// 1.1.0: TradingView 히트맵 위젯 컴포넌트
function TradingViewHeatmapWidget({ dataSource }: { dataSource: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isMounted = React.useRef(false);

  React.useEffect(() => {
    isMounted.current = true;

    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";

    // TradingView 스크립트 삽입 전 div wrapper 생성 (스크립트가 참조할 DOM 구조 유지)
    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container";
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    wrapper.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "exchanges": [],
      "dataSource": dataSource,
      "grouping": "sector",
      "blockSize": "market_cap_basic",
      "blockColor": "change",
      "locale": "kr",
      "symbolUrl": "",
      "colorTheme": "dark",
      "hasTopBar": false,
      "isDataSetEnabled": false,
      "isZoomEnabled": true,
      "hasSymbolTooltip": true,
      "width": "100%",
      "height": "100%"
    });

    // 스크립트 에러를 조용히 처리 (TradingView 내부 에러가 React overlay를 오염시키지 않도록)
    script.onerror = () => {};

    wrapper.appendChild(script);

    // isMounted 확인 후 삽입 (cleanup이 먼저 실행된 경우 삽입 차단)
    if (isMounted.current && containerRef.current) {
      containerRef.current.appendChild(wrapper);
    }

    return () => {
      isMounted.current = false;
      // cleanup: wrapper 제거 (스크립트 실행 이전에 DOM 제거)
      try {
        if (container && wrapper.parentNode === container) {
          container.removeChild(wrapper);
        }
      } catch (_) {}
    };
  }, [dataSource]);

  return (
    <div ref={containerRef} className="w-full h-full bg-black/20 overflow-hidden" />
  );
}

// 1.1.0: 실시간 시장 데이터 연동 커스텀 히트맵
function LiveMarketHeatmap({ type }: { type: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`http://127.0.0.1:8000/api/market/heatmap?type=${type}&pages=2`);
        if (!res.ok) throw new Error("Fetch failed");
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(`${type} data fetch error:`, e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [type]);

  return <StockHeatmap title={type} data={data} loading={loading} />;
}

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

function ProjectApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [view, setView] = useState<"HOME" | "GAME" | "CHART" | "TRIGGER">("HOME");
  const [puzzleKey, setPuzzleKey] = useState(0);
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
  
  // v1.3.0 버전 정보 콘솔 출력
  useEffect(() => {
    console.log("%c Stock Chart Puzzle %c v1.3.0 ", 
      "background: #fb7185; color: white; font-weight: bold; padding: 2px 4px; border-radius: 4px 0 0 4px;",
      "background: #444; color: white; font-weight: bold; padding: 2px 4px; border-radius: 0 4px 4px 0;"
    );
  }, []);

  // v1.1.0 홈 화면 아코디언 상태
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ "all": true });
  const [isMarketExpanded, setIsMarketExpanded] = useState(true);
  const [isGroupSelectorOpen, setIsGroupSelectorOpen] = useState(false);
  const [newGroupInputOpen, setNewGroupInputOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // URL 네비게이션 헬퍼: router.push만 담당하며 setView 등은 아래 useEffect에서 처리
  const navigate = React.useCallback((v: string, s?: string, w: boolean = false) => {
    const params = new URLSearchParams();
    params.set("view", v);
    if (s) params.set("s", s);
    params.set("w", w ? "1" : "0");
    setIsDrawerOpen(false);
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router]);

  // URL 파라미터 감지 및 상태 동기화 (navigate의 유일한 처리 지점)
  React.useEffect(() => {
    const v = searchParams.get("view");
    const s = searchParams.get("s");   // navigate에서 "s"로 씀
    const w = searchParams.get("w") === "1";  // navigate에서 "w"로 씀

    const targetView = (v && ["HOME", "GAME", "CHART", "TRIGGER"].includes(v)) ? v as "HOME" | "GAME" | "CHART" | "TRIGGER" : "HOME";
    setView(targetView);
    setIsTimeWarpTriggered(w);

    if (s) {
      const allStocks = [...STOCK_LIST, ...ungroupedStocks, ...favoriteGroups.flatMap(g => g.stocks)];
      const found = allStocks.find(st => st.symbol === s);
      if (found && (!selectedStock || selectedStock.symbol !== s)) {
        setSelectedStock(found);
        const loadData = async () => {
          try {
            const res = await fetch(`http://127.0.0.1:8000/api/stock/${s}`);
            if (res.ok) {
              const result = await res.json();
              if (result.data) setStockData(result.data);
            }
          } catch (e) {}
        };
        loadData();
      }
    }
  }, [searchParams]);

  React.useEffect(() => {
    
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

  const toggleAccordion = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
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
    // API 호출 및 기본적인 상태 변경 수행 후 URL 업데이트
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
      setIsLoading(false);
      // URL 업데이트 (useEffect에서 setView 등을 최종 처리)
      navigate(mode, symbol, mode === "CHART" && isTimeWarpTriggered);
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
    <>
      <main className="min-h-screen bg-[#0d1117] text-slate-200 flex flex-col items-center justify-center p-4 overflow-hidden relative font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#F08080]/5 rounded-full blur-[140px]" />
      
      {view === "HOME" && (
        <label className="sr-only">Home Menu</label>
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
                <p className="text-[10px] text-white/20 font-mono text-center uppercase tracking-tighter">VIBE CODING • CHART PUZZLE v0.6.1</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        {view === "HOME" ? (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="z-10 w-full max-w-lg flex flex-col items-center px-4 pt-4 pb-32 overflow-y-auto no-scrollbar h-full">
            
            {/* 1. 상단 검색바 섹션 */}
            <div className="w-full mb-8 relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input 
                    placeholder="Search for news or tickers..." 
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setSelectedSearchSymbols([]);
                    }}
                    className="w-full h-12 bg-[#1c2128] border-transparent rounded-2xl pl-12 text-sm focus-visible:ring-0 placeholder:text-gray-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-3 bg-[#1c2128] rounded-full text-gray-400 hover:text-white transition-colors relative">
                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full absolute top-3 right-3" />
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                  </button>
                  <button className="w-11 h-11 bg-gray-600 rounded-full overflow-hidden border-2 border-white/5 hover:border-white/20 transition-all">
                    <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600" />
                  </button>
                </div>
              </div>

              {/* 검색 결과 오버레이 */}
              <AnimatePresence>
                {(searchTerm || isSearchLoading) && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute top-14 left-0 w-full bg-[#1c2128] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[200]">
                    {isSearchLoading && (
                      <div className="p-4 flex items-center justify-center gap-2 border-b border-white/5">
                        <Loader2 size={16} className="animate-spin text-[#F08080]" />
                        <span className="text-xs text-white/40">검색 중...</span>
                      </div>
                    )}
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      {filteredStocks.map((stock) => (
                        <div key={stock.symbol} className="w-full px-4 py-4 flex items-center gap-4 hover:bg-white/5 border-b border-white/5 transition-colors">
                          <button 
                            onClick={(e) => toggleSearchSelection(stock.symbol, e)}
                            className="text-[#F08080]"
                          >
                            {selectedSearchSymbols.includes(stock.symbol) ? (
                              <CheckSquare size={20} className="fill-[#F08080]/10" />
                            ) : (
                              <Square size={20} className="opacity-30" />
                            )}
                          </button>
                          <div className="flex-1">
                            <span className="font-bold text-slate-200 block">{stock.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono italic uppercase tracking-wider">{stock.symbol}</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              // 현재 선택된 종목이 없거나, 클릭한 종목이 선택 목록에 없다면 해당 종목을 선택 목록에 추가/교체
                              if (selectedSearchSymbols.length === 0 || !selectedSearchSymbols.includes(stock.symbol)) {
                                setSelectedSearchSymbols(prev => 
                                  prev.includes(stock.symbol) ? prev : [...prev, stock.symbol]
                                );
                              }
                              setIsGroupSelectorOpen(true);
                            }}
                            className="p-2 bg-white/5 rounded-xl text-gray-500 hover:text-yellow-500 transition-all active:scale-95"
                          >
                            <Star size={18} className={ungroupedStocks.find(f => f.symbol === stock.symbol) ? "fill-yellow-500 text-yellow-500" : ""} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. 시장 정보 히트맵 섹션 (아코디언 적용 및 1행 3열 레이아웃) */}
            <div className="w-full mb-10 px-1">
              <button 
                onClick={() => setIsMarketExpanded(!isMarketExpanded)}
                className="w-full flex items-center justify-between group mb-4"
              >
                <div className="flex items-center gap-2 text-[10px] font-black text-[#F08080] uppercase tracking-widest pl-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  MARKET OVERVIEW (KST)
                </div>
                <ChevronDown 
                  size={16} 
                  className={`text-gray-500 transition-transform duration-300 ${isMarketExpanded ? "rotate-0" : "-rotate-90"}`} 
                />
              </button>

              {isMarketExpanded && (
                <div className="grid grid-cols-1 gap-4 pb-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  {[
                    { name: "S&P 500", type: "SPX500", mode: "widget" },
                    { name: "KOSPI", type: "KOSPI", mode: "custom" },
                    { name: "KOSDAQ", type: "KOSDAQ", mode: "custom" }
                  ].map((index, idx) => (
                    <div key={idx} className="bg-[#1c2128] border border-white/5 rounded-2xl p-4 shadow-xl flex flex-col h-[240px]">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[11px] font-black text-gray-400 tracking-wider uppercase">{index.name}</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          <span className="text-[9px] text-gray-500 font-bold">LIVE</span>
                        </div>
                      </div>
                      <div className="flex-1 bg-black/40 rounded-xl overflow-hidden border border-white/5 relative">
                        {index.mode === "widget" ? (
                          <TradingViewHeatmapWidget dataSource={index.type} />
                        ) : (
                          <LiveMarketHeatmap type={index.type} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. 즐겨찾기 아코디언 섹션 */}
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between px-1 mb-2">
                <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em]">PORTFOLIOS & WATCHLISTS</h3>
                <button title="Options" className="p-1 text-gray-600 hover:text-white"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>
              </div>

              {/* 전체보기 아코디언 */}
              <div className="bg-[#1c2128] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <button 
                  onClick={() => toggleAccordion("all")}
                  className="w-full px-5 py-4 flex items-center justify-between group"
                >
                  <span className="text-sm font-black text-white">My List (전체)</span>
                  <div className={`p-1.5 bg-white/5 rounded-full transition-transform duration-300 ${expandedGroups["all"] ? "rotate-180" : ""}`}>
                    <ChevronDown size={14} className="text-gray-400 group-hover:text-white" />
                  </div>
                </button>
                <AnimatePresence>
                  {expandedGroups["all"] && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-5 pb-4 space-y-1 border-t border-white/5">
                        {ungroupedStocks.length > 0 ? ungroupedStocks.map((fav) => (
                          <div key={fav.symbol} className="flex items-center justify-between py-4 border-b border-white/5 hover:bg-white/5 -mx-5 px-5 transition-colors group/item relative">
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => selectStock(fav.name, fav.symbol, "CHART")}>
                              <div className="flex flex-col">
                                <p className="text-sm font-black text-slate-100 leading-tight group-hover/item:text-rose-400 transition-colors">{fav.name}</p>
                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter">{fav.symbol}</p>
                              </div>
                            </div>

                            {/* 우측 아이콘 및 정보 영역 */}
                            <div className="flex items-center gap-6">
                              {/* 3종 숏컷 아이콘 */}
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => selectStock(fav.name, fav.symbol, "CHART")}
                                  className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all hover:scale-110 active:scale-95 border border-white/5"
                                  title="Chart"
                                >
                                  <img src="/icons/v3_chart.png" alt="Chart" className="w-full h-full object-contain p-1.5" />
                                </button>
                                <button 
                                  onClick={() => selectStock(fav.name, fav.symbol, "GAME")}
                                  className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all hover:scale-110 active:scale-95 border border-white/5"
                                  title="Puzzle"
                                >
                                  <img src="/icons/v3_puzzle.png" alt="Puzzle" className="w-full h-full object-contain p-1.5" />
                                </button>
                                <button 
                                  onClick={() => {
                                    setIsTimeWarpTriggered(true);
                                    selectStock(fav.name, fav.symbol, "CHART");
                                  }}
                                  className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all hover:scale-110 active:scale-95 border border-white/5"
                                  title="Time Warp"
                                >
                                  <img src="/icons/v3_warp.png" alt="Warp" className="w-full h-full object-contain p-1.5" />
                                </button>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="w-16 h-8 opacity-40 group-hover/item:opacity-70 transition-opacity hidden sm:block">
                                  <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                                    <path d="M0,15 Q25,8 50,12 T100,5" fill="none" stroke="#2dd4bf" strokeWidth="2" />
                                  </svg>
                                </div>
                                <div className="text-right min-w-[60px]">
                                  <p className="text-sm font-black text-white">145.23</p>
                                  <div className="bg-rose-500/20 text-rose-400 text-[10px] font-black px-2 py-0.5 rounded-md mt-0.5">-1.28%</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="py-6 text-center text-[11px] text-gray-600 italic">추가된 종목이 없습니다.</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 그룹별 아코디언 */}
              {favoriteGroups.map(group => (
                <div key={group.id} className="bg-[#1c2128] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                  <button 
                    onClick={() => toggleAccordion(group.id)}
                    className="w-full px-5 py-4 flex items-center justify-between group"
                  >
                    <span className="text-sm font-black text-white">{group.name}</span>
                    <div className={`p-1.5 bg-white/5 rounded-full transition-transform duration-300 ${expandedGroups[group.id] ? "rotate-180" : ""}`}>
                      <ChevronDown size={14} className="text-gray-400 group-hover:text-white" />
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedGroups[group.id] && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-5 pb-4 space-y-1 border-t border-white/5">
                          {group.stocks.length > 0 ? group.stocks.map((fav) => (
                            <div key={fav.symbol} className="flex items-center justify-between py-4 border-b border-white/5 hover:bg-white/5 -mx-5 px-5 transition-colors group/item relative">
                              <div className="flex items-center gap-3 cursor-pointer" onClick={() => selectStock(fav.name, fav.symbol, "CHART")}>
                                <div className="flex flex-col">
                                  <p className="text-sm font-black text-slate-100 leading-tight group-hover/item:text-emerald-400 transition-colors">{fav.name}</p>
                                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter">{fav.symbol}</p>
                                </div>
                              </div>

                              {/* 우측 아이콘 및 정보 영역 */}
                              <div className="flex items-center gap-6">
                                {/* 3종 숏컷 아이콘 */}
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => selectStock(fav.name, fav.symbol, "CHART")}
                                    className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all hover:scale-110 active:scale-95 border border-white/5"
                                    title="Chart"
                                  >
                                    <img src="/icons/v3_chart.png" alt="Chart" className="w-full h-full object-contain p-1.5" />
                                  </button>
                                  <button 
                                    onClick={() => selectStock(fav.name, fav.symbol, "GAME")}
                                    className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all hover:scale-110 active:scale-95 border border-white/5"
                                    title="Puzzle"
                                  >
                                    <img src="/icons/v3_puzzle.png" alt="Puzzle" className="w-full h-full object-contain p-1.5" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setIsTimeWarpTriggered(true);
                                      selectStock(fav.name, fav.symbol, "CHART");
                                    }}
                                    className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all hover:scale-110 active:scale-95 border border-white/5"
                                    title="Time Warp"
                                  >
                                    <img src="/icons/v3_warp.png" alt="Warp" className="w-full h-full object-contain p-1.5" />
                                  </button>
                                </div>

                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-8 opacity-40 group-hover/item:opacity-70 transition-opacity hidden sm:block">
                                    <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                                      <path d="M0,5 Q25,18 50,8 T100,12" fill="none" stroke="#fb7185" strokeWidth="2" />
                                    </svg>
                                  </div>
                                  <div className="text-right min-w-[60px]">
                                    <p className="text-sm font-black text-white">313.49</p>
                                    <div className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-md mt-0.5">+1.24%</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )) : (
                            <div className="py-6 text-center text-[11px] text-gray-600 italic">그룹에 등록된 종목이 없습니다.</div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

          </motion.div>
        ) : view === "GAME" ? (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="z-10 w-full max-w-4xl flex flex-col items-center">
            <div className="w-full flex items-center justify-center mb-6 px-4 relative h-16">
            </div>
            <PuzzleGame 
              stockData={stockData} 
              gridSize={2} 
              stockName={selectedStock?.name} 
              stockSymbol={selectedStock?.symbol} 
              key={puzzleKey}
            />
          </motion.div>
        ) : view === "TRIGGER" ? (
          <motion.div key="trigger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="z-10 w-full max-w-4xl flex flex-col items-center">
            <TriggerAnalysis />
          </motion.div>
        ) : (
          <motion.div key="chart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="z-10 w-full max-w-4xl flex flex-col items-center">
            <div className="w-full min-h-[70vh] h-auto bg-white/5 border border-white/10 rounded-3xl p-4 sm:p-6 backdrop-blur-xl relative pb-20 overflow-visible">
              <PuzzleGame 
                stockData={stockData} 
                isOnlyChart={true} 
                stockName={selectedStock?.name} 
                stockSymbol={selectedStock?.symbol} 
                isTimeWarpTriggered={isTimeWarpTriggered}
                onPrevFavorite={handlePrevFavorite}
                onNextFavorite={handleNextFavorite}
                hasMultipleFavorites={flatFavorites.length > 1}
                key={puzzleKey}
              />
              
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      <footer className="mt-48 py-20 text-[10px] text-white/20 tracking-widest font-mono uppercase z-10 text-center w-full pb-32">VIBE CODING • CHART PUZZLE v0.6.1</footer>

      {/* 범용 하단 탭바 (Bottom Tab Bar) */}
      <div className="fixed bottom-0 inset-x-0 z-[5000] px-4 pb-6 pointer-events-none">
        <motion.div 
          initial={{ y: 100 }} 
          animate={{ y: 0 }} 
          className="max-w-md mx-auto bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-2 flex items-center justify-around shadow-3xl pointer-events-auto"
        >
          {/* 홈으로 */}
          <button 
            onClick={() => navigate("HOME")}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${view === "HOME" ? "bg-white/15 ring-1 ring-white/20" : "hover:bg-white/5 opacity-50 hover:opacity-100"}`}
          >
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
              <img src="/icons/v11_home.png" alt="HOME" className="w-full h-full object-contain" />
            </div>
            <span className="text-[10px] font-black text-white tracking-widest mt-0.5">HOME</span>
          </button>

          {/* 차트보기 */}
          <button 
            onClick={() => {
              if (!selectedStock) {
                const flatFavs = [...ungroupedStocks, ...favoriteGroups.flatMap(g => g.stocks)];
                if (flatFavs.length > 0) {
                  selectStock(flatFavs[0].name, flatFavs[0].symbol, "CHART");
                  return;
                }
                alert("분석할 종목을 선택하거나 즐겨찾기를 추가해 주세요!");
                return;
              }
              navigate("CHART", selectedStock.symbol, false);
              setIsTimeWarpTriggered(false);
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${view === "CHART" && !isTimeWarpTriggered ? "bg-white/15 ring-1 ring-white/20" : "hover:bg-white/5 opacity-50 hover:opacity-100"}`}
          >
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
              <img src="/icons/v3_chart.png" alt="CHART" className="w-full h-full object-contain" />
            </div>
            <span className="text-[10px] font-black text-white tracking-widest mt-0.5">CHART</span>
          </button>

          {/* 차트퍼즐 */}
          <button 
            onClick={() => {
              if (view === "GAME") {
                setPuzzleKey(prev => prev + 1);
              }
              if (!selectedStock) {
                const flatFavs = [...ungroupedStocks, ...favoriteGroups.flatMap(g => g.stocks)];
                if (flatFavs.length > 0) {
                  selectStock(flatFavs[0].name, flatFavs[0].symbol, "GAME");
                  return;
                }
                alert("퍼즐을 진행할 종목을 선택하거나 즐겨찾기를 추가해 주세요!");
                return;
              }
              navigate("GAME", selectedStock.symbol);
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${view === "GAME" ? "bg-white/15 ring-1 ring-white/20" : "hover:bg-white/5 opacity-50 hover:opacity-100"}`}
          >
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
              <img src="/icons/v3_puzzle.png" alt="PUZZLE" className="w-full h-full object-contain" />
            </div>
            <span className="text-[10px] font-black text-white tracking-widest mt-0.5">PUZZLE</span>
          </button>

          {/* 타임워프 */}
          <button 
            onClick={() => {
              if (!selectedStock) {
                const flatFavs = [...ungroupedStocks, ...favoriteGroups.flatMap(g => g.stocks)];
                if (flatFavs.length > 0) {
                  selectStock(flatFavs[0].name, flatFavs[0].symbol, "CHART");
                  setIsTimeWarpTriggered(true);
                  // selectStock 내부에서 navigate가 호출됨
                  return;
                }
                alert("타임워프를 실행할 종목을 선택하거나 즐겨찾기를 추가해 주세요!");
                return;
              }
              navigate("CHART", selectedStock.symbol, true);
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${isTimeWarpTriggered ? "bg-white/15 ring-1 ring-white/20 shadow-lg shadow-rose-500/20" : "hover:bg-white/5 opacity-50 hover:opacity-100"}`}
          >
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
              <img src="/icons/v3_warp.png" alt="WARP" className="w-full h-full object-contain" />
            </div>
            <span className="text-[10px] font-black text-white tracking-widest mt-0.5">WARP</span>
          </button>

          {/* 트리거 */}
          <button 
            onClick={() => navigate("TRIGGER")}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${view === "TRIGGER" ? "bg-white/15 ring-1 ring-white/20" : "hover:bg-white/5 opacity-50 hover:opacity-100"}`}
          >
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
              <img src="/icons/v3_trigger.png" alt="TRIGGER" className="w-full h-full object-contain" />
            </div>
            <span className="text-[10px] font-black text-white tracking-widest mt-0.5">TRIGGER</span>
          </button>
        </motion.div>
      </div>
    </main>

    {/* 프리미엄 그룹 선택 바텀 시트 */}
    <AnimatePresence>
      {isGroupSelectorOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsGroupSelectorOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[5000]"
          />
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 inset-x-0 bg-[#1c2128] border-t border-white/10 rounded-t-[2.5rem] z-[5001] p-8 pb-12 shadow-2xl overflow-hidden max-w-lg mx-auto"
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8 opacity-50" />
            
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-white tracking-tight">Select lists</h2>
              <button 
                onClick={() => setIsGroupSelectorOpen(false)}
                className="p-2 text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 mb-8 overflow-y-auto max-h-[300px] no-scrollbar">
              {favoriteGroups.map(group => (
                <button 
                  key={group.id}
                  onClick={() => {
                    setTargetAddGroupId(group.id);
                    // 즉시 실행하거나 Done 버튼으로 실행
                  }}
                  className={`w-full p-5 rounded-2xl flex items-center justify-between transition-all border ${targetAddGroupId === group.id ? 'bg-[#F08080]/10 border-[#F08080] text-[#F08080]' : 'bg-white/5 border-white/5 text-gray-400 opacity-60 hover:opacity-100'}`}
                >
                  <span className="font-bold text-sm">{group.name}</span>
                  {targetAddGroupId === group.id && <Check size={18} />}
                </button>
              ))}

              {newGroupInputOpen ? (
                <div className="flex items-center gap-2 p-2">
                  <Input 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="New list name..."
                    className="flex-1 bg-black/40 border-white/10 h-11 rounded-xl text-sm"
                    autoFocus
                  />
                  <button 
                    onClick={() => {
                      if (newGroupName) {
                        const id = Date.now().toString();
                        saveGroups([{ id, name: newGroupName, stocks: [] }, ...favoriteGroups]);
                        setTargetAddGroupId(id);
                        setNewGroupName("");
                        setNewGroupInputOpen(false);
                      }
                    }}
                    className="p-3 bg-[#F08080] text-white rounded-xl shadow-lg shadow-[#F08080]/20"
                  >
                    <Check size={18} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setNewGroupInputOpen(true)}
                  className="w-full p-4 flex items-center gap-3 text-gray-500 hover:text-white transition-colors group"
                >
                  <div className="w-5 h-5 flex items-center justify-center border border-dashed border-gray-600 rounded group-hover:border-white">
                    <Plus size={14} />
                  </div>
                  <span className="text-sm font-bold">Create new list</span>
                </button>
              )}
            </div>

            <button 
              onClick={() => {
                handleMultiAdd();
                setIsGroupSelectorOpen(false);
              }}
              className="w-full py-4 bg-[#F08080] text-white rounded-2xl text-sm font-black tracking-widest shadow-xl shadow-[#F08080]/20 active:scale-[0.98] transition-all"
            >
              Done
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}

// v1.3.0: URL 내비게이션(뒤로가기 지원)을 위한 Suspense 래퍼
export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <Loader2 className="animate-spin text-rose-400" size={32} />
      </div>
    }>
      <ProjectApp />
    </Suspense>
  );
}

function HomeIcon({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
  );
}
