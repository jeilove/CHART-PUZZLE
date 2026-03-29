"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { createChart, ColorType, CandlestickSeries, LineSeries, HistogramSeries } from "lightweight-charts";

interface StockChartProps {
  data: any[];
  colors?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

export interface StockChartHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

// 이동평균선 계산 함수
const calculateMA = (data: any[], count: number) => {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < count - 1) {
      continue;
    }
    let sum = 0;
    for (let j = 0; j < count; j++) {
      sum += data[i - j].close;
    }
    result.push({
      time: data[i].time,
      value: sum / count,
    });
  }
  return result;
};

export const StockChart = forwardRef<StockChartHandle, StockChartProps>(({
  data,
  colors: {
    backgroundColor = "transparent", // 다크 테마 복원
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
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: 600, // 높이는 그대로 유지
      grid: {
        vertLines: { color: "rgba(197, 203, 206, 0.05)" },
        horzLines: { color: "rgba(197, 203, 206, 0.05)" },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.05,
          bottom: 0.2, // 차트 영역 정보량 확대 (사용자 요청 반영)
        },
      },
    });

    // 1. 거래량 히스토그램 (더 작게 배치)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#7e57c2",
      priceFormat: { type: "volume" },
      priceScaleId: "", // 별도 스케일 없이 하단 고정
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.85, // 거래량 영역 축소
        bottom: 0,
      },
    });
    volumeSeries.setData(data.map(d => ({ 
      time: d.time, 
      value: d.volume, 
      color: d.close >= d.open ? "rgba(239, 83, 80, 0.5)" : "rgba(38, 166, 154, 0.5)" 
    })));

    // 2. 캔들스틱
    const mainSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#ef5350",
      downColor: "#26a69a",
      borderVisible: false,
      wickUpColor: "#ef5350",
      wickDownColor: "#26a69a",
    });
    mainSeries.setData(data);

    // 3. 이동평균선 (5, 20, 60, 120)
    const maConfigs = [
      { period: 5, color: "#4caf50" }, // Green
      { period: 20, color: "#f44336" }, // Red
      { period: 60, color: "#ff9800" }, // Orange
      { period: 120, color: "#9c27b0" }, // Purple
    ];

    maConfigs.forEach(conf => {
      const maData = calculateMA(data, conf.period);
      if (maData.length > 0) {
        const maSeries = chart.addSeries(LineSeries, {
          color: conf.color,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        maSeries.setData(maData);
      }
    });

    chart.timeScale().fitContent();
    chartInstanceRef.current = chart;

    const handleResize = () => {
      if (chartInstanceRef.current && chartContainerRef.current) {
        chartInstanceRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, backgroundColor, textColor]);

  return (
    <div className="w-full h-full min-h-[500px] relative">
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
});

StockChart.displayName = "StockChart";
