"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, useDraggable, useDroppable, DragOverlay } from "@dnd-kit/core";
import { StockChart, StockChartHandle } from "../charts/StockChart";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, Newspaper, X, TrendingUp, TrendingDown, Timer, Award, Search, Home, BarChart2, Settings, ChevronLeft, ChevronDown, CloudLightning, Loader2, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TriggerCloud } from "./TriggerCloud";

const TAB_RATIO = 0.30; 

interface Edge { top: number; right: number; bottom: number; left: number; }

interface PieceState {
  id: string;
  pieceIdx: number;
  position: { x: number; y: number };
  isPlaced: boolean;
  rotation: number;
}

function renderPieceToDataURL(
  sourceCanvas: HTMLCanvasElement,
  pieceIndex: number,
  gridSize: number,
  edge: Edge
): string {
  const size = sourceCanvas.width;
  const cellSize = size / gridSize;
  const TAB = cellSize * TAB_RATIO;
  const row = Math.floor(pieceIndex / gridSize);
  const col = pieceIndex % gridSize;
  const pc = document.createElement("canvas");
  const pcSize = cellSize + TAB * 2;
  pc.width  = pcSize;
  pc.height = pcSize;
  const ctx = pc.getContext("2d")!;
  const L = TAB, R = TAB + cellSize, T = TAB, B = TAB + cellSize;
  const cx = TAB + cellSize / 2, cy = TAB + cellSize / 2;
  ctx.beginPath();
  ctx.moveTo(L, T);
  if (edge.top === 0) ctx.lineTo(R, T);
  else {
    const d = edge.top;
    ctx.lineTo(cx - TAB * 0.4, T);
    ctx.bezierCurveTo(cx - TAB * 0.4, T - d * TAB * 0.6, cx - TAB * 0.15, T - d * TAB, cx, T - d * TAB);
    ctx.bezierCurveTo(cx + TAB * 0.15, T - d * TAB, cx + TAB * 0.4,  T - d * TAB * 0.6, cx + TAB * 0.4, T);
    ctx.lineTo(R, T);
  }
  if (edge.right === 0) ctx.lineTo(R, B);
  else {
    const d = edge.right;
    ctx.lineTo(R, cy - TAB * 0.4);
    ctx.bezierCurveTo(R + d * TAB * 0.6, cy - TAB * 0.4, R + d * TAB, cy - TAB * 0.15, R + d * TAB, cy);
    ctx.bezierCurveTo(R + d * TAB, cy + TAB * 0.15, R + d * TAB * 0.6, cy + TAB * 0.4, R, cy + TAB * 0.4);
    ctx.lineTo(R, B);
  }
  if (edge.bottom === 0) ctx.lineTo(L, B);
  else {
    const d = edge.bottom;
    ctx.lineTo(cx + TAB * 0.4, B);
    ctx.bezierCurveTo(cx + TAB * 0.4, B + d * TAB * 0.6, cx + TAB * 0.15, B + d * TAB, cx, B + d * TAB);
    ctx.bezierCurveTo(cx - TAB * 0.15, B + d * TAB, cx - TAB * 0.4, B + d * TAB * 0.6, cx - TAB * 0.4, B);
    ctx.lineTo(L, B);
  }
  if (edge.left === 0) ctx.lineTo(L, T);
  else {
    const d = edge.left;
    ctx.lineTo(L, cy + TAB * 0.4);
    ctx.bezierCurveTo(L - d * TAB * 0.6, cy + TAB * 0.4, L - d * TAB, cy + TAB * 0.15, L - d * TAB, cy);
    ctx.bezierCurveTo(L - d * TAB, cy - TAB * 0.15, L - d * TAB * 0.6, cy - TAB * 0.4, L, cy - TAB * 0.4);
    ctx.lineTo(L, T);
  }
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = "#4B4646";
  ctx.fill();
  ctx.drawImage(sourceCanvas, col * cellSize - TAB, row * cellSize - TAB, cellSize + TAB * 2, cellSize + TAB * 2, 0, 0, pc.width, pc.height);
  return pc.toDataURL("image/png");
}

/* -------------------------------------------------------------------------- */
/*                            표준화된 공통 컴포넌트                             */
/* -------------------------------------------------------------------------- */

