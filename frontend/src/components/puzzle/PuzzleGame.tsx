"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, useDraggable, useDroppable, DragOverlay } from "@dnd-kit/core";
import { StockChart, StockChartHandle } from "../charts/StockChart";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, Newspaper, X, TrendingUp, TrendingDown, Timer, Award, Search, Home, BarChart2, Settings, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// TAB 비율: 렌더링과 표시에서 동일하게 사용 (핵심: 반드시 일치해야 함)
const TAB_RATIO = 0.30; 
const TAB_PCT = TAB_RATIO * 100; // 30%
const IMG_SIZE_PCT = "160%"; // 100 + 30*2
const IMG_OFFSET_PCT = "-30%"; // -30

// 직소 퍼즐 엣지 정보 (0: Flat, 1: Tab Out, -1: Slot In)
interface Edge { top: number; right: number; bottom: number; left: number; }

interface PieceState {
  id: string;
  pieceIdx: number;
  position: { x: number; y: number }; // 풀 내에서의 자유 위치 (px)
  isPlaced: boolean;
  rotation: number;
}

/**
 * Canvas API를 이용해 직소 퍼즐 조각을 실제 이미지로 미리 렌더링
 */
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

  ctx.drawImage(
    sourceCanvas,
    col * cellSize - TAB,
    row * cellSize - TAB,
    cellSize + TAB * 2,
    cellSize + TAB * 2,
    0, 0,
    pc.width, pc.height
  );

  return pc.toDataURL("image/png");
}

// ─── DroppableSlot: 정답 조각이 들어갈 슬롯 ────────────────────────────
const DroppableSlot = ({
  id, index, children, isCorrect
}: { id: string; index: number; children?: React.ReactNode; isCorrect: boolean }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  return (
    <div 
      ref={setNodeRef}
      className={`relative w-full h-full border border-white/5 transition-colors duration-300
        ${isOver ? "bg-white/10" : "bg-transparent"}
      `}
      data-slot-index={index}
    >
      {children}
    </div>
  );
};

