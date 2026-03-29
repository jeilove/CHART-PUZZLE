"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, useDraggable, useDroppable, DragOverlay } from "@dnd-kit/core";
import { StockChart, StockChartHandle } from "../charts/StockChart";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, Newspaper, X, TrendingUp, TrendingDown, Timer, Award, Search, Home, BarChart2, Settings } from "lucide-react";
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
export const PuzzleGame = ({ stockData, gridSize: initialGridSize = 3 }: { stockData: any[]; gridSize?: number }) => {
  const [pieces, setPieces]           = useState<PieceState[]>([]);
  const [pieceImages, setPieceImages] = useState<string[]>([]);
  const [guideImage, setGuideImage]   = useState<string | null>(null);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSolved, setIsSolved]       = useState(false);
  const [isNewsOpen, setIsNewsOpen]   = useState(false);
  const [activeId, setActiveId]       = useState<string | null>(null);
  const [gridSize, setGridSize]       = useState(initialGridSize);
  const [isQuizOpen, setIsQuizOpen]   = useState(false);
  const [timeframe, setTimeframe]     = useState<"D" | "W" | "M">("D");
  const [userPrediction, setUserPrediction] = useState<"up" | "down" | null>(null);
  const [showResult, setShowResult]   = useState(false);
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
  };

  useEffect(() => {
    if (isPlaying && pieces.length > 0 && pieces.every(p => p.isPlaced)) {
      setIsSolved(true);
    }
  }, [pieces, isPlaying]);

  const progress = pieces.length > 0 
    ? Math.round((pieces.filter(p => p.isPlaced).length / pieces.length) * 100) 
    : 0;

  const cellSize = 512 / gridSize;

  return (
    <div className="w-full flex flex-col items-center gap-6 pb-20 relative">
      {!isPlaying ? (
        <div className="w-full flex flex-col items-center gap-6 animate-in fade-in duration-700">
          <div className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md">
            <StockChart ref={chartRef} data={stockData} />
          </div>
          
          <div className="flex flex-col items-center gap-3 bg-[#4B4646]/80 p-4 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl">
            <span className="text-gray-300 font-bold text-xs tracking-widest uppercase mb-1">그림조각 개수 선택</span>
            <div className="flex items-center p-1 bg-black/40 rounded-xl border border-white/5">
              {[3, 4, 5].map((size) => (
                <button
                  key={size}
                  onClick={() => setGridSize(size)}
                  className={`
                    flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-all duration-300
                    ${gridSize === size 
                      ? "bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-900/40 scale-105" 
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                    }
                  `}
                >
                  <span className="text-sm font-black">{size * size}</span>
                  <span className="text-[8px] font-bold opacity-60">{size}x{size}</span>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={startPuzzle}
            disabled={isCapturing}
            className="h-12 px-10 text-base font-bold bg-gradient-to-r from-[#F08080] to-rose-500 hover:from-rose-500 hover:to-[#F08080] text-white rounded-xl shadow-xl shadow-rose-900/20 transition-all font-sans"
          >
            {isCapturing ? "이미지 분할 중..." : "퍼즐 시작하기"}
          </Button>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center gap-10 animate-in zoom-in-95 duration-500 relative">
          
          {/* 퍼즐 진행도 바 */}
          <div className="w-64 h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 mt-4">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
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
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-[8px] text-gray-500 font-bold tracking-widest uppercase">
                              <span>Sentiment Pulse</span>
                              <span className="text-emerald-600 font-black">+78.4%</span>
                            </div>
                            <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden flex shadow-inner">
                              <div className="h-full bg-emerald-500 w-[78%]" />
                              <div className="h-full bg-rose-500 w-[22%]" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-4">
                            {["#반도체_폭등", "#AI_대세", "#HBM3E", "#금리동결", "#수출_청신호", "#외인속점", "#나스닥_반등", "#엔비디아_실적"].map((tag) => (
                              <span key={tag} className="text-[9px] bg-white/40 text-indigo-700 py-1.5 px-2 rounded-lg border border-white/50 text-center font-bold">
                                {tag}
                              </span>
                            ))}
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
          <div className="flex flex-col items-center gap-8 mt-10">
            <div className="flex items-center gap-4">
              <Button onClick={resetPiecesPositions} className="h-14 px-8 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-2xl flex items-center gap-3 group transition-all backdrop-blur-md">
                <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                다시 섞기
              </Button>
              <Button 
                onClick={() => setPieces(prev => prev.map((p, i) => {
                  const row = Math.floor(i / gridSize);
                  const col = i % gridSize;
                  return { 
                    ...p, 
                    isPlaced: true, 
                    position: { x: col * cellSize, y: row * cellSize }, 
                    rotation: 0 
                  };
                }))} 
                disabled={isSolved} 
                className="h-11 px-7 bg-[#F08080] hover:bg-[#F08080]/90 text-white rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-rose-900/20 font-sans font-bold text-sm"
              >
                <CheckCircle2 size={16} />
                정답 확인
              </Button>
            </div>

            <AnimatePresence>
              {isSolved && !isQuizOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  className="flex flex-col items-center gap-6"
                >
                  <motion.div className="text-center p-8 rounded-[2.5rem] bg-slate-900/60 border border-emerald-500/30 backdrop-blur-3xl shadow-2xl shadow-emerald-500/10 max-w-lg">
                    <h3 className="text-4xl font-black text-emerald-400 italic mb-2 tracking-widest">UNBELIEVABLE!</h3>
                    <p className="text-gray-400 font-medium text-lg leading-relaxed">완벽하게 분석하셨습니다. 이제 주가의 다음 흐름을 예측해볼까요?</p>
                  </motion.div>
                  
                  <Button 
                    onClick={() => setIsQuizOpen(true)}
                    className="h-16 px-12 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xl font-black shadow-2xl shadow-blue-900/40 transition-all flex items-center gap-3 animate-bounce"
                  >
                    <Timer size={24} />
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
                  className="fixed inset-0 z-[6000] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6"
                >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="w-full max-w-[420px] flex flex-col items-center gap-8"
                  >
                    <div className="w-full flex flex-col items-center gap-2">
                       <span className="text-blue-400 font-bold text-sm tracking-tighter">레벨 12 클리어!</span>
                       <h2 className="text-4xl font-black text-white tracking-tight">퍼즐 완성!</h2>
                       <div className="mt-2 text-white/40"><Award size={32} /></div>
                    </div>

                    {/* 종목 확인 카드 */}
                    <div className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-6 flex flex-col items-center gap-4 shadow-2xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-50" />
                      
                      <div className="w-full flex justify-between items-center px-2 relative z-10">
                        <div className="flex flex-col">
                          <span className="text-white/40 text-[10px] font-bold">인사이트 분석 완료</span>
                          <h3 className="text-xl font-black text-white flex items-center gap-2">
                            SK하이닉스 <span className="text-white/20 text-sm font-medium">(000660)</span>
                          </h3>
                        </div>
                        
                        {/* 일/주/월 전환 탭 */}
                        <div className="flex p-0.5 bg-black/40 rounded-lg border border-white/5 h-8">
                          {(["D", "W", "M"] as const).map((tf) => (
                            <button
                              key={tf}
                              onClick={() => setTimeframe(tf)}
                              className={`
                                w-8 h-full rounded-md text-[10px] font-black transition-all
                                ${timeframe === tf ? "bg-white/10 text-white" : "text-white/30 hover:text-white/50"}
                              `}
                            >
                              {tf === "D" ? "일" : tf === "W" ? "주" : "월"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 실제 차트 영역 (PuzzleGame에서 보던 라이브 차트 복원) */}
                      <div className="w-full h-40 bg-black/20 rounded-2xl overflow-hidden border border-white/5 relative z-10">
                        <StockChart ref={quizChartRef} data={stockData} />
                      </div>
                    </div>

                    {/* 퀴즈 메인 카드 */}
                    <div className="w-full bg-slate-900/50 border border-white/5 rounded-[3rem] p-10 flex flex-col items-center gap-10 shadow-3xl backdrop-blur-2xl">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-yellow-400/20 rounded-full flex items-center justify-center text-yellow-400 border border-yellow-400/30">
                          <Timer size={32} />
                        </div>
                        <div className="text-center">
                          <h4 className="text-3xl font-black text-white mb-2">타임 워프 예측</h4>
                          <p className="text-gray-400 text-sm font-medium leading-relaxed">
                            이 패턴 이후, 다음 <span className="text-blue-400 font-bold">5거래일 동안</span> 주가는<br />어떻게 되었을까요?
                          </p>
                        </div>
                      </div>

                      <div className="w-full grid grid-cols-2 gap-6">
                        <button
                          onClick={() => setUserPrediction("up")}
                          className={`group relative flex flex-col items-center gap-4 p-8 rounded-[2.5rem] transition-all border
                            ${userPrediction === "up" 
                              ? "bg-blue-600/20 border-blue-500 scale-105 shadow-2xl shadow-blue-500/20" 
                              : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"}`}
                        >
                          <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all
                            ${userPrediction === "up" ? "bg-blue-500 text-white" : "bg-slate-800 text-blue-400"}`}>
                            <TrendingUp size={40} />
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-xl font-black text-white">상승</span>
                            <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">BULLISH</span>
                          </div>
                        </button>

                        <button
                          onClick={() => setUserPrediction("down")}
                          className={`group relative flex flex-col items-center gap-4 p-8 rounded-[2.5rem] transition-all border
                            ${userPrediction === "down" 
                              ? "bg-rose-600/20 border-rose-500 scale-105 shadow-2xl shadow-rose-500/20" 
                              : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"}`}
                        >
                          <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all
                            ${userPrediction === "down" ? "bg-rose-500 text-white" : "bg-slate-800 text-rose-400"}`}>
                            <TrendingDown size={40} />
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-xl font-black text-white">하락</span>
                            <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">BEARISH</span>
                          </div>
                        </button>
                      </div>

                      <p className="text-white/20 text-[10px] font-bold flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" /> 힌트 사용 (50점 소모)
                      </p>
                    </div>

                    {/* 통계 섹션 */}
                    <div className="w-full grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-3xl p-6 flex items-center gap-4 border border-white/5">
                        <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400">
                          <Timer size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-white/30 font-bold tracking-widest uppercase">해결 시간</span>
                          <span className="text-xl font-black text-white tracking-tight">01:42s</span>
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-3xl p-6 flex items-center gap-4 border border-white/5">
                        <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-yellow-400">
                          <Settings size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-white/30 font-bold tracking-widest uppercase">정확도</span>
                          <span className="text-xl font-black text-white tracking-tight">92%</span>
                        </div>
                      </div>
                    </div>

                    {/* 나중에 구현될 하단 내비게이션 형태 (샘플용) */}
                    <div className="w-full flex justify-between px-4 mt-4 opacity-50">
                       <Home size={20} className="text-white" />
                       <Search size={20} className="text-white" />
                       <BarChart2 size={20} className="text-blue-500" />
                       <Settings size={20} className="text-white" />
                    </div>

                    <Button 
                      onClick={() => setIsQuizOpen(false)}
                      className="mt-4 text-white/40 hover:text-white transition-colors text-xs font-bold"
                    >
                      다음에 하기 (닫기)
                    </Button>
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