const GapComponent = ({ comment }: { comment?: string }) => {
  if (!comment) return null;
  return (
    <div className="w-full p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <p className="text-[11px] font-black text-emerald-400 uppercase mb-2 tracking-widest flex items-center gap-2">
        <TrendingUp size={14} /> Gap Index Analysis
      </p>
      <p className="text-[15px] font-bold text-white/90 leading-relaxed italic">"{comment}"</p>
    </div>
  );
};

interface FlipCardProps {
  isFlipped: boolean;
  setIsFlipped: (f: boolean) => void;
  chartContent: React.ReactNode;
  triggerLoading: boolean;
  triggerResults: any;
  stockSymbol?: string;
  stockName?: string;
  hideName?: boolean;
  timeframe?: "D" | "W" | "M";
  setTimeframe?: (tf: "D" | "W" | "M") => void;
  onRefresh?: () => void; // 수동 갱신 함수 추가
}

const UnifiedFlipCard = ({ 
  isFlipped, 
  setIsFlipped, 
  chartContent, 
  triggerLoading, 
  triggerResults, 
  stockSymbol, 
  stockName, 
  hideName, 
  timeframe, 
  setTimeframe,
  onRefresh
}: FlipCardProps) => {
  return (
    <div className="w-full perspect-2000 relative z-10" style={{ perspective: "2000px" }}>
      <motion.div 
        className="w-full relative preserve-3d transition-all duration-700" 
        style={{ transformStyle: "preserve-3d" }} 
        animate={{ rotateY: isFlipped ? 180 : 0 }}
      >
        {/* Front */}
        <div 
          className="w-full bg-slate-900 border border-white/10 rounded-[3rem] p-4 sm:p-6 shadow-3xl relative overflow-hidden" 
          style={{ backfaceVisibility: "hidden", pointerEvents: isFlipped ? "none" : "auto", visibility: isFlipped ? "hidden" : "visible" }}
        >
          {/* Header Section: Integrated for better spacing */}
          <div className="absolute top-4 inset-x-0 z-[200] flex flex-col items-center gap-4 px-4 sm:px-8">
            {stockName && !hideName && (
              <h3 
                className={`text-xl sm:text-2xl font-black text-white flex items-center justify-center gap-2 cursor-pointer hover:text-rose-400 transition-colors group text-center ${triggerLoading ? "animate-pulse opacity-60" : ""}`}
                onClick={(e) => { e.stopPropagation(); onRefresh?.(); }}
                title="클릭하여 데이터 강제 갱신"
              >
                <div className="flex flex-wrap items-center justify-center gap-x-2">
                  <span>{stockName}</span>
                  <span className="text-[11px] sm:text-sm font-bold text-white/40 tracking-wider group-hover:text-rose-400/60">({stockSymbol})</span>
                  {triggerLoading ? <Loader2 size={14} className="animate-spin text-rose-500" /> : <RefreshCw size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                </div>
              </h3>
            )}

            {setTimeframe && (
              <div className="flex p-1.5 bg-black/40 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl">
                {(["D", "W", "M"] as const).map((tf) => (
                  <button 
                    key={tf} 
                    onClick={() => setTimeframe(tf)} 
                    className={`w-14 h-12 rounded-xl text-base font-black transition-all flex items-center justify-center ${timeframe === tf ? "bg-white text-slate-900 shadow-lg scale-105" : "text-white/40 hover:text-white"}`}
                  >
                    {tf === "D" ? "일" : tf === "W" ? "주" : "월"}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="absolute inset-x-0 bottom-10 flex justify-center z-500">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsFlipped(true); }} 
              className="group relative transition-all active:scale-95"
            >
              <img src="/icons/v8_trigger.png" alt="Intelligence Trigger" className="h-24 w-24 object-contain shadow-2xl drop-shadow-[0_0_20px_rgba(240,128,128,0.4)] transition-all group-hover:scale-110" />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-black text-rose-400 opacity-0 group-hover:opacity-100 transition-all uppercase tracking-widest">
                트리거 정보 확인
              </div>
            </button>
          </div>
          <div className="w-full h-[55vh] min-h-[400px] bg-black/40 rounded-[2.5rem] overflow-hidden pt-12">
            {chartContent}
          </div>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 w-full h-full bg-slate-950 border border-rose-500/40 rounded-[3rem] p-8 flex flex-col items-center justify-center shadow-3xl" 
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", pointerEvents: isFlipped ? "auto" : "none", visibility: isFlipped ? "visible" : "hidden" }}
        >
          {/* Back Header Section */}
          {/* Back Header - Trigger Icon Replacement */}
          <div className="absolute top-8 inset-x-0 flex flex-col items-center gap-2 px-8">
            <img src="/icons/v8_trigger.png" alt="Intelligence" className="h-24 object-contain drop-shadow-[0_0_25px_rgba(244,63,94,0.3)]" />
            
            {stockName && !hideName && (
              <div className="flex items-center gap-3 mt-[-10px]">
                <span className="text-sm font-black text-white/40 tracking-wider">({stockSymbol})</span>
                {(triggerResults?.total_report_count || (triggerResults?.report_dates?.length || 0) > 0) && (
                  <span className="text-[10px] font-black text-rose-500/60 flex items-center gap-1">
                    <Search size={10} /> {triggerResults?.total_report_count || triggerResults?.report_dates?.length} 리포트
                  </span>
                )}
                {triggerLoading && <Loader2 size={12} className="animate-spin text-rose-500/60" />}
              </div>
            )}
            
            <button 
              onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }} 
              className="absolute top-2 right-2 p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all active:scale-90"
              title="차트로 돌아가기"
            >
              <BarChart2 size={18} className="text-rose-400" />
            </button>
          </div>
          <div className="w-full flex-1 flex items-center justify-center">
            {triggerLoading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-rose-500" size={40} />
                <div className="flex flex-col items-center">
                  <span className="text-rose-500/80 font-black text-xs uppercase tracking-widest animate-pulse">Deep Analyzing...</span>
                  <p className="mt-2 text-[9px] text-white/30 text-center font-bold">
                    수집 시간이 길어질 경우 상단 종목명을 클릭하여<br/>다시 시도해 주세요.
                  </p>
                </div>
              </div>
            ) : triggerResults ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <TriggerCloud data={triggerResults.cloud} />
                {/* Fixed Report Dates as Footer */}
                <div className="absolute bottom-2 right-4 flex items-center gap-2 opacity-40 select-none">
                  {triggerResults?.report_dates?.slice(0, 3).map((d: string, i: number) => (
                    <span key={i} className="text-[8px] font-bold text-white tracking-tighter px-1.5 py-0.5 border border-white/10 rounded">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-white/40 font-bold italic text-sm flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                <Search size={18} className="text-rose-500 animate-pulse" />
                트리거 데이터 수집 중...
              </div>
            )}
          </div>
          <GapComponent comment={triggerResults?.gap_comment} />
        </div>
      </motion.div>
    </div>
  );
};

const DroppableSlot = ({ id, index, children, isCorrect }: { id: string; index: number; children?: React.ReactNode; isCorrect: boolean }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`relative w-full h-full border border-white/5 transition-colors duration-300 ${isOver ? "bg-white/10" : "bg-transparent"}`} data-slot-index={index}>
      {children}
    </div>
  );
};

const DraggablePiece = ({ piece, pieceImg, gridSize }: { piece: PieceState; pieceImg: string; gridSize: number }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: piece.id, disabled: piece.isPlaced });
  const cellSize = 480 / gridSize;
  const style: React.CSSProperties = {
    position: "absolute",
    left: piece.position.x,
    top: piece.position.y,
    width: `${cellSize}px`,
    height: `${cellSize}px`,
    zIndex: piece.isPlaced ? 5 : 10,
    cursor: piece.isPlaced ? "default" : isDragging ? "grabbing" : "grab",
    opacity: isDragging ? 0 : 1,
    filter: piece.isPlaced ? "none" : "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
    touchAction: "none",
    transition: isDragging ? "none" : "left 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), top 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <img src={pieceImg} alt="" draggable={false} className="absolute w-[160%] h-[160%] left-[-30%] top-[-30%] block pointer-events-none" style={{ maxWidth: "none", imageRendering: "pixelated" }} />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                            메인 PuzzleGame 컴포넌트                           */
/* -------------------------------------------------------------------------- */

export const PuzzleGame = ({ 
  stockData, 
  stockName = "", 
  stockSymbol = "", 
  isOnlyChart = false, 
  gridSize: initialGridSize = 3,
  isTimeWarpTriggered = false 
}: { 
  stockData: any[]; 
  stockName?: string; 
  stockSymbol?: string; 
  isOnlyChart?: boolean; 
  gridSize?: number;
  isTimeWarpTriggered?: boolean;
}) => {
  const [pieces, setPieces]           = useState<PieceState[]>([]);
  const [pieceImages, setPieceImages] = useState<string[]>([]);
  const [guideImage, setGuideImage]   = useState<string | null>(null);
  const [isPlaying, setIsPlaying]     = useState(isOnlyChart);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSolved, setIsSolved]       = useState(isOnlyChart);
  const [isNewsOpen, setIsNewsOpen]   = useState(false);
  const [activeId, setActiveId]       = useState<string | null>(null);
  const [gridSize, setGridSize]       = useState<number>(initialGridSize);
  const [isQuizOpen, setIsQuizOpen]   = useState(false);
  const [timeframe, setTimeframe]     = useState<"D" | "W" | "M">("D");
  const [quizData, setQuizData]       = useState<any[]>(stockData);
  const [isQuizDataLoading, setIsQuizDataLoading] = useState(false);
  const [newsResults, setNewsResults] = useState<any[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [seconds, setSeconds]         = useState(0);
  const [moves, setMoves]             = useState(0);
  const [isTimeWarpNewsOpen, setIsTimeWarpNewsOpen] = useState(false);
  const [triggerResults, setTriggerResults] = useState<any>(null);
  const [isTriggerLoading, setIsTriggerLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const chartRef = useRef<StockChartHandle>(null);
  const quizChartRef = useRef<StockChartHandle>(null);

  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 5 } }), useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }));

  useEffect(() => {
    if (isTimeWarpTriggered) {
      setIsQuizOpen(true);
    }
  }, [isTimeWarpTriggered]);

  const pieceEdges = useMemo(() => {
    const edges: Edge[] = [];
    const hEdges = Array.from({ length: gridSize + 1 }, () => Array(gridSize).fill(0));
    const vEdges = Array.from({ length: gridSize }, () => Array(gridSize + 1).fill(0));
    for (let i = 1; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) hEdges[i][j] = Math.random() > 0.5 ? 1 : -1;
      for (let j = 0; j < gridSize; j++) vEdges[j][i] = Math.random() > 0.5 ? 1 : -1;
    }
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        edges.push({ top: hEdges[r][c], right: vEdges[r][c + 1], bottom: -hEdges[r + 1][c], left: -vEdges[r][c] });
      }
    }
    return edges;
  }, [gridSize]);

  const startPuzzle = async () => {
    if (!chartRef.current) return;
    setIsCapturing(true);
    try {
      const sourceCanvas = chartRef.current.getCanvas();
      if (!sourceCanvas) throw new Error("Canvas capture failed");
      const SQUARE_SIZE = 512;
      const squareCanvas = document.createElement("canvas");
      squareCanvas.width = SQUARE_SIZE;
      squareCanvas.height = SQUARE_SIZE;
      const sqCtx = squareCanvas.getContext("2d")!;
      sqCtx.fillStyle = "#4B4646";
      sqCtx.fillRect(0, 0, SQUARE_SIZE, SQUARE_SIZE);
      sqCtx.drawImage(sourceCanvas, 0, 0, SQUARE_SIZE, SQUARE_SIZE);
      const guideCanvas = document.createElement("canvas");
      guideCanvas.width = SQUARE_SIZE;
      guideCanvas.height = SQUARE_SIZE;
      const guideCtx = guideCanvas.getContext("2d")!;
      guideCtx.filter = "grayscale(100%) opacity(30%)";
      guideCtx.drawImage(squareCanvas, 0, 0);
      setGuideImage(guideCanvas.toDataURL());
      const rendered = pieceEdges.map((edge, i) => renderPieceToDataURL(squareCanvas, i, gridSize, edge));
      setPieceImages(rendered);
      const cellSize = 480 / gridSize;
      const initialPieces: PieceState[] = Array.from({ length: gridSize * gridSize }, (_, i) => ({
        id: `piece-${i}`, pieceIdx: i, position: { x: Math.random() * (480 - cellSize), y: Math.random() * (480 - cellSize) }, isPlaced: false, rotation: 0
      }));
      setPieces(initialPieces);
      setIsSolved(false); setIsPlaying(true);
    } catch (e) { console.error(e); } finally { setIsCapturing(false); }
  };

  const resetPiecesPositions = () => {
    const cellSize = 480 / gridSize;
    setPieces(prev => prev.map((p) => (p.isPlaced && !isSolved) ? p : { ...p, isPlaced: false, position: { x: Math.random() * (480 - cellSize), y: Math.random() * (480 - cellSize) }, rotation: 0 }));
    if (isSolved) setIsSolved(false);
    setSeconds(0); setMoves(0);
  };

  const handleDragStart = (event: any) => setActiveId(event.active.id);
  const handleDragEnd = (event: any) => {
    const { active, over, delta } = event;
    setActiveId(null);
    setPieces((prev) => {
      const updated = [...prev];
      const pIdx = prev.findIndex((p) => p.id === active.id);
      if (pIdx === -1) return prev;
      const piece = { ...updated[pIdx] };
      piece.position = { x: piece.position.x + delta.x, y: piece.position.y + delta.y };
      if (over) {
        const slotIdx = parseInt(over.id.replace("slot-", ""));
        if (slotIdx === piece.pieceIdx) {
          const cellSize = 480 / gridSize;
          piece.position = { x: (slotIdx % gridSize) * cellSize, y: Math.floor(slotIdx / gridSize) * cellSize };
          piece.isPlaced = true; piece.rotation = 0;
        }
      }
      updated[pIdx] = piece;
      return updated;
    });
    setMoves(m => m + 1);
  };

  useEffect(() => { if (isPlaying && pieces.length > 0 && pieces.every(p => p.isPlaced)) setIsSolved(true); }, [pieces, isPlaying]);

  useEffect(() => {
    if ((!isQuizOpen && !isOnlyChart) || !stockSymbol) return;
    const fetchTimeframeData = async () => {
      setIsQuizDataLoading(true);
      const tfMap = { "D": "day", "W": "week", "M": "month" };
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/stock/${stockSymbol}?timeframe=${tfMap[timeframe]}`);
        if (res.ok) {
          const result = await res.json();
          if (result.data) setQuizData(result.data);
        }
      } catch (e) { console.error(e); } finally { setIsQuizDataLoading(false); }
    };
    fetchTimeframeData();
  }, [timeframe, isQuizOpen, isOnlyChart, stockSymbol]);

  const fetchTrigger = async (force = false) => {
    if (!stockSymbol) return;
    setIsTriggerLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/trigger/${stockSymbol}?name=${encodeURIComponent(stockName)}&refresh=${force}&t=${Date.now()}`);
      if (res.ok) { 
        const data = await res.json(); 
        setTriggerResults(data); 
      } else {
        setTriggerResults({ cloud: [], gap_comment: "데이터를 불러올 수 없습니다." });
      }
    } catch (e: any) { 
      setTriggerResults({ cloud: [], gap_comment: "분석 요청이 지연되었습니다. 상단 헤더의 종목명을 클릭하여 다시 시도해 주세요." });
    } finally { setIsTriggerLoading(false); }
  };

  useEffect(() => {
    if (!stockName || !stockSymbol) return;
    fetchTrigger(false);
  }, [stockName, stockSymbol]);

  useEffect(() => {
    if (!stockName) return;
    const abortController = new AbortController();
    const fetchNews = async () => {
      setIsNewsLoading(true);
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/news/${encodeURIComponent(stockName)}?t=${Date.now()}`, { signal: abortController.signal });
        if (res.ok) { const data = await res.json(); setNewsResults(data.news || []); }
      } catch (e: any) { setNewsResults([]); } finally { setIsNewsLoading(false); }
    };
    fetchNews();
    const timeoutId = setTimeout(() => abortController.abort(), 10000);
    return () => { clearTimeout(timeoutId); abortController.abort(); };
  }, [stockName]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isSolved) interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isSolved]);

  const handleQuizSelect = (predictRise: boolean) => {
    if (quizData.length < 10) return;
    const lastVisibleIdx = quizData.length - 11;
    const finalIdx = quizData.length - 1;
    const lastPrice = quizData[finalIdx].close;
    const visiblePrice = quizData[lastVisibleIdx].close;
    const isActuallyRise = lastPrice > visiblePrice;
    const correct = predictRise === isActuallyRise;
    setQuizFeedback({ isCorrect: correct, message: correct ? "축하합니다! 주가의 방향을 정확히 예측했습니다." : "아쉽네요. 주가가 반대로 움직였습니다." });
    setShowResult(true);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}s`;
  };

  if (isOnlyChart) {
    return (
      <div className="w-full flex flex-col items-center max-w-4xl px-4 relative pb-20">
        <div className="w-full relative flex items-center justify-end mb-4 z-40">
          <button onClick={() => setIsNewsOpen(!isNewsOpen)} className="p-3 bg-slate-900/80 rounded-xl border border-white/10 shadow-2xl relative"><Newspaper className={isNewsOpen ? "text-blue-400" : "text-white/40"} size={20} /></button>
        </div>

        <AnimatePresence>
          {isNewsOpen && (
            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 50, opacity: 0 }} className="absolute top-16 right-4 z-50 w-[240px] sm:w-[300px]">
              <div className="bg-slate-950/90 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 shadow-3xl">
                <div className="flex items-center justify-between mb-4"><span className="text-[10px] font-black text-white/40 uppercase tracking-widest">News Pulse</span><button onClick={() => setIsNewsOpen(false)}><X size={16} className="text-white/20" /></button></div>
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {newsResults.map((news, i) => (<a key={i} href={news.link} target="_blank" rel="noreferrer" className="block p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all"><p className="text-[11px] text-white/80 line-clamp-2 leading-relaxed">{news.title}</p></a>))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <UnifiedFlipCard 
          isFlipped={isFlipped}
          setIsFlipped={setIsFlipped}
          chartContent={<StockChart ref={chartRef} data={quizData} />}
          triggerLoading={isTriggerLoading}
          triggerResults={triggerResults}
          stockSymbol={stockSymbol}
          stockName={stockName}
          hideName={false}
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          onRefresh={() => fetchTrigger(true)}
        />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center pb-6 relative overflow-x-hidden min-h-[85vh]">
      {!isPlaying ? (
        <div className="w-full flex flex-col items-center animate-in fade-in duration-700 max-w-2xl px-4 grow h-full">
          {stockName && (
            <h3 
              className="text-2xl font-black text-white flex items-center gap-2 mb-6 cursor-pointer hover:text-rose-400 transition-colors group"
              onClick={() => fetchTrigger(true)}
              title="클릭하여 데이터 강제 갱신"
            >
              {stockName}
              <span className="text-sm font-bold text-white/40 tracking-wider">({stockSymbol})</span>
              <RefreshCw size={14} className="ml-1 opacity-60 group-hover:opacity-100 transition-opacity" />
            </h3>
          )}
          <div className="w-full p-2 bg-white/5 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md mb-4 h-[60vh] min-h-[400px]">
             <StockChart ref={chartRef} data={stockData} />
          </div>
          <div className="w-full mt-4 flex items-center justify-between gap-2 p-1.5 bg-black/60 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-3xl z-10 sm:max-w-md mx-auto">
            <Button onClick={(e) => { e.stopPropagation(); startPuzzle(); }} disabled={isCapturing} className="w-28 h-12 text-[13px] font-black bg-[#F08080] text-white rounded-xl active:scale-95">
              {isCapturing ? "분할.." : "퍼즐 시작"}
            </Button>
            <select value={gridSize} onChange={(e) => setGridSize(Number(e.target.value))} className="w-24 h-12 bg-white/5 text-white text-[11px] font-black rounded-xl border border-white/20 outline-none text-center appearance-none cursor-pointer">
              <option value={2} className="bg-slate-900">2x2</option><option value={3} className="bg-slate-900">3x3</option><option value={4} className="bg-slate-900">4x4</option>
            </select>
            <Button onClick={(e) => { e.stopPropagation(); setIsPlaying(true); setIsSolved(true); setIsQuizOpen(true); }} className="flex-1 h-12 text-[13px] font-black bg-white/5 text-blue-400 border border-blue-500/20 rounded-xl active:scale-95">
              <Timer size={16} className="mr-1" /> 타임 워프
            </Button>
          </div>
        </div>
      ) : isSolved && !isQuizOpen ? (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col items-center gap-8 py-4 px-4">
            <div className="w-full max-w-2xl">
              <UnifiedFlipCard 
                isFlipped={isFlipped}
                setIsFlipped={setIsFlipped}
                chartContent={<StockChart data={stockData} />}
                triggerLoading={isTriggerLoading}
                triggerResults={triggerResults}
                stockSymbol={stockSymbol}
                stockName={stockName}
                hideName={false}
                timeframe={timeframe}
                setTimeframe={setTimeframe}
                onRefresh={() => fetchTrigger(true)}
              />
            </div>
            <div className="w-full max-w-sm flex flex-col gap-3">
              <Button onClick={(e) => { e.stopPropagation(); setIsQuizOpen(true); setIsFlipped(false); }} className="w-full h-18 bg-[#A0C4FF]/40 border border-[#A0C4FF]/20 hover:bg-[#A0C4FF]/60 text-white rounded-[2rem] text-xl font-black shadow-3xl active:scale-95 flex items-center justify-center gap-3 backdrop-blur-md transition-all">
                <Timer size={24} className="text-sky-400" /> 타임 워프 퀴즈 도전
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="w-full flex flex-col items-center gap-4 relative -mt-2">
          <div className="flex items-center gap-6 px-6 py-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl mb-2">
            <div className="flex items-center gap-2"><Timer size={14} className="text-yellow-500" /><span className="text-lg font-black text-white font-mono">{formatTime(seconds)}</span></div>
            <div className="w-[1px] h-4 bg-white/10" /><div className="flex items-center gap-2"><RefreshCw size={14} className="text-blue-400" /><span className="text-lg font-black text-white font-mono">{moves}</span></div>
          </div>
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="rounded-3xl p-8 bg-slate-950/40 border-8 border-white/5 shadow-3xl backdrop-blur-3xl relative" style={{ width: "min(540px, 95vw)", height: "min(540px, 95vw)", display: "flex", alignItems: "center", justifyContent: "center" }}>
               <div className="relative" style={{ display: "grid", gridTemplateColumns: `repeat(${gridSize}, 1fr)`, width: "480px", height: "480px" }}>
                  {guideImage && <img src={guideImage} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-sm" />}
                  {Array.from({ length: gridSize * gridSize }).map((_, i) => (<DroppableSlot key={`slot-${i}`} id={`slot-${i}`} index={i} isCorrect={false} />))}
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 100 }}>{pieces.filter(p => !p.isPlaced).map((p) => (<div key={p.id} className="pointer-events-auto absolute" style={{ left: 0, top: 0 }}><DraggablePiece piece={p} pieceImg={pieceImages[p.pieceIdx]} gridSize={gridSize} /></div>))}</div>
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>{pieces.filter(p => p.isPlaced).map((p) => (<DraggablePiece key={p.id} piece={p} pieceImg={pieceImages[p.pieceIdx]} gridSize={gridSize} />))}</div>
               </div>
            </div>
            <DragOverlay dropAnimation={null}>{activeId ? <div style={{ width: `${480/gridSize}px`, height: `${480/gridSize}px`, transform: "scale(1.1)" }}><img src={pieceImages[parseInt(activeId.split("-")[1])]} alt="" className="absolute w-[160%] h-[160%] left-[-30%] top-[-30%]" style={{ imageRendering: "pixelated" }} /></div> : null}</DragOverlay>
          </DndContext>
          <div className="mt-6 flex items-center justify-center gap-4 relative z-[200]">
            <Button variant="outline" onClick={resetPiecesPositions} className="px-8 h-12 text-sm font-black border-white/20 text-white/60 hover:text-white rounded-xl">다시 섞기</Button>
            <Button onClick={() => { setPieces((p) => p.map((piece) => ({ ...piece, isPlaced: true, position: { x: (piece.pieceIdx % gridSize) * (480/gridSize), y: Math.floor(piece.pieceIdx / gridSize) * (480/gridSize) } }))); setIsSolved(true); }} className="px-10 h-12 text-sm font-black bg-[#F08080] text-white rounded-xl shadow-xl shadow-rose-900/40">정답 확인</Button>
          </div>
        </div>
      )}

      {/* 퀴즈 모달 */}
      <AnimatePresence>
        {isQuizOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[6000] bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center pt-4 pb-8 px-6 overflow-y-auto">
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-2xl flex flex-col items-center gap-4">
              <div className="w-full flex justify-start"><Button variant="ghost" className="text-white/20 hover:text-white flex items-center p-0 h-auto" onClick={() => window.location.reload()}><ChevronLeft size={16} className="mr-1"/>홈으로</Button></div>
              
              {quizFeedback && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className={`w-full p-6 rounded-3xl border-2 flex flex-col items-center gap-2 shadow-2xl ${quizFeedback.isCorrect ? "bg-emerald-500/20 border-emerald-500/40" : "bg-rose-500/20 border-rose-500/40"}`}>
                  <div className="flex items-center gap-3">
                    {quizFeedback.isCorrect ? <CheckCircle2 className="text-emerald-400" size={32} /> : <Award className="text-rose-400" size={32} />}
                    <h3 className={`text-2xl font-black ${quizFeedback.isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
                      {quizFeedback.isCorrect ? "정답입니다!" : "오답입니다!"}
                    </h3>
                  </div>
                  <p className="text-white/80 font-bold text-center">{quizFeedback.message}</p>
                </motion.div>
              )}

              <UnifiedFlipCard 
                isFlipped={isFlipped}
                setIsFlipped={setIsFlipped}
                chartContent={<StockChart ref={quizChartRef} data={showResult ? quizData : quizData.slice(0, -10)} />}
                triggerLoading={isTriggerLoading}
                triggerResults={triggerResults}
                stockSymbol={stockSymbol}
                stockName={stockName}
                hideName={false}
                timeframe={timeframe}
                setTimeframe={setTimeframe}
                onRefresh={() => fetchTrigger(true)}
              />

              {!showResult && (
                <div className="w-full flex gap-4 mt-2 px-2">
                  <button 
                    onClick={() => handleQuizSelect(true)}
                    className="flex-1 h-20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-3xl border border-emerald-500/20 flex flex-col items-center justify-center gap-1 transition-all group active:scale-95"
                  >
                    <TrendingUp size={24} className="group-hover:scale-110 transition-transform" />
                    <span className="text-lg font-black italic tracking-widest">상승</span>
                  </button>
                  <button 
                    onClick={() => handleQuizSelect(false)}
                    className="flex-1 h-20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-3xl border border-rose-500/20 flex flex-col items-center justify-center gap-1 transition-all group active:scale-95"
                  >
                    <TrendingDown size={24} className="group-hover:scale-110 transition-transform" />
                    <span className="text-lg font-black italic tracking-widest">하락</span>
                  </button>
                </div>
              )}

              <div className="w-full bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                <button onClick={() => setIsTimeWarpNewsOpen(!isTimeWarpNewsOpen)} className="w-full flex items-center justify-between p-4 text-white/40 hover:text-white"><span className="text-xs font-black uppercase tracking-widest">News Pulse</span><ChevronDown size={18}/></button>
                <AnimatePresence>{isTimeWarpNewsOpen && <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="px-6 pb-6 space-y-2">{newsResults.map((n, i) => (<a key={i} href={n.link} target="_blank" className="block text-xs text-white/60 hover:text-white bg-white/5 p-3 rounded-xl line-clamp-1">{n.title}</a>))}</motion.div>}</AnimatePresence>
              </div>
              <Button onClick={() => window.location.reload()} className="w-full h-16 bg-[#F08080] text-white text-lg font-black rounded-2xl mt-4 active:scale-95 transition-all shadow-2xl shadow-rose-900/20"><Home size={20} className="mr-2"/> 메인으로 돌아가기</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
