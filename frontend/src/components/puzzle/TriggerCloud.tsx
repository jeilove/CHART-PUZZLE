"use client";

import React from "react";
import { TagCloud } from "react-tagcloud";
import { motion } from "framer-motion";

interface TagData {
  text: string;
  value: number;
  sentiment: string;
}

interface TriggerCloudProps {
  data: TagData[];
  sentiment?: {
    positive: string[];
    neutral: string[];
    negative: string[];
  };
  volatility?: number;
}

export const TriggerCloud = ({ data, sentiment, volatility }: TriggerCloudProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-white/20 italic text-sm">
        분석된 트리거 키워드가 없습니다.
      </div>
    );
  }

  // react-tagcloud requires 'value' (string) and 'count' (number)
  // 방어적 프로그래밍: 데이터가 예상 형식이 아닐 경우를 대비
  const formattedTags = data.map(tag => ({
    value: tag.text || (tag as any).value || "Unknown",
    count: tag.value || (tag as any).count || 0,
    sentiment: tag.sentiment || "neutral"
  }));

  const colorMapper = (tag: any) => {
    if (tag.sentiment === "positive") return "#fb7185"; // rose-400 (Red)
    if (tag.sentiment === "negative") return "#60a5fa"; // blue-400 (Blue)
    return "#ffffff"; // White (Neutral)
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 sm:px-8 flex flex-col items-center justify-center w-full h-full"
    >
      {formattedTags.length > 0 ? (
        <TagCloud
          minSize={12}
          maxSize={32}
          tags={formattedTags as any}
          className="text-center font-bold tracking-tight cursor-default select-none leading-relaxed"
          renderer={(tag: any, size: number) => {
            const color = colorMapper(tag);
            return (
              <span
                key={tag.value}
                style={{
                  fontSize: `${size}px`,
                  color: color,
                  margin: "4px",
                  display: "inline-block",
                  textShadow: `0 0 10px ${color}33`,
                  padding: "2px 4px",
                  borderRadius: "4px"
                }}
                className="hover:scale-110 transition-transform active:scale-95 py-1 px-2"
              >
                {tag.value}
              </span>
            );
          }}
        />
      ) : (
        <div className="h-[200px] flex items-center justify-center text-white/20 italic text-sm">트리거 분석 데이터를 기다리는 중...</div>
      )}

      {/* 감성 분석 및 변동성 정보 하단 섹션 */}
      {(sentiment || volatility !== undefined) && (
        <div className="w-full mt-6 pt-6 border-t border-white/5 space-y-3">
          {sentiment && sentiment.positive.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded whitespace-nowrap">긍정</span>
              <p className="text-[10px] text-gray-400 leading-relaxed font-bold">{sentiment.positive.join(", ")}</p>
            </div>
          )}
          {sentiment && sentiment.neutral.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-black text-white bg-white/10 px-2 py-0.5 rounded whitespace-nowrap">보통</span>
              <p className="text-[10px] text-gray-400 leading-relaxed font-bold">{sentiment.neutral.join(", ")}</p>
            </div>
          )}
          {sentiment && sentiment.negative.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded whitespace-nowrap">부정</span>
              <p className="text-[10px] text-gray-400 leading-relaxed font-bold">{sentiment.negative.join(", ")}</p>
            </div>
          )}
          
          {volatility !== undefined && (
            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] whitespace-nowrap">최근 주가 변동성</span>
              <span className="text-[11px] font-black text-slate-300 font-mono bg-white/5 px-2 py-0.5 rounded">
                {volatility > 0 ? "+" : ""}{volatility}%
              </span>
            </div>
          )}
          
          {!(sentiment && (sentiment.positive.length > 0 || sentiment.neutral.length > 0 || sentiment.negative.length > 0)) && volatility === undefined && (
            <p className="text-[10px] text-white/5 text-center italic">상세 분석 데이터를 불러오는 중...</p>
          )}
        </div>
      )}
    </motion.div>
  );
};
