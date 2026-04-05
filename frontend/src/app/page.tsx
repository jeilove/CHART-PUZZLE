"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, Play, ChevronLeft, ChevronRight, Loader2, Star, Menu, X, Trash2, 
  GripVertical, Plus, Edit3, Check, CheckSquare, Square, Filter, ChevronDown,
  Bell, LayoutGrid, TrendingUp, LogIn, LogOut, User as UserIcon
} from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { PuzzleGame } from "@/components/puzzle/PuzzleGame";
import { motion, AnimatePresence } from "framer-motion";
import StockHeatmap from "@/components/ui/StockHeatmap";
import { TriggerAnalysis } from "@/components/ui/TriggerAnalysis";

// 1.1.0: TradingView 히트맵 위젯 컴포넌트 (v2.8.7: React.memo 적용)
const TradingViewHeatmapWidget = React.memo(function TradingViewHeatmapWidget({ dataSource }: { dataSource: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isMounted = React.useRef(false);

  React.useEffect(() => {
    isMounted.current = true;
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // 이미 같은 데이터 소스로 위젯이 있다면 스킵 (깜빡임 방지)
    if (container.querySelector(`[data-source="${dataSource}"]`)) return;

    container.innerHTML = "";
    
    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container";
    wrapper.setAttribute("data-source", dataSource); // 트래킹용 속성 추가
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

    script.onerror = () => {};
    wrapper.appendChild(script);

    if (isMounted.current && containerRef.current) {
      containerRef.current.appendChild(wrapper);
    }

    return () => {
      isMounted.current = false;
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
});

// 1.1.0: 실시간 시장 데이터 연동 커스텀 히트맵 (v2.8.7: React.memo 적용)
const LiveMarketHeatmap = React.memo(function LiveMarketHeatmap({ type }: { type: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/market/heatmap?type=${type}&pages=2`);
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
});

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
  price?: number;
  change?: number;
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

function SearchResultItem({ 
  stock, onSelect, onGame, onWarp, onCloud, isFavorite, onToggleFavorite, sparklineData = {}, intradayData = {}, small = false, getSparklinePath 
}: { 
  stock: any, onSelect: () => void, onGame: () => void, onWarp: () => void, onCloud: () => void, isFavorite: boolean, onToggleFavorite: (e: any) => void, sparklineData?: any, intradayData?: any, small?: boolean, getSparklinePath: any 
}) {
  return (
    <div className={`bg-white/5 border border-white/5 rounded-3xl ${small ? "p-4" : "p-5"} flex items-center justify-between group transition-all hover:bg-white/10 hover:border-white/10 shadow-lg relative overflow-hidden`}>
      {/* 종목 기본 정보 */}
      <div className="flex flex-col gap-0.5 cursor-pointer flex-1" onClick={onSelect}>
        <p className={`${small ? "text-base" : "text-lg"} font-black text-white leading-tight group-hover:text-rose-400 transition-colors uppercase`}>{stock.name}</p>
        <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">{stock.industry || "General Industry"}</p>
      </div>

      {/* 4종 기능 아이콘 */}
      <div className="flex items-center gap-2 sm:gap-3 mx-4">
        <button onClick={onSelect} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center transition-all hover:scale-110 active:scale-95" title="Chart">
          <img src="/icons/v3_chart.png" alt="Chart" className="w-5 h-5 object-contain" />
        </button>
        <button onClick={onGame} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center transition-all hover:scale-110 active:scale-95" title="Puzzle">
          <img src="/icons/v3_puzzle.png" alt="Puzzle" className="w-5 h-5 object-contain" />
        </button>
        <button onClick={onWarp} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center transition-all hover:scale-110 active:scale-95" title="Time Warp">
          <img src="/icons/v3_warp.png" alt="Warp" className="w-5 h-5 object-contain" />
        </button>
        <button onClick={onCloud} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center transition-all hover:scale-110 active:scale-95" title="Word Cloud">
          <img src="/icons/v17_trigger.png" alt="Cloud" className="w-5 h-5 object-contain scale-[1.2]" />
        </button>
      </div>

      {/* 주가 및 즐겨찾기 */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* 스파크라인 (Search 전용) */}
        <div className="hidden md:flex items-center gap-4">
          {(() => {
            const p1d = intradayData[stock.symbol] || [];
            const p20d = sparklineData[stock.symbol] || [];
            
            // v2.7.0 Skeleton UI: 데이터가 아직 없을 때 보여줄 홀더
            if (p1d.length < 2 || p20d.length < 2) {
              return (
                <>
                  <div className="flex flex-col items-center animate-pulse">
                    <span className="text-[7px] text-gray-500 font-black opacity-10 uppercase mb-0.5">1D</span>
                    <svg className="w-12 h-8" viewBox="0 0 100 20" preserveAspectRatio="none">
                      <rect x="0" y="9.5" width="100" height="1" fill="white" fillOpacity="0.05" />
                    </svg>
                  </div>
                  <div className="flex flex-col items-center border-l border-white/10 pl-3 animate-pulse">
                    <span className="text-[7px] text-gray-500 font-black opacity-10 uppercase mb-0.5">20D</span>
                    <svg className="w-14 h-8" viewBox="0 0 100 20" preserveAspectRatio="none">
                      <rect x="0" y="9.5" width="100" height="1" fill="white" fillOpacity="0.05" />
                    </svg>
                  </div>
                </>
              );
            }
            
            // 1D Baseline: Previous Close
            const prevClose1d = p20d.length >= 2 ? p20d[p20d.length - 2] : p1d[0];
            const maxVal1d = Math.max(...p1d, prevClose1d);
            const minVal1d = Math.min(...p1d, prevClose1d);
            const range1d = maxVal1d - minVal1d || 1;
            const b1d = ((maxVal1d - prevClose1d) / range1d) * 100;
            const gId1d = `search-1d-${stock.symbol}-${Math.random().toString(36).substr(2, 4)}`;
            const s1d = getSparklinePath(p1d);

            // 20D Baseline: 20 Days Ago Price
            const open20d = p20d[0];
            const maxVal20d = Math.max(...p20d);
            const minVal20d = Math.min(...p20d);
            const range20d = maxVal20d - minVal20d || 1;
            const b20d = ((maxVal20d - open20d) / range20d) * 100;
            const gId20d = `search-20d-${stock.symbol}-${Math.random().toString(36).substr(2, 4)}`;
            const s20d = getSparklinePath(p20d);

            return (
              <>
                <div className="flex flex-col items-center">
                  <span className="text-[7px] text-gray-500 font-black opacity-30 uppercase mb-0.5">1D</span>
                  <svg className="w-12 h-8" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id={gId1d} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset={`${b1d}%`} stopColor="#f43f5e" stopOpacity="1" />
                        <stop offset={`${b1d}%`} stopColor="#3b82f6" stopOpacity="1" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1={b1d / 5} x2="100" y2={b1d / 5} stroke="white" strokeWidth="0.5" strokeDasharray="1,1" opacity="0.2" />
                    <path d={s1d} fill="none" stroke={`url(#${gId1d})`} strokeWidth="2" />
                  </svg>
                </div>
                <div className="flex flex-col items-center border-l border-white/10 pl-3">
                  <span className="text-[7px] text-gray-500 font-black opacity-30 uppercase mb-0.5">20D</span>
                  <svg className="w-14 h-8" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id={gId20d} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset={`${b20d}%`} stopColor="#f43f5e" stopOpacity="1" />
                        <stop offset={`${b20d}%`} stopColor="#3b82f6" stopOpacity="1" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1={b20d / 5} x2="100" y2={b20d / 5} stroke="white" strokeWidth="0.5" strokeDasharray="1,1" opacity="0.1" />
                    <path d={s20d} fill="none" stroke={`url(#${gId20d})`} strokeWidth="2" />
                  </svg>
                </div>
              </>
            );
          })()}
        </div>

        <div className="text-right min-w-[65px]">
          <p className="text-sm font-black text-white">{stock.price?.toLocaleString() || "---"}</p>
          <div className={`px-2 py-0.5 rounded-md mt-0.5 text-[9px] font-black inline-block ${stock.change >= 0 ? "bg-rose-500/20 text-rose-400" : "bg-blue-500/20 text-blue-400"}`}>
            {stock.change >= 0 ? `+${stock.change}%` : `${stock.change}%`}
          </div>
        </div>
        <button 
          onClick={onToggleFavorite}
          className="p-2 sm:p-3 bg-white/5 rounded-full text-gray-500 hover:text-yellow-500 transition-all active:scale-90"
        >
          <Star className={isFavorite ? "fill-yellow-500 text-yellow-500" : ""} size={small ? 16 : 20} />
        </button>
      </div>
    </div>
  );
}

function ProjectApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [view, setView] = useState<"HOME" | "GAME" | "CHART" | "TRIGGER">("HOME");
  const [puzzleKey, setPuzzleKey] = useState(0);
  const [miniSearchStr, setMiniSearchStr] = useState("");
  const [isMiniSearchOpen, setIsMiniSearchOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [stockData, setStockData] = useState<any[]>([]); // v2.9.10: 초기 데이터를 빈 배열로 설정하여 가상데이터 노출 방지
  const [isLoading, setIsLoading] = useState(false);
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
  const [isSearchFullScreen, setIsSearchFullScreen] = useState(false);
  const [initialFlipped, setInitialFlipped] = useState(false);
  
  // v2.10.0 버전 정보 콘솔 출력
  useEffect(() => {
    console.log("%c Stock Chart Puzzle %c v2.10.0 ", 
      "background: #fb7185; color: white; font-weight: bold; padding: 2px 4px; border-radius: 4px 0 0 4px;",
      "background: #444; color: white; font-weight: bold; padding: 2px 4px; border-radius: 0 4px 4px 0;"
    );
  }, []);

  // v1.1.0 홈 화면 아코디언 상태
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ "all": true });
  const [searchExpandedGroups, setSearchExpandedGroups] = useState<Record<string, boolean>>({});
  const [isMarketExpanded, setIsMarketExpanded] = useState(true);
  const [isGroupSelectorOpen, setIsGroupSelectorOpen] = useState(false);
  const [lastRemovedFavoriteLocation, setLastRemovedFavoriteLocation] = useState<Record<string, string>>({});
  const [searchBaseStocks, setSearchBaseStocks] = useState<Stock[]>([]);
  const [searchGroupSnapshot, setSearchGroupSnapshot] = useState<Record<string, string>>({}); // symbol -> groupId
  const [newGroupInputOpen, setNewGroupInputOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [sparklineData, setSparklineData] = useState<Record<string, number[]>>({});
  const [intradayData, setIntradayData] = useState<Record<string, number[]>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [apiResults, setApiResults] = useState<any[]>([]);

  const filteredStocks = useMemo(() => {
    // [v1.6.7] 검색어가 없을 때는 초기 스냅샷(searchBaseStocks)을 사용하여 리스트 안정성 확보
    if (!searchTerm) {
      return searchBaseStocks;
    }

    return Array.from(new Map([
      ...STOCK_LIST.filter(s => 
        s.name.includes(searchTerm) || 
        s.symbol.includes(searchTerm) ||
        (s.industry && s.industry.includes(searchTerm))
      ),
      ...apiResults
    ].map(s => [s.symbol, s])).values()).slice(0, 40);
  }, [searchTerm, searchBaseStocks, apiResults]);

  // v2.7.0: 미니 차트(스파크라인) 및 당일 분봉 데이터 일괄 로드 (디바운싱 및 의존성 최적화)
  useEffect(() => {
    const fetchSparklines = async () => {
      const allSymbols = [
        ...ungroupedStocks.map(s => s.symbol),
        ...favoriteGroups.flatMap(g => g.stocks.map(s => s.symbol)),
        ...filteredStocks.map(s => s.symbol)
      ].filter((v, i, a) => a.indexOf(v) === i); // 중복 제거

      if (allSymbols.length === 0) return;

      // 이미 로드된 데이터 제외 (성능 최적화)
      const missingSymbols = allSymbols.filter(s => !sparklineData[s]);
      const missingIntraday = allSymbols.filter(s => !intradayData[s]);

      if (missingSymbols.length === 0 && missingIntraday.length === 0) return;

      // Batch 20D (Sparklines)
      if (missingSymbols.length > 0) {
        try {
          const res = await fetch(`/api/stock/sparkline/batch?symbols=${missingSymbols.join(",")}&timeframe=day&count=20`);
          if (res.ok) {
            const result = await res.json();
            setSparklineData(prev => ({ ...prev, ...result }));
          }
        } catch (e) {}
      }

      // Batch 1D (Intraday)
      if (missingIntraday.length > 0) {
        try {
          const res = await fetch(`/api/stock/sparkline/batch?symbols=${missingIntraday.join(",")}&timeframe=minute&count=400`);
          if (res.ok) {
            const result = await res.json();
            setIntradayData(prev => ({ ...prev, ...result }));
          }
        } catch (e) {}
      }
    };

    // 타율 형 데이터인 경우 실시간 반영을 위해 0ms 딜레이, 검색 엔진인 경우 부하 방지를 위해 300ms 딜레이
    const delay = (searchTerm && searchTerm.length > 0) ? 300 : 0;
    const timeoutId = setTimeout(fetchSparklines, delay);
    return () => clearTimeout(timeoutId);
  }, [ungroupedStocks, favoriteGroups, filteredStocks, searchTerm]);

  // v1.7.5: 스파크라인 SVG 경로 생성 헬퍼
  const getSparklinePath = (prices: number[], width: number = 100, height: number = 20) => {
    if (!prices || prices.length < 2) return "M0,10 L100,10";
    
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    
    const points = prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * width;
      const y = height - ((p - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    
    return `M${points.join(" L")}`;
  };

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
    // [v1.6.1] Navigation context check: keep search screen active if navigating from it
    // if (!v || v === "HOME") setInitialFlipped(false);

    if (s) {
      const allStocks = [...STOCK_LIST, ...ungroupedStocks, ...favoriteGroups.flatMap(g => g.stocks)];
      const found = allStocks.find(st => st.symbol === s);
      if (found && (!selectedStock || selectedStock.symbol !== s)) {
        setSelectedStock(found);
        const loadData = async () => {
          try {
            const res = await fetch(`/api/stock/${s}?t=${Date.now()}`);
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

  const { data: session, status } = useSession();

  // v2.9.7: DB 연동 및 Vercel 404 안정화 (force-dynamic)
  useEffect(() => {
    const loadFavorites = async () => {
      // 1. 로그인 상태인 경우 DB에서 먼저 가져옴
      if (status === "authenticated") {
        try {
          const res = await fetch("/api/user/sync");
          if (res.ok) {
            const data = await res.json();
            if (data.favoriteGroups.length > 0 || data.ungroupedStocks.length > 0) {
              // DB 그룹이 비어있는 깡통(stocks: [])인지, 실제 종목이 있는지 검사
              const hasStocksInDB = data.ungroupedStocks.length > 0 || data.favoriteGroups.some((g: any) => g.stocks && g.stocks.length > 0);
              
              if (hasStocksInDB) {
                setFavoriteGroups(data.favoriteGroups);
                setUngroupedStocks(data.ungroupedStocks);
                if (data.favoriteGroups.length > 0) setTargetAddGroupId(data.favoriteGroups[0].id);
                return; // DB 데이터 로드 성공 시 로컬스토리지 무시
              }
            }
          }
        } catch (e) {
          console.error("DB Load failed:", e);
        }
      }

      // 2. 비로그인이거나 DB 데이터가 없는 경우 로컬스토리지 사용
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
        const compat = Array.isArray(parsedOld) ? parsedOld : [];
        setUngroupedStocks(compat);
        localStorage.setItem("puzzle-ungrouped-stocks", JSON.stringify(compat));
      } else {
        // v2.9.8: 완전 제3자(신규 비로그인 방문자)인 경우 관리자 템플릿 로컬 복제
        try {
          const res = await fetch("/api/market/default-favorites");
          if (res.ok) {
            const data = await res.json();
            if (data.favoriteGroups.length > 0 || data.ungroupedStocks.length > 0) {
              const groupsToSet = data.favoriteGroups.length > 0 ? data.favoriteGroups : [{ id: "default", name: "관리자 추천 그룹", stocks: [] }];
              setFavoriteGroups(groupsToSet);
              if (data.ungroupedStocks) setUngroupedStocks(data.ungroupedStocks);
              setTargetAddGroupId(groupsToSet[0].id);
              return; // 성공 시 그대로 렌더링
            }
          }
        } catch (e) {
          console.error("Failed to load default templates:", e);
        }

        // 모든 것에 실패한 완전 초기 텅 빈 상태
        const initialGroups: FavoriteGroup[] = [{ id: "default", name: "기본 그룹", stocks: [] }];
        setFavoriteGroups(initialGroups);
        setTargetAddGroupId("default");
      }
    };

    if (status !== "loading") {
      loadFavorites();
    }
  }, [status]);

  // v2.8.9: 즐겨찾기 변경 시 DB와 자동 동기화 (데스크톱/모바일 동시 연동)
  useEffect(() => {
    if (status !== "authenticated") return;
    
    const sync = async () => {
      try {
        await fetch("/api/user/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ favoriteGroups, ungroupedStocks })
        });
      } catch (e) {
        console.error("Sync failed:", e);
      }
    };

    const timeoutId = setTimeout(sync, 1000);
    return () => clearTimeout(timeoutId);
  }, [favoriteGroups, ungroupedStocks, status]);

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

  const smartToggleFavorite = (stock: Stock, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 1. 현재 즐겨찾기 상태 확인
    const inUngrouped = ungroupedStocks.find(s => s.symbol === stock.symbol);
    const inGroup = favoriteGroups.find(g => g.stocks.some(s => s.symbol === stock.symbol));
    
    if (inUngrouped || inGroup) {
      // 이미 즐겨찾기임 -> 해제 (Toggle Off)
      const location = inUngrouped ? "ungrouped" : inGroup?.id || "ungrouped";
      setLastRemovedFavoriteLocation(prev => ({ ...prev, [stock.symbol]: location }));
      
      if (inUngrouped) {
        saveUngrouped(ungroupedStocks.filter(s => s.symbol !== stock.symbol));
      } else if (inGroup) {
        saveGroups(favoriteGroups.map(g => g.id === inGroup.id ? { ...g, stocks: g.stocks.filter(s => s.symbol !== stock.symbol) } : g));
      }
    } else {
      // 즐겨찾기 아님 -> 복구 혹은 신규 추가
      const lastLocation = lastRemovedFavoriteLocation[stock.symbol];
      if (lastLocation) {
        // 이전 위치로 복구
        if (lastLocation === "ungrouped") {
          saveUngrouped([...ungroupedStocks, stock]);
        } else {
          saveGroups(favoriteGroups.map(g => g.id === lastLocation ? { ...g, stocks: [...g.stocks, stock] } : g));
        }
      } else {
        // 첫 추가 -> 그룹 드로어 열기
        setSelectedSearchSymbols([stock.symbol]);
        setIsGroupSelectorOpen(true);
      }
    }
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
    
    if (targetAddGroupId === "ungrouped") {
      const existingSymbols = ungroupedStocks.map(s => s.symbol);
      const uniqueNewStocks = stocksToAdd.filter(s => !existingSymbols.includes(s.symbol));
      saveUngrouped([...ungroupedStocks, ...uniqueNewStocks]);
    } else {
      const newGroups = favoriteGroups.map(g => {
        if (g.id === targetAddGroupId) {
          const existingSymbols = g.stocks.map(s => s.symbol);
          const uniqueNewStocks = stocksToAdd.filter(s => !existingSymbols.includes(s.symbol));
          return { ...g, stocks: [...g.stocks, ...uniqueNewStocks] };
        }
        return g;
      });
      saveGroups(newGroups);
    }
    
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
      const response = await fetch(`/api/stock/${symbol}?t=${Date.now()}`);
      if (!response.ok) throw new Error("API 실패");
      const result = await response.json();
      if (result.data) setStockData(result.data);
    } catch (e) {
      setStockData([]); // v2.10.0: 가상데이터 노출 방지를 위해 에러 시에도 빈 데이터 세팅
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

  // [v1.6.7] 검색 전용 베이스 종목 및 그룹 맵핑 스냅샷
  React.useEffect(() => {
    if (isSearchFullScreen && !searchTerm) {
      const currentUngrouped = [...ungroupedStocks];
      const currentGroups = [...favoriteGroups];
      
      const allFavs = Array.from(new Map([
        ...currentUngrouped,
        ...currentGroups.flatMap(g => g.stocks)
      ].map(s => [s.symbol, s])).values());
      
      const newMapping: Record<string, string> = {};
      currentUngrouped.forEach(s => { newMapping[s.symbol] = "ungrouped"; });
      currentGroups.forEach(g => {
        g.stocks.forEach(s => { newMapping[s.symbol] = g.id; });
      });

      setSearchBaseStocks(prev => {
        const merged = Array.from(new Map([...prev, ...allFavs].map(s => [s.symbol, s])).values());
        return merged;
      });
      
      setSearchGroupSnapshot(prev => ({ ...newMapping, ...prev }));
    }
  }, [isSearchFullScreen, searchTerm]); // favoriteGroups 의존성 제거하여 세션 중 위치 고정
  React.useEffect(() => {
    if (searchTerm.length >= 1) {
      const fetchApiSearch = async () => {
        setIsSearchLoading(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
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
                <p className="text-[10px] text-white/20 font-mono text-center uppercase tracking-tighter">VIBE CODING • CHART PUZZLE v2.8.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* 1. 홈 화면 (Persistent Rendering): 히트맵 및 위젯의 상시 마운트를 유지하여 화면 전환 시 버벅임과 재로딩 완전 박멸 */}
      <div className={view === "HOME" ? "z-10 w-full flex flex-col items-center h-full overflow-hidden" : "hidden h-0"}>
        <motion.div 
          animate={{ opacity: view === "HOME" ? 1 : 0 }} 
          transition={{ duration: 0.4 }} 
          className="w-full max-w-lg flex flex-col items-center px-4 pt-4 pb-32 overflow-y-auto no-scrollbar h-full"
        >
            
            {/* 1. 상단 검색바 섹션 */}
            <div className="w-full mb-8 relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input 
                    placeholder="Search for news or tickers..." 
                    value={searchTerm}
                    onFocus={() => setIsSearchFullScreen(true)}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setSelectedSearchSymbols([]);
                    }}
                    className="w-full h-12 bg-[#1c2128] border-transparent rounded-2xl pl-12 text-sm focus-visible:ring-0 placeholder:text-gray-500"
                  />
                </div>
                {/* 2.8.8: Google 로그인/로그아웃 버튼 */}
                <button 
                  onClick={() => session ? signOut() : signIn("google")}
                  className="w-12 h-12 bg-[#1c2128] border-transparent rounded-2xl flex items-center justify-center hover:bg-[#2d333b] transition-all relative group/user"
                  title={session ? "로그아웃" : "구글 로그인"}
                >
                  {session?.user?.image ? (
                    <div className="relative">
                      <img src={session.user.image} alt="Profile" className="w-8 h-8 rounded-full border border-white/10" />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#1c2128] rounded-full" />
                    </div>
                  ) : (
                    <LogIn size={20} className="text-gray-400 group-hover/user:text-[#F08080] transition-colors" />
                  )}
                </button>
              </div>

              {/* 검색 결과 오버레이 */}
              <AnimatePresence>
                {isSearchFullScreen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.95 }} 
                    className="fixed inset-0 bg-[#0d1117] z-1000 flex flex-col p-6 overflow-hidden"
                  >
                    {/* 상단 검색 컨트롤 헤더 */}
                    <div className="flex items-center gap-4 mb-8">
                      <button 
                        onClick={() => {
                          setIsSearchFullScreen(false);
                          setSearchTerm("");
                        }}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-90"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <Input 
                          autoFocus
                          placeholder="어떤 종목을 찾으시나요?" 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full h-14 bg-white/5 border-white/10 rounded-3xl pl-14 text-lg font-bold text-white focus-visible:ring-0 placeholder:text-gray-600 shadow-2xl"
                        />
                        {isSearchLoading && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 className="animate-spin text-rose-500" size={20} />
                          </div>
                        )}
                      </div>
                    </div>
                    {/* 그룹화된 검색 결과 리스트 */}
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-20">
                      {filteredStocks.length > 0 ? (
                        <>
                          {/* 1. 미분류 종목 (Snapshotted) */}
                          {(() => {
                            const ungroupedInSearch = filteredStocks.filter(s => 
                              searchGroupSnapshot[s.symbol] === "ungrouped" || !searchGroupSnapshot[s.symbol]
                            );
                            if (ungroupedInSearch.length === 0) return null;
                            return (
                              <div className="space-y-3">
                                <div className="px-1 mb-2">
                                  <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] italic">미분류 / 신규 종목</h3>
                                </div>
                                {ungroupedInSearch.map((stock) => (
                                  <SearchResultItem 
                                    key={stock.symbol} 
                                    stock={stock} 
                                    isFavorite={ungroupedStocks.some(f => f.symbol === stock.symbol) || favoriteGroups.some(g => g.stocks.some(gs => gs.symbol === stock.symbol))}
                                    onSelect={() => selectStock(stock.name, stock.symbol, "CHART")}
                                    onGame={() => selectStock(stock.name, stock.symbol, "GAME")}
                                    onWarp={() => { setIsTimeWarpTriggered(true); selectStock(stock.name, stock.symbol, "CHART"); }}
                                    onCloud={() => { setInitialFlipped(true); selectStock(stock.name, stock.symbol, "CHART"); }}
                                    onToggleFavorite={(e) => {
                                      smartToggleFavorite(stock, e);
                                    }}
                                    sparklineData={sparklineData}
                                    intradayData={intradayData}
                                    getSparklinePath={getSparklinePath}
                                  />
                                ))}
                              </div>
                            );
                          })()}

                          {/* 2. 그룹별 종목 (Snapshotted Accordions) */}
                          {favoriteGroups.map(group => {
                            // 현재 그룹 스냅샷에 속한 모든 종목 추출
                            const stocksInGroup = filteredStocks.filter(s => 
                              searchGroupSnapshot[s.symbol] === group.id
                            );
                            if (stocksInGroup.length === 0) return null;
                            
                            const isExpanded = searchExpandedGroups[group.id] ?? true;

                            return (
                              <div key={group.id} className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl">
                                <button 
                                  onClick={() => setSearchExpandedGroups(prev => ({ ...prev, [group.id]: !isExpanded }))}
                                  className="w-full px-6 py-5 flex items-center justify-between group bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-[#F08080] rounded-full" />
                                    <span className="text-base font-black text-white">{group.name}</span>
                                    <span className="text-xs text-gray-500 opacity-50">({stocksInGroup.length})</span>
                                  </div>
                                  <div className={`p-1.5 bg-white/10 rounded-full transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
                                    <ChevronDown size={14} className="text-gray-400 group-hover:text-white" />
                                  </div>
                                </button>
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div 
                                      initial={{ height: 0, opacity: 0 }} 
                                      animate={{ height: "auto", opacity: 1 }} 
                                      exit={{ height: 0, opacity: 0 }} 
                                      className="overflow-hidden"
                                    >
                                      <div className="px-4 pb-5 space-y-2 border-t border-white/5 pt-4 bg-black/20">
                                        {stocksInGroup.map((stock) => (
                                          <SearchResultItem 
                                            key={stock.symbol} 
                                            stock={stock} 
                                            isFavorite={ungroupedStocks.some(f => f.symbol === stock.symbol) || favoriteGroups.some(g => g.stocks.some(gs => gs.symbol === stock.symbol))}
                                            small
                                            onSelect={() => selectStock(stock.name, stock.symbol, "CHART")}
                                            onGame={() => selectStock(stock.name, stock.symbol, "GAME")}
                                            onWarp={() => { setIsTimeWarpTriggered(true); selectStock(stock.name, stock.symbol, "CHART"); }}
                                            onCloud={() => { setInitialFlipped(true); selectStock(stock.name, stock.symbol, "CHART"); }}
                                            onToggleFavorite={(e) => {
                                              smartToggleFavorite(stock, e);
                                            }}
                                            sparklineData={sparklineData}
                                            intradayData={intradayData}
                                            getSparklinePath={getSparklinePath}
                                          />
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-40 text-gray-600">
                          <Search size={48} className="mb-4 opacity-10" />
                          <p className="text-sm font-bold opacity-30 tracking-tight italic">
                            {searchTerm ? "검색 결과가 없습니다" : "종목명을 입력하세요"}
                          </p>
                        </div>
                      )}
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
                                <div className="flex items-center gap-4 group-hover/item:opacity-100 transition-opacity hidden sm:flex">
                                  {/* 당일 등락 (Intraday) - 시초가 기준 동적 그라데이션 */}
                                  <div className="flex flex-row items-center gap-3">
                                    <div className="flex flex-col items-center">
                                      <span className="text-[7px] text-gray-500 font-black opacity-30 uppercase mb-0.5 tracking-tight">1D</span>
                                      {(() => {
                                        const prices = intradayData[fav.symbol] || [];
                                        const dailyPrices = sparklineData[fav.symbol] || [];
                                        if (prices.length < 2) return <div className="w-16 h-8 bg-white/5 rounded-lg animate-pulse" />;
                                        
                                        // v2.3.4: 1D 기준점은 '전일 종가' (dailyPrices의 마지막에서 두 번째 값)
                                        const prevClose = dailyPrices.length >= 2 ? dailyPrices[dailyPrices.length - 2] : prices[0];
                                        const min = Math.min(...prices, prevClose);
                                        const max = Math.max(...prices, prevClose);
                                        const range = max - min || 1;
                                        const baseline = ((max - prevClose) / range) * 100;
                                        const gradId = `grad-1d-${fav.symbol}-${Math.random().toString(36).substr(2, 4)}`;
                                        const strokePath = getSparklinePath(prices);
                                        
                                        return (
                                          <svg className="w-16 h-10" viewBox="0 0 100 20" preserveAspectRatio="none">
                                            <defs>
                                              <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset={`${baseline}%`} stopColor="#f43f5e" stopOpacity="1" />
                                                <stop offset={`${baseline}%`} stopColor="#3b82f6" stopOpacity="1" />
                                              </linearGradient>
                                            </defs>
                                            {/* 전일 종가 기준선 (점선) */}
                                            <line x1="0" y1={baseline / 5} x2="100" y2={baseline / 5} stroke="white" strokeWidth="0.5" strokeDasharray="1,1" opacity="0.3" />
                                            <path d={strokePath} fill="none" stroke={`url(#${gradId})`} strokeWidth="2" />
                                          </svg>
                                        );
                                      })()}
                                    </div>
                                    
                                    {/* 20일 등락 (Daily) - 첫날 거래일 대비 동적 색상 전환 */}
                                    <div className="flex flex-col items-center border-l border-white/10 pl-3">
                                      <span className="text-[7px] text-gray-500 font-black opacity-30 uppercase mb-0.5 tracking-tight">20D</span>
                                      {(() => {
                                        const prices = sparklineData[fav.symbol] || [];
                                        if (prices.length < 2) return <div className="w-16 h-8 bg-white/5 rounded-lg animate-pulse" />;
                                        const open20 = prices[0]; // 20일 전 첫 가격
                                        const min20 = Math.min(...prices);
                                        const max20 = Math.max(...prices);
                                        const range20 = max20 - min20 || 1;
                                        const baseline20 = ((max20 - open20) / range20) * 100;
                                        const gradId20 = `grad-20d-${fav.symbol}-${Math.random().toString(36).substr(2, 4)}`;
                                        const strokePath20 = getSparklinePath(prices);
                                        
                                        return (
                                          <svg className="w-16 h-10" viewBox="0 0 100 20" preserveAspectRatio="none">
                                            <defs>
                                              <linearGradient id={gradId20} x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset={`${baseline20}%`} stopColor="#f43f5e" stopOpacity="1" />
                                                <stop offset={`${baseline20}%`} stopColor="#3b82f6" stopOpacity="1" />
                                              </linearGradient>
                                            </defs>
                                            <line x1="0" y1={baseline20 / 5} x2="100" y2={baseline20 / 5} stroke="white" strokeWidth="0.5" strokeDasharray="1,1" opacity="0.2" />
                                            <path d={strokePath20} fill="none" stroke={`url(#${gradId20})`} strokeWidth="2" />
                                          </svg>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right min-w-[60px]">
                                  <p className="text-sm font-black text-white">
                                    {sparklineData[fav.symbol]?.slice(-1)[0]?.toLocaleString() || fav.price?.toLocaleString() || "---"}
                                  </p>
                                  {(() => {
                                    const prices = sparklineData[fav.symbol] || [];
                                    const latest = prices[prices.length - 1];
                                    const prev = prices[prices.length - 2];
                                    const change = prev ? ((latest - prev) / prev * 100).toFixed(2) : (fav.change || 0);
                                    const isUp = Number(change) >= 0;
                                    return (
                                      <div className={`${isUp ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"} text-[10px] font-black px-2 py-0.5 rounded-md mt-0.5`}>
                                        {isUp ? "+" : ""}{change}%
                                      </div>
                                    );
                                  })()}
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
                                  <div className="flex items-center gap-4 group-hover/item:opacity-100 transition-opacity hidden sm:flex">
                                    {/* 당일 등락 (Intraday) 및 20일 등락 */}
                                    <div className="flex flex-row items-center gap-3">
                                      <div className="flex flex-col items-center">
                                        <span className="text-[7px] text-gray-500 font-black opacity-30 uppercase mb-0.5 tracking-tight">1D</span>
                                        {(() => {
                                          const prices = intradayData[fav.symbol] || [];
                                          const dailyPrices = sparklineData[fav.symbol] || [];
                                          if (prices.length < 2) return <div className="w-16 h-8 bg-white/5 rounded-lg animate-pulse" />;
                                          const prevClose = dailyPrices.length >= 2 ? dailyPrices[dailyPrices.length - 2] : prices[0];
                                          const min = Math.min(...prices, prevClose);
                                          const max = Math.max(...prices, prevClose);
                                          const range = max - min || 1;
                                          const baseline = ((max - prevClose) / range) * 100;
                                          const gradId = `grad-group-1d-${fav.symbol}-${Math.random().toString(36).substr(2, 4)}`;
                                          const strokePath = getSparklinePath(prices);
                                          
                                          return (
                                            <svg className="w-16 h-10" viewBox="0 0 100 20" preserveAspectRatio="none">
                                              <defs>
                                                <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
                                                  <stop offset={`${baseline}%`} stopColor="#f43f5e" stopOpacity="1" />
                                                  <stop offset={`${baseline}%`} stopColor="#3b82f6" stopOpacity="1" />
                                                </linearGradient>
                                              </defs>
                                              <line x1="0" y1={baseline / 5} x2="100" y2={baseline / 5} stroke="white" strokeWidth="0.5" strokeDasharray="1,1" opacity="0.3" />
                                              <path d={strokePath} fill="none" stroke={`url(#${gradId})`} strokeWidth="2" />
                                            </svg>
                                          );
                                        })()}
                                      </div>
                                      <div className="flex flex-col items-center border-l border-white/10 pl-3">
                                        <span className="text-[7px] text-gray-500 font-black opacity-30 uppercase mb-0.5 tracking-tight">20D</span>
                                        {(() => {
                                          const prices = sparklineData[fav.symbol] || [];
                                          if (prices.length < 2) return <div className="w-16 h-8 bg-white/5 rounded-lg animate-pulse" />;
                                          const open20 = prices[0];
                                          const min20 = Math.min(...prices);
                                          const max20 = Math.max(...prices);
                                          const range20 = max20 - min20 || 1;
                                          const baseline20 = ((max20 - open20) / range20) * 100;
                                          const gradId20 = `grad-group-20d-${fav.symbol}-${Math.random().toString(36).substr(2, 4)}`;
                                          const strokePath20 = getSparklinePath(prices);
                                          
                                          return (
                                            <svg className="w-16 h-10" viewBox="0 0 100 20" preserveAspectRatio="none">
                                              <defs>
                                                <linearGradient id={gradId20} x1="0%" y1="0%" x2="0%" y2="100%">
                                                  <stop offset={`${baseline20}%`} stopColor="#f43f5e" stopOpacity="1" />
                                                  <stop offset={`${baseline20}%`} stopColor="#3b82f6" stopOpacity="1" />
                                                </linearGradient>
                                              </defs>
                                              <line x1="0" y1={baseline20 / 5} x2="100" y2={baseline20 / 5} stroke="white" strokeWidth="0.5" strokeDasharray="1,1" opacity="0.2" />
                                              <path d={strokePath20} fill="none" stroke={`url(#${gradId20})`} strokeWidth="2" />
                                            </svg>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right min-w-[60px]">
                                    <p className="text-sm font-black text-white">
                                      {sparklineData[fav.symbol]?.slice(-1)[0]?.toLocaleString() || fav.price?.toLocaleString() || "---"}
                                    </p>
                                    {(() => {
                                      const prices = sparklineData[fav.symbol] || [];
                                      const latest = prices[prices.length - 1];
                                      const prev = prices[prices.length - 2];
                                      const change = prev ? ((latest - prev) / prev * 100).toFixed(2) : (fav.change || 0);
                                      const isUp = Number(change) >= 0;
                                      return (
                                        <div className={`${isUp ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"} text-[10px] font-black px-2 py-0.5 rounded-md mt-0.5`}>
                                          {isUp ? "+" : ""}{change}%
                                        </div>
                                      );
                                    })()}
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
      </div>
      
      {/* 2. 기타 기능 화면 (Conditional Rendering): 전환 애니메이션 무결성 유지 */}
      <AnimatePresence mode="wait">
        {view === "GAME" ? (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="z-10 w-full max-w-5xl flex flex-col items-center">
            {/* Global Search Header for Game View */}
            <div className="w-full mb-6 sticky top-0 z-[6000] px-1 group">
               <div className="relative group">
                 <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/50 to-blue-500/50 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                 <div className="relative flex items-center bg-[#0d1117]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-1 shadow-2xl">
                    <div className="pl-4 pr-2 text-emerald-400 opacity-60">
                      <Search size={18} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="분석할 종목을 입력하세요"
                      value={miniSearchStr}
                      onChange={(e) => {
                        setMiniSearchStr(e.target.value);
                        setSearchTerm(e.target.value); // Sync with global filter logic
                      }}
                      onFocus={() => setIsMiniSearchOpen(true)}
                      className="bg-transparent border-none focus:ring-0 text-white text-sm w-full py-3 font-bold placeholder:text-gray-500 tracking-tight"
                    />
                    {miniSearchStr && (
                      <button onClick={() => setMiniSearchStr("")} className="px-3 text-gray-500 hover:text-white transition-colors">
                        <X size={16} />
                      </button>
                    )}
                 </div>
                 
                 {/* Mini Search Dropdown */}
                 {isMiniSearchOpen && miniSearchStr && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-[#0d1117] border border-white/10 rounded-3xl overflow-hidden shadow-3xl max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-3xl z-[7000]">
                      <div className="p-3 border-b border-white/5 bg-white/5">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2">SEARCH RESULTS</span>
                      </div>
                      {filteredStocks.length > 0 ? (
                        <div className="p-3 space-y-2">
                          {filteredStocks.slice(0, 8).map((s) => (
                            <SearchResultItem 
                              key={s.symbol}
                              stock={s}
                              isFavorite={ungroupedStocks.some(f => f.symbol === s.symbol) || favoriteGroups.some(g => g.stocks.some(gs => gs.symbol === s.symbol))}
                              small
                              onSelect={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); navigate("GAME", s.symbol); }}
                              onGame={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); navigate("GAME", s.symbol); }}
                              onWarp={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); setIsTimeWarpTriggered(true); navigate("CHART", s.symbol); }}
                              onCloud={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); setInitialFlipped(true); navigate("CHART", s.symbol); }}
                              onToggleFavorite={(e) => smartToggleFavorite(s, e)}
                              sparklineData={sparklineData}
                              intradayData={intradayData}
                              getSparklinePath={getSparklinePath}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="py-10 text-center text-gray-600 italic text-sm">결과가 없습니다</div>
                      )}
                    </div>
                 )}
               </div>
            </div>

            <div className="w-full bg-[#0d1117]/60 border border-white/10 rounded-[3rem] p-4 sm:p-8 backdrop-blur-3xl relative pb-24 shadow-3xl min-h-[75vh]">
              <div className="absolute top-6 left-6 z-[1000]">
                <button 
                  onClick={() => navigate("HOME")}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-95 flex items-center gap-2 border border-white/5 shadow-xl"
                >
                  <ChevronLeft size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">EXIT</span>
                </button>
              </div>
              <div className="pt-8">
                <PuzzleGame 
                  stockData={stockData} 
                  gridSize={2} 
                  stockName={selectedStock?.name} 
                  stockSymbol={selectedStock?.symbol} 
                  key={`${puzzleKey}-${selectedStock?.symbol}`}
                  initialFlipped={initialFlipped}
                  isSearchFullScreen={isSearchFullScreen}
                  onBackToSearch={() => setView("HOME")}
                />
              </div>
            </div>
          </motion.div>
        ) : view === "TRIGGER" ? (
          <motion.div key="trigger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="z-10 w-full max-w-5xl flex flex-col items-center">
            {/* Global Search Header for Trigger View */}
            <div className="w-full mb-6 sticky top-0 z-[6000] px-1 group">
               <div className="relative group">
                 <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/50 to-indigo-500/50 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                 <div className="relative flex items-center bg-[#0d1117]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-1 shadow-2xl">
                    <div className="pl-4 pr-2 text-blue-400 opacity-60">
                      <Search size={18} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="트리거 클라우드 검색"
                      value={miniSearchStr}
                      onChange={(e) => {
                        setMiniSearchStr(e.target.value);
                        setSearchTerm(e.target.value); // Sync with global filter logic
                      }}
                      onFocus={() => setIsMiniSearchOpen(true)}
                      className="bg-transparent border-none focus:ring-0 text-white text-sm w-full py-3 font-bold placeholder:text-gray-500 tracking-tight"
                    />
                 </div>
                 {isMiniSearchOpen && miniSearchStr && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-[#0d1117] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-3xl max-h-[70vh] overflow-y-auto backdrop-blur-3xl z-[7000] animate-in fade-in slide-in-from-top-4 duration-300">
                       <div className="p-3 border-b border-white/5 bg-white/5 flex justify-between items-center px-6">
                         <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">TRIGGER SEARCH</span>
                         <X size={14} className="text-gray-500 cursor-pointer" onClick={() => setIsMiniSearchOpen(false)} />
                       </div>
                       {filteredStocks.length > 0 ? (
                        <div className="p-3 space-y-2">
                          {filteredStocks.slice(0, 8).map((s) => (
                            <SearchResultItem 
                              key={s.symbol}
                              stock={s}
                              isFavorite={ungroupedStocks.some(f => f.symbol === s.symbol) || favoriteGroups.some(g => g.stocks.some(gs => gs.symbol === s.symbol))}
                              small
                              onSelect={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); navigate("TRIGGER", s.symbol); }}
                              onGame={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); navigate("GAME", s.symbol); }}
                              onWarp={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); setIsTimeWarpTriggered(true); navigate("CHART", s.symbol); }}
                              onCloud={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); setInitialFlipped(true); navigate("CHART", s.symbol); }}
                              onToggleFavorite={(e) => smartToggleFavorite(s, e)}
                              sparklineData={sparklineData}
                              intradayData={intradayData}
                              getSparklinePath={getSparklinePath}
                            />
                          ))}
                        </div>
                       ) : (
                        <div className="py-10 text-center text-gray-600 italic">결과가 없습니다</div>
                       )}
                    </div>
                 )}
               </div>
            </div>

            <div className="w-full bg-[#0d1117]/60 border border-white/10 rounded-[3rem] p-4 sm:p-8 backdrop-blur-3xl relative pb-24 shadow-3xl min-h-[75vh]">
              <div className="absolute top-6 left-6 z-[1000]">
                <button onClick={() => navigate("HOME")} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/5 shadow-xl">
                  <ChevronLeft size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">EXIT</span>
                </button>
              </div>
              <div className="pt-16">
                <TriggerAnalysis />
              </div>
            </div>
          </motion.div>
        ) : view === "CHART" ? (
          <motion.div key="chart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="z-10 w-full max-w-5xl flex flex-col items-center">
            {/* Global Search Header for Chart View */}
            <div className="w-full mb-6 sticky top-0 z-[6000] px-1 group">
               <div className="relative group">
                 <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500/50 to-orange-500/50 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                 <div className="relative flex items-center bg-[#0d1117]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-1 shadow-2xl">
                    <div className="pl-4 pr-2 text-rose-400 opacity-60">
                      <Search size={18} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="종목 실시간 차트 검색"
                      value={miniSearchStr}
                      onChange={(e) => {
                        setMiniSearchStr(e.target.value);
                        setSearchTerm(e.target.value); // Sync with global filter logic
                      }}
                      onFocus={() => setIsMiniSearchOpen(true)}
                      className="bg-transparent border-none focus:ring-0 text-white text-sm w-full py-3 font-bold placeholder:text-gray-500 tracking-tight"
                    />
                 </div>
                 {isMiniSearchOpen && miniSearchStr && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-[#0d1117] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-3xl max-h-[70vh] overflow-y-auto backdrop-blur-3xl z-[7000] animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="p-3 border-b border-white/5 bg-white/5 flex justify-between items-center px-6">
                         <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">CHART SEARCH</span>
                         <X size={14} className="text-gray-500 cursor-pointer" onClick={() => setIsMiniSearchOpen(false)} />
                       </div>
                       {filteredStocks.length > 0 ? (
                        <div className="p-3 space-y-2">
                          {filteredStocks.slice(0, 8).map((s) => (
                            <SearchResultItem 
                              key={s.symbol}
                              stock={s}
                              isFavorite={ungroupedStocks.some(f => f.symbol === s.symbol) || favoriteGroups.some(g => g.stocks.some(gs => gs.symbol === s.symbol))}
                              small
                              onSelect={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); navigate("CHART", s.symbol, isTimeWarpTriggered); }}
                              onGame={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); navigate("GAME", s.symbol); }}
                              onWarp={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); setIsTimeWarpTriggered(true); navigate("CHART", s.symbol); }}
                              onCloud={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); setInitialFlipped(true); navigate("CHART", s.symbol); }}
                              onToggleFavorite={(e) => smartToggleFavorite(s, e)}
                              sparklineData={sparklineData}
                              intradayData={intradayData}
                              getSparklinePath={getSparklinePath}
                            />
                          ))}
                        </div>
                       ) : (
                        <div className="py-10 text-center text-gray-600 italic">결과가 없습니다</div>
                       )}
                    </div>
                 )}
               </div>
            </div>

            <div className="w-full min-h-[75vh] h-auto bg-[#0d1117]/60 border border-white/10 rounded-[3rem] p-4 sm:p-8 backdrop-blur-3xl relative pb-24 shadow-3xl">
              <div className="absolute top-6 left-6 z-[1000]">
                <button onClick={() => navigate("HOME")} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/5 shadow-xl">
                  <ChevronLeft size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">EXIT</span>
                </button>
              </div>
              <div className="pt-8">
                <PuzzleGame 
                  stockData={stockData} 
                  isOnlyChart={true} 
                  stockName={selectedStock?.name} 
                  stockSymbol={selectedStock?.symbol} 
                  isTimeWarpTriggered={isTimeWarpTriggered}
                  onPrevFavorite={handlePrevFavorite}
                  onNextFavorite={handleNextFavorite}
                  hasMultipleFavorites={flatFavorites.length > 1}
                  initialFlipped={initialFlipped}
                  key={`${puzzleKey}-${selectedStock?.symbol}`}
                  isSearchFullScreen={isSearchFullScreen}
                  onBackToSearch={() => setView("HOME")}
                />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>


      <footer className="mt-48 py-20 text-[10px] text-white/20 tracking-widest font-mono uppercase z-10 text-center w-full pb-32">VIBE CODING • CHART PUZZLE v2.10.0</footer>

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
          </button>

          {/* 트리거 */}
          <button 
            onClick={() => navigate("TRIGGER")}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${view === "TRIGGER" ? "bg-white/15 ring-1 ring-white/20" : "hover:bg-white/5 opacity-50 hover:opacity-100"}`}
          >
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
              <img src="/icons/v3_trigger.png" alt="TRIGGER" className="w-full h-full object-contain" />
            </div>
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
              {/* v1.6.3: 미분류 저장 옵션 추가 */}
              <button 
                onClick={() => setTargetAddGroupId("ungrouped")}
                className={`w-full p-5 rounded-2xl flex items-center justify-between transition-all border ${targetAddGroupId === "ungrouped" ? 'bg-[#F08080]/10 border-[#F08080] text-[#F08080]' : 'bg-white/5 border-white/5 text-gray-400 opacity-60 hover:opacity-100'}`}
              >
                <div className="flex items-center gap-3">
                  <Star size={16} />
                  <span className="font-bold text-sm">My List (미분류 저장)</span>
                </div>
                {targetAddGroupId === "ungrouped" && <Check size={18} />}
              </button>

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
