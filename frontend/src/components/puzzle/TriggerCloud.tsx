"use client";

import React from "react";
import { TagCloud } from "react-tagcloud";
import { motion } from "framer-motion";

interface Tag {
  text: string;
  value: number;
  sentiment: string;
}

interface TriggerCloudProps {
  data: Tag[];
}

export const TriggerCloud = ({ data }: TriggerCloudProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-white/20 italic text-sm">
        분석된 트리거 키워드가 없습니다.
      </div>
    );
  }

  // react-tagcloud requires 'value' and 'count' to be compatible with various TS definitions
  // and some versions expect value to be a string or number. Let's make it robust.
  const formattedTags = data.map(tag => ({
    text: tag.text,
    value: tag.value,
    count: tag.value,
    sentiment: tag.sentiment
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
      className="p-4 sm:p-8 flex flex-col items-center justify-center w-full min-h-[150px]"
    >
      <TagCloud
        minSize={12}
        maxSize={32}
        tags={formattedTags}
        className="text-center font-bold tracking-tight cursor-default select-none"
        style={{
          lineHeight: "1.6",
        }}
        renderer={(tag: any, size: number) => {
          const color = colorMapper(tag);
          return (
            <span
              key={tag.text}
              style={{
                fontSize: `${size}px`,
                color: color,
                margin: '0 8px',
                display: 'inline-block',
                textShadow: tag.sentiment !== 'neutral' ? `0 0 10px ${color}44` : 'none',
                transition: 'all 0.3s'
              }}
              className="hover:scale-110 transition-transform"
            >
              {tag.text}
            </span>
          );
        }}
      />
    </motion.div>
  );
};
