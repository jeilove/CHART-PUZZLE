"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { createChart, ColorType, CandlestickSeries, LineSeries, HistogramSeries } from "lightweight-charts";

// ── 타입 정의 ──────────────────────────────────────────────────────────
interface StockChartProps {
  data: any[];
  timeframe?: "D" | "W" | "M";
  colors?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

export interface StockChartHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

// ── 유틸리티 함수 (컴포넌트 외부, 한 번만 선언) ───────────────────────

/** 이동평균선 계산 */
const calculateMA = (data: any[], count: number) => {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < count - 1) continue;
    let sum = 0;
    for (let j = 0; j < count; j++) sum += data[i - j].close;
    result.push({ time: data[i].time, value: sum / count });
  }
  return result;
};

/** 일봉 데이터를 주봉/월봉으로 집계 */
const aggregateData = (rawData: any[], tf: "W" | "M") => {
  if (!rawData || rawData.length === 0) return [];
  const aggregated: any[] = [];
  let currentGroup: any = null;

  rawData.forEach((d) => {
    const dateStr = typeof d.time === "string" ? d.time : new Date(d.time * 1000).toISOString().split("T")[0];
    const date = new Date(dateStr);
    let groupKey: string;

    if (tf === "W") {
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date);
      monday.setDate(diff);
      groupKey = monday.toISOString().split("T")[0];
    } else {
      groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
    }

    if (!currentGroup || currentGroup.time !== groupKey) {
      if (currentGroup) aggregated.push(currentGroup);
      currentGroup = { time: groupKey, open: d.open, high: d.high, low: d.low, close: d.close, volume: d.volume ?? 0 };
    } else {
      currentGroup.high = Math.max(currentGroup.high, d.high);
      currentGroup.low = Math.min(currentGroup.low, d.low);
      currentGroup.close = d.close;
      currentGroup.volume = (currentGroup.volume ?? 0) + (d.volume ?? 0);
    }
  });
  if (currentGroup) aggregated.push(currentGroup);
  return aggregated;
};

// ── 컴포넌트 ───────────────────────────────────────────────────────────
export const StockChart = forwardRef<StockChartHandle, StockChartProps>(({
  data,
  timeframe = "D",
  colors: {
    backgroundColor = "transparent",
    textColor = "#d1d4dc",
  } = {},
}, ref) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    getCanvas: () => {
      if (!chartInstanceRef.current) return null;
      return chartInstanceRef.current.takeScreenshot();
    }
  }));

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;

    // ✅ timeframe에 따른 데이터 가공을 useEffect 내부에서 처리
    //    → useMemo로 분리하면 deps 불일치로 createUnhandledError 발생
    const finalData = timeframe === "D" ? data : aggregateData(data, timeframe);

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 400,
      grid: {
        vertLines: { color: "rgba(197, 203, 206, 0.05)" },
        horzLines: { color: "rgba(197, 203, 206, 0.05)" },
      },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.05, bottom: 0.2 },
      },
    });

    // 1. 거래량 히스토그램
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#7e57c2",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
    volumeSeries.setData(finalData.map(d => ({
      time: d.time,
      value: d.volume ?? 0,
      color: d.close >= d.open ? "rgba(239, 83, 80, 0.5)" : "rgba(38, 166, 154, 0.5)",
    })));

    // 2. 캔들스틱
    const mainSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#ef5350",
      downColor: "#26a69a",
      borderVisible: false,
      wickUpColor: "#ef5350",
      wickDownColor: "#26a69a",
    });
    mainSeries.setData(finalData);

    // 3. 이동평균선 (5, 10, 20, 60)
    const maConfigs = [
      { period: 5,  color: "#4caf50" },
      { period: 10, color: "#2196f3" },
      { period: 20, color: "#f44336" },
      { period: 60, color: "#ff9800" },
    ];
    maConfigs.forEach(({ period, color }) => {
      const maData = calculateMA(finalData, period);
      if (maData.length > 0) {
        chart.addSeries(LineSeries, {
          color,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        }).setData(maData);
      }
    });

    chart.timeScale().fitContent();
    chartInstanceRef.current = chart;

    const handleResize = () => {
      if (chartInstanceRef.current && chartContainerRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();            // ✅ effect에서 생성한 chart 인스턴스만 제거
      chartInstanceRef.current = null;
    };
  }, [data, timeframe, backgroundColor, textColor]); // ✅ timeframe 포함

  return (
    <div className="w-full h-full min-h-[350px] sm:min-h-[500px] relative">
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
});

StockChart.displayName = "StockChart";