// ─── DraggablePiece: 드래그 가능한 퍼즐 조각 ──────────────────────────
const DraggablePiece = ({
  piece, pieceImg, gridSize, isDragOverlay = false
}: { piece: PieceState; pieceImg: string; gridSize: number; isDragOverlay?: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: piece.id,
    disabled: piece.isPlaced,
  });

  const cellSize = 512 / gridSize;

  const style: React.CSSProperties = {
    position: "absolute",
    left: piece.position.x,
    top: piece.position.y,
    width: `${cellSize}px`,
    height: `${cellSize}px`,
    transform: undefined,
    zIndex: piece.isPlaced ? 5 : 10,
    cursor: piece.isPlaced ? "default" : isDragging ? "grabbing" : "grab",
    opacity: isDragging ? 0 : 1, // 드래그 시 원본 숨김 (잔상 제거 완벽 해결)
    filter: piece.isPlaced ? "none" : "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
    touchAction: "none",
    transition: isDragging ? "none" : "left 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), top 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)", // 다시 섞기 스무스 애니메이션
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <img
        src={pieceImg}
        alt=""
        draggable={false}
        className="absolute w-[160%] h-[160%] left-[-30%] top-[-30%] block pointer-events-none"
        style={{
          maxWidth: "none",
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
};

// ─── PuzzleGame 메인 컴포넌트 ───────────────────────────────────────────────
export const PuzzleGame = ({ 
  stockData, 
  gridSize: initialGridSize = 3,
  stockName = "",
  stockSymbol = ""
}: { 
  stockData: any[]; 
  gridSize?: number;
  stockName?: string;
  stockSymbol?: string;
}) => {
  const [pieces, setPieces]           = useState<PieceState[]>([]);
  const [pieceImages, setPieceImages] = useState<string[]>([]);
  const [guideImage, setGuideImage]   = useState<string | null>(null);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSolved, setIsSolved]       = useState(false);
  const [isNewsOpen, setIsNewsOpen]   = useState(false);
  const [activeId, setActiveId]       = useState<string | null>(null);
  const [gridSize, setGridSize]       = useState<number>(3);
  const [isQuizOpen, setIsQuizOpen]   = useState(false);
  const [timeframe, setTimeframe]     = useState<"D" | "W" | "M">("D");
  const [quizData, setQuizData]       = useState<any[]>(stockData);
  const [isQuizDataLoading, setIsQuizDataLoading] = useState(false);
  const [userPrediction, setUserPrediction] = useState<"up" | "down" | null>(null);
  const [showResult, setShowResult]   = useState(false);
  const [newsResults, setNewsResults] = useState<any[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [seconds, setSeconds]         = useState(0);
  const [moves, setMoves]             = useState(0);
  const [isTimeWarpNewsOpen, setIsTimeWarpNewsOpen] = useState(false);
  const chartRef = useRef<StockChartHandle>(null);
  const quizChartRef = useRef<StockChartHandle>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

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
        edges.push({
          top: hEdges[r][c],
          right: vEdges[r][c + 1],
          bottom: -hEdges[r + 1][c],
          left: -vEdges[r][c],
        });
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

      // 가이드 이미지 (흑백)
      const guideCanvas = document.createElement("canvas");
      guideCanvas.width = SQUARE_SIZE;
      guideCanvas.height = SQUARE_SIZE;
      const guideCtx = guideCanvas.getContext("2d")!;
      guideCtx.filter = "grayscale(100%) opacity(30%)";
      guideCtx.drawImage(squareCanvas, 0, 0);
      setGuideImage(guideCanvas.toDataURL());

      const rendered = pieceEdges.map((edge, i) =>
        renderPieceToDataURL(squareCanvas, i, gridSize, edge)
      );
      setPieceImages(rendered);

      // 조각들을 512x512 영역 내부에 랜덤으로 겹쳐서 배치
      const cellSize = 512 / gridSize;
      const initialPieces: PieceState[] = Array.from({ length: gridSize * gridSize }, (_, i) => {
        return {
          id: `piece-${i}`,
          pieceIdx: i,
          position: {
            x: Math.random() * (512 - cellSize),
            y: Math.random() * (512 - cellSize),
          },
          isPlaced: false,
          rotation: 0,
        };
      });
      
      setPieces(initialPieces);
      setIsSolved(false);
      setIsPlaying(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCapturing(false);
    }
  };

  const resetPiecesPositions = () => {
    const cellSize = 512 / gridSize;
    setPieces(prev => prev.map((p) => {
      // 정답 확인(치트키) 상태이거나 수동으로 완성되어 모든 조각이 맞춰진 경우(isSolved=true), 다시 섞기 시 전체 리셋
      if (p.isPlaced && !isSolved) return p;
      return {
        ...p,
        isPlaced: false,
        position: {
          x: Math.random() * (512 - cellSize),
          y: Math.random() * (512 - cellSize),
        },
        rotation: 0,
      };
    }));
    if (isSolved) setIsSolved(false);
    setSeconds(0);
    setMoves(0);
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over, delta } = event;
    setActiveId(null);

    setPieces((prev) => {
      const updated = [...prev];
      const pIdx = prev.findIndex((p) => p.id === active.id);
      if (pIdx === -1) return prev;

      const piece = { ...updated[pIdx] };
      
      // 위치 업데이트
      piece.position = {
        x: piece.position.x + delta.x,
        y: piece.position.y + delta.y,
      };

      // 스내핑 로직 (정답 슬롯 근처 64px 이내면 흡착)
      if (over) {
        const slotIdx = parseInt(over.id.replace("slot-", ""));
        if (slotIdx === piece.pieceIdx) {
          const row = Math.floor(slotIdx / gridSize);
          const col = slotIdx % gridSize;
          const cellSize = 512 / gridSize;
          piece.position = { x: col * cellSize, y: row * cellSize };
          piece.isPlaced = true;
          piece.rotation = 0;
        }
      }

      updated[pIdx] = piece;
      return updated;
    });
    setMoves(m => m + 1);
  };

  useEffect(() => {
    if (isPlaying && pieces.length > 0 && pieces.every(p => p.isPlaced)) {
      setIsSolved(true);
    }
  }, [pieces, isPlaying]);

  // 타임 워프용 데이터 통합 관리 (오픈 시 초기화 및 전환 대응)
  useEffect(() => {
    if (!isQuizOpen || !stockSymbol) return;

    const fetchTimeframeData = async () => {
      setIsQuizDataLoading(true);
      const tfMap = { "D": "day", "W": "week", "M": "month" };
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/stock/${stockSymbol}?timeframe=${tfMap[timeframe]}`);
        if (res.ok) {
          const result = await res.json();
          if (result.data) {
            setQuizData(result.data);
          }
        }
      } catch (e) {
        console.error("Timeframe data fetch failed", e);
        if (timeframe === "D") setQuizData(stockData);
      } finally {
        setIsQuizDataLoading(false);
      }
    };

    fetchTimeframeData();
  }, [timeframe, isQuizOpen, stockSymbol, stockData]);

  // 퍼즐 시작 또는 종목 선택 시 뉴스 데이터 가져오기 (News Pulse)
  useEffect(() => {
    if (!stockName) return;

    const abortController = new AbortController();

    const fetchNews = async () => {
      setIsNewsLoading(true);
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/news/${encodeURIComponent(stockName)}?t=${Date.now()}`, {
          signal: abortController.signal
        });
        if (res.ok) {
          const data = await res.json();
          setNewsResults(data.news || []);
        }
      } catch (e: any) {
        if (e.name === "AbortError") {
          console.log("News fetch aborted due to timeout");
        } else {
          console.error("News Pulse fetch failed", e);
        }
        setNewsResults([]);
      } finally {
        setIsNewsLoading(false);
      }
    };

    fetchNews();

    // 5초 강제 타임아웃
    const timeoutId = setTimeout(() => abortController.abort(), 5000);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [stockName]);

  // 퍼즐 타이머
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isSolved) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isSolved]);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}s`;
  };

  const progress = pieces.length > 0 
    ? Math.round((pieces.filter(p => p.isPlaced).length / pieces.length) * 100) 
    : 0;

  const cellSize = 512 / gridSize;

  return (
    <div className="w-full flex flex-col items-center pb-6 relative overflow-x-hidden min-h-[85vh]">
      {!isPlaying ? (
        <div className="w-full flex flex-col items-center animate-in fade-in duration-700 max-w-2xl px-4 flex-grow h-full">
          {/* 상단 차트 영역: 120% 확대 (60vh) */}
          <div className="w-full p-2 bg-white/5 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md mb-4 h-[60vh] min-h-[400px]">
            <StockChart ref={chartRef} data={stockData} />
          </div>
          
          {/* 하단 메뉴 영역: mt-10으로 위치 조정 */}
          <div className="w-full mt-4 flex items-center justify-between gap-2 p-1.5 bg-black/60 rounded-2xl border border-white/10 shadow-[0_-10px_50px_-15px_rgba(0,0,0,0.8)] backdrop-blur-3xl z-10 sm:max-w-md mx-auto">
            <Button
              onClick={startPuzzle}
              disabled={isCapturing}
              className="w-28 h-12 text-[13px] font-black bg-gradient-to-r from-rose-400 to-rose-600 hover:from-rose-500 hover:to-rose-700 text-white rounded-xl shadow-2xl transition-all font-sans whitespace-nowrap active:scale-95 px-1"
            >
              {isCapturing ? "분할.." : "퍼즐 시작"}
            </Button>

            <div className="relative group">
              <select 
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="w-24 h-12 bg-white/5 text-white text-[11px] font-black py-1 px-1 rounded-xl border border-white/20 outline-none transition-all cursor-pointer appearance-none text-center hover:bg-white/10 focus:border-rose-500/50 active:scale-95"
              >
                <option value={3} className="bg-slate-900">조각 3x3</option>
                <option value={4} className="bg-slate-900">조각 4x4</option>
                <option value={5} className="bg-slate-900">조각 5x5</option>
              </select>
            </div>

            <Button
              onClick={() => {
                setIsPlaying(true);
                setIsSolved(true);
                setIsQuizOpen(true);
              }}
              className="flex-1 h-12 text-[13px] font-black bg-white/5 hover:bg-white/10 text-blue-400 border border-blue-500/20 rounded-xl transition-all font-sans flex items-center justify-center gap-1 whitespace-nowrap active:scale-95"
            >
              <Timer size={16} />
              타임 워프
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center gap-4 animate-in zoom-in-95 duration-500 relative -mt-2">
          {/* 타이머 및 무브 카운터 */}
          <div className="flex items-center gap-6 px-6 py-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-2">
              <Timer size={14} className="text-yellow-500" />
              <span className="text-sm font-black text-yellow-500 font-mono tracking-wider uppercase">Time</span>
              <span className="text-lg font-black text-white font-mono min-w-[5ch]">{formatTime(seconds)}</span>
            </div>
            <div className="w-[1px] h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <RefreshCw size={14} className="text-blue-400" />
              <span className="text-sm font-black text-blue-400 font-mono tracking-wider uppercase">Moves</span>
              <span className="text-lg font-black text-white font-mono min-w-[2ch]">{moves}</span>
            </div>
          </div>
          
          {/* 퍼즐 진행도 바 */}
          <div className="w-64 h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>

          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* 중앙 퍼즐 보드 (Target Area) */}
            <div
              className="rounded-3xl p-8 bg-slate-950/40 border-8 border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] backdrop-blur-3xl relative"
              style={{
                width: "min(95vw, 608px)",
                aspectRatio: "1 / 1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                className="relative"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                  width: "512px",
                  height: "512px",
                  overflow: "visible",
                }}
              >
                  {/* 가이드 배경 */}
                  {guideImage && (
                    <img 
                      src={guideImage} 
                      alt="" 
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-sm"
                      draggable={false}
                    />
                  )}

                  {/* 슬롯 레이어 */}
                  {Array.from({ length: gridSize * gridSize }).map((_, i) => (
                    <DroppableSlot key={`slot-${i}`} id={`slot-${i}`} index={i} isCorrect={false} />
                  ))}

                  {/* 풀(Pool)에 있는 조각 레이어 (512x512 캔버스 내 기준) */}
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 100 }}>
                    {pieces.filter(p => !p.isPlaced).map((p) => (
                      <div key={p.id} className="pointer-events-auto absolute" style={{ left: 0, top: 0 }}>
                        <DraggablePiece piece={p} pieceImg={pieceImages[p.pieceIdx]} gridSize={gridSize} />
                      </div>
                    ))}
                  </div>

                  {/* 배치 완료된 조각 레이어 */}
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
                    {pieces.filter(p => p.isPlaced).map((p) => (
                      <DraggablePiece key={p.id} piece={p} pieceImg={pieceImages[p.pieceIdx]} gridSize={gridSize} />
                    ))}
                  </div>
                </div>

                {/* 뉴스 플로팅 버튼 (퍼즐 보드 내 오른쪽 상단) - 항상 최상단 노출 */}
                <div className="absolute right-4 top-[-20px] z-[5000] flex flex-col items-end gap-2">
                  <button
                    onClick={() => setIsNewsOpen(!isNewsOpen)}
                    className={`p-3 rounded-full shadow-2xl transition-all duration-300 group flex items-center justify-center
                      ${isNewsOpen ? "bg-white text-blue-600 shadow-xl scale-90" : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20 animate-pulse"}`}
                  >
                    <Newspaper className="transition-transform" size={20} />
                  </button>

                  <AnimatePresence>
                    {isNewsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        className="w-[240px] min-h-[360px] bg-white/70 border border-white/80 backdrop-blur-3xl rounded-2xl p-5 shadow-2xl flex flex-col justify-between"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-black/5 pb-2">
                            <span className="flex items-center gap-1.5 text-blue-600 font-extrabold text-xs">
                              <Newspaper size={14} /> NEWS PULSE
                            </span>
                            <button onClick={() => setIsNewsOpen(false)} className="text-gray-400 hover:text-black transition-colors">
                              <X size={14} />
                            </button>
                          </div>
                          
                          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                            {newsResults.length > 0 ? (
                              newsResults.map((news, idx) => (
                                <a 
                                  key={idx}
                                  href={news.link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block p-2 bg-black/5 hover:bg-black/10 rounded-lg border border-black/5 transition-all"
                                >
                                  <p className="text-[10px] font-bold text-slate-800 line-clamp-2 leading-tight">
                                    {news.title}
                                  </p>
                                  <span className="text-[8px] text-blue-600 font-bold uppercase mt-1 block">Naver News</span>
                                </a>
                              ))
                            ) : (
                              <div className="py-8 text-center text-gray-400 text-[10px] italic">
                                관련 뉴스를 불러오는 중...
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            <DragOverlay dropAnimation={null} style={{ zIndex: 3000 }}>
              {activeId ? (
                <div style={{ width: `${cellSize}px`, height: `${cellSize}px`, transform: "scale(1.1)" }}>
                  <img
                    src={pieceImages[parseInt(activeId.split("-")[1])]}
                    alt=""
                    draggable={false}
                    className="absolute w-[160%] h-[160%] left-[-30%] top-[-30%] block pointer-events-none"
                    style={{
                      maxWidth: "none",
                      filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.9))",
                      imageRendering: "pixelated",
                    }}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* 컨트롤 영역 */}
          <div className="mt-2 mb-6 flex flex-col items-center gap-4 relative z-[6000]">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                onClick={resetPiecesPositions}
                className="px-8 h-12 text-sm font-black border-[#4B4646] text-[#4B4646] hover:bg-[#4B4646] hover:text-white transition-all rounded-xl"
              >
                다시 섞기
              </Button>
              <Button
                onClick={() => {
                  setPieces((prev) => prev.map((p) => {
                    const row = Math.floor(p.pieceIdx / gridSize);
                    const col = p.pieceIdx % gridSize;
                    const cellSize = 512 / gridSize;
                    return {
                      ...p,
                      isPlaced: true,
                      position: { x: col * cellSize, y: row * cellSize },
                      rotation: 0,
                    };
                  }));
                  setIsSolved(true);
                }}
                className="px-10 h-12 text-sm font-black bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-xl shadow-rose-900/20 transition-all rounded-xl"
              >
                정답 확인
              </Button>
            </div>

            <AnimatePresence>
              {isSolved && !isQuizOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="mt-2"
                >
                  <Button 
                    onClick={() => setIsQuizOpen(true)}
                    className="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-lg font-black shadow-2xl shadow-blue-900/40 transition-all flex items-center gap-2 animate-bounce scale-90"
                  >
                    <Timer size={20} />
                    타임 워프 퀴즈 시작
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 타임 워프 퀴즈 모달 (디자인 샘플 100% 반영) */}
            <AnimatePresence>
              {isQuizOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[6000] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center py-10 px-6 overflow-y-auto"
                >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="w-full max-w-2xl flex flex-col items-center gap-6"
                  >
                    {/* 상단 바 (홈으로/이전으로) - 퍼즐 메인 화면과 통일 */}
                    <div className="w-full flex justify-between mb-2">
                       <Button 
                         variant="ghost" 
                         className="text-gray-400 hover:text-white flex items-center"
                         onClick={() => window.location.reload()}
                       >
                         <ChevronLeft className="mr-2" size={20} /> <span className="font-bold">홈으로</span>
                       </Button>
                       <Button 
                         variant="ghost" 
                         className="text-gray-400 hover:text-white flex items-center"
                         onClick={() => setIsQuizOpen(false)}
                       >
                         <span className="font-bold">이전으로</span>
                       </Button>
                    </div>

                    <div className="w-full flex flex-col items-center gap-1">
                       <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">퍼즐 완성!</h2>
                    </div>

                    {/* 종목 확인 카드 */}
                    <div className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-4 sm:p-6 flex flex-col items-center gap-4 shadow-2xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-50" />
                      
                      <div className="w-full relative z-10 px-2">
                        <div className="flex flex-col items-center sm:items-start">
                          <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Analysis Complete</span>
                          <h3 className="text-xl sm:text-3xl font-black text-white flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
                             {stockName} <span className="text-white/20 text-sm sm:text-lg font-medium">({stockSymbol})</span>
                          </h3>
                        </div>
                      </div>

                      {/* 실제 차트 영역 (PuzzleGame에서 보던 라이브 차트 복원 - 높이 확대) */}
                      <div className="w-full h-[45vh] sm:h-[55vh] min-h-[300px] bg-black/40 rounded-3xl overflow-hidden border border-white/10 relative z-10 mt-4 shadow-inner">
                        {/* 네이티브 스타일 일/주/월 메뉴 (차트 상단 부착 - 가격 축과 겹치지 않게 좌측으로 이동) */}
                        <div className="absolute top-4 left-4 z-[30] flex p-1 bg-slate-900/80 rounded-xl border border-white/10 backdrop-blur-md shadow-2xl">
                          {(["D", "W", "M"] as const).map((tf) => (
                            <button
                              key={tf}
                              onClick={() => {
                                setTimeframe(tf);
                                setShowResult(false);
                                setUserPrediction(null);
                              }}
                              disabled={isQuizDataLoading}
                              className={`
                                w-14 h-12 rounded-lg text-lg font-black transition-all flex items-center justify-center
                                ${timeframe === tf ? "bg-white text-slate-900 shadow-xl" : "text-white/40 hover:text-white hover:bg-white/5"}
                                ${isQuizDataLoading ? "opacity-50 cursor-wait" : ""}
                              `}
                            >
                              {tf === "D" ? "일" : tf === "W" ? "주" : "월"}
                            </button>
                          ))}
                        </div>
                        {isQuizDataLoading ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                            <span className="text-blue-400 font-bold animate-pulse">데이터 로딩 중...</span>
                          </div>
                        ) : null}
                        {/* 퀴즈 차트: 결과 공개 전에는 마지막 5일치를 가림 (Phase 5 정통성 확보) */}
                        <StockChart 
                          ref={quizChartRef} 
                          data={showResult ? quizData : quizData.slice(0, -5)} 
                        />
                      </div>
                    </div>

                    {/* 퀴즈 메인 카드 (차트 강화형) */}
                    <div className="w-full bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-4 sm:p-8 flex flex-col items-center gap-4 sm:gap-8 shadow-3xl backdrop-blur-2xl mt-3">
                      <div className="flex flex-col items-center gap-1">
                        {showResult ? (
                          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                            <h4 className={`text-2xl sm:text-4xl font-black mb-1 ${
                              ((quizData[quizData.length-1].close >= quizData[quizData.length-6].close) === (userPrediction === "up")) 
                              ? "text-emerald-400" : "text-rose-400"
                            }`}>
                              {((quizData[quizData.length-1].close >= quizData[quizData.length-6].close) === (userPrediction === "up")) 
                              ? "정답입니다!" : "틀렸습니다!"}
                            </h4>
                            <p className="text-white/60 text-xs sm:text-sm">실제 결과: 다음 5개 봉 기준 <span className={quizData[quizData.length-1].close >= quizData[quizData.length-6].close ? "text-blue-400" : "text-rose-400"}>
                              {quizData[quizData.length-1].close >= quizData[quizData.length-6].close ? "상승" : "하락"}
                            </span></p>
                          </motion.div>
                        ) : (
                          <p className="text-gray-400 text-xs sm:text-sm font-medium leading-relaxed text-center mt-2">
                            이 패턴 이후, 다음 <span className="text-blue-400 font-bold">5거래일 동안</span> 주가는<br />어떻게 되었을까요?
                          </p>
                        )}
                      </div>

                      {!showResult && (
                        <div className="w-full grid grid-cols-2 gap-4 sm:gap-6">
                          <button
                            onClick={() => {
                              setUserPrediction("up");
                              setShowResult(true);
                            }}
                            className={`group relative flex flex-col items-center gap-2 sm:gap-4 p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] transition-all border
                              ${userPrediction === "up" 
                                ? "bg-blue-600/20 border-blue-500 scale-105 shadow-2xl shadow-blue-500/20" 
                                : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"}`}
                          >
                            <div className={`w-12 h-12 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all
                              ${userPrediction === "up" ? "bg-blue-500 text-white" : "bg-slate-800 text-blue-400"}`}>
                              <TrendingUp size={window.innerWidth < 640 ? 24 : 40} />
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-lg sm:text-xl font-black text-white">상승</span>
                              <span className="text-[8px] sm:text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">BULLISH</span>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              setUserPrediction("down");
                              setShowResult(true);
                            }}
                            className={`group relative flex flex-col items-center gap-2 sm:gap-4 p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] transition-all border
                              ${userPrediction === "down" 
                                ? "bg-rose-600/20 border-rose-500 scale-105 shadow-2xl shadow-rose-500/20" 
                                : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"}`}
                          >
                            <div className={`w-12 h-12 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all
                              ${userPrediction === "down" ? "bg-rose-500 text-white" : "bg-slate-800 text-rose-400"}`}>
                              <TrendingDown size={window.innerWidth < 640 ? 24 : 40} />
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-lg sm:text-xl font-black text-white">하락</span>
                              <span className="text-[8px] sm:text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">BEARISH</span>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 뉴스 펄스 아코디언 섹션 */}
                    <div className="w-full bg-slate-900/50 rounded-2xl sm:rounded-3xl border border-white/5 overflow-hidden mt-3">
                      <button 
                        onClick={() => setIsTimeWarpNewsOpen(!isTimeWarpNewsOpen)}
                        className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-white/5 transition-all text-left"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full animate-pulse ${isTimeWarpNewsOpen ? "bg-blue-400" : "bg-blue-500"}`} />
                          <span className="text-xs font-black text-white/40 uppercase tracking-widest">Real-time News Pulse</span>
                        </div>
                        <motion.div
                          animate={{ rotate: isTimeWarpNewsOpen ? 180 : 0 }}
                          className="text-white/40"
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </motion.div>
                      </button>
                      
                      <AnimatePresence>
                        {isTimeWarpNewsOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="px-6 pb-6 space-y-3">
                              {isNewsLoading ? (
                                <div className="py-4 text-center text-white/20 text-xs italic">
                                  {stockName} 관련 뉴스를 불러오는 중...
                                </div>
                              ) : newsResults.length > 0 ? (
                                newsResults.map((news, idx) => (
                                  <a 
                                    key={idx}
                                    href={news.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group"
                                  >
                                    <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors line-clamp-1">
                                      {news.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[10px] text-blue-500/60 font-bold uppercase">Google News</span>
                                      <span className="text-[10px] text-white/10 font-mono">•</span>
                                      <span className="text-[10px] text-white/20">최신 뉴스</span>
                                    </div>
                                  </a>
                                ))
                              ) : (
                                <div className="py-4 text-center text-white/20 text-xs italic">
                                  최근 뉴스가 없습니다.
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="w-full flex flex-col gap-2 mt-3">
                      <Button 
                        onClick={() => window.location.reload()}
                        className="w-full h-14 sm:h-16 bg-[#F08080] hover:bg-[#F08080]/90 text-white text-lg sm:text-xl font-black rounded-2xl sm:rounded-3xl shadow-2xl shadow-[#F08080]/20 transition-all flex items-center justify-center gap-2"
                      >
                         <Home size={20} /> 메인으로 돌아가기
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
