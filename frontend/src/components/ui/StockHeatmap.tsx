"use client";

import React, { useMemo } from "react";
import { hierarchy, treemap, HierarchyNode, HierarchyRectangularNode } from "d3-hierarchy";

interface StockNode {
    name: string;
    ticker: string;
    value: number; // Market cap
    change: number; // Percentage change
    sector?: string;
    children?: StockNode[];
}

interface StockHeatmapProps {
    title: string;
    data: StockNode[];
    loading?: boolean;
}

export default function StockHeatmap({ data, loading }: StockHeatmapProps) {
    const width = 800;
    const height = 480;

    const root = useMemo(() => {
        if (!data || data.length === 0) return null;

        const validData = data.filter(d => 
            typeof d.value === 'number' && !isNaN(d.value) && d.value > 0 &&
            typeof d.change === 'number' && !isNaN(d.change)
        );

        if (validData.length === 0) return null;

        const hierarchyData: StockNode = {
            name: "root",
            ticker: "",
            value: 0,
            change: 0,
            children: validData,
        };

        const rootHierarchy = hierarchy<StockNode>(hierarchyData)
            .sum((d: StockNode) => d.value)
            .sort((a: HierarchyNode<StockNode>, b: HierarchyNode<StockNode>) => (b.value || 0) - (a.value || 0));

        const treemapLayout = treemap<StockNode>().size([width, height]).paddingOuter(2).paddingInner(1);

        return treemapLayout(rootHierarchy);
    }, [data]);

    const getColor = (change: number) => {
        if (change > 3) return "rgba(16, 185, 129, 0.9)"; 
        if (change > 1) return "rgba(16, 185, 129, 0.6)";
        if (change > 0) return "rgba(16, 185, 129, 0.3)";
        if (change < -3) return "rgba(244, 63, 94, 0.9)"; 
        if (change < -1) return "rgba(244, 63, 94, 0.6)";
        if (change < 0) return "rgba(244, 63, 94, 0.3)";
        return "rgba(107, 114, 128, 0.4)";
    };

    if (loading || !root) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-white/5 animate-pulse rounded-xl min-h-[200px]">
                <span className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">데이터를 불러오는 중...</span>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-hidden relative group">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-full rounded-lg"
                style={{ filter: "drop-shadow(0 0 20px rgba(0,0,0,0.5))" }}
            >
                {root.leaves().map((leaf: HierarchyRectangularNode<StockNode>, i: number) => {
                    const d = leaf.data;
                    const leafWidth = leaf.x1 - leaf.x0;
                    const leafHeight = leaf.y1 - leaf.y0;

                    return (
                        <g key={i} transform={`translate(${leaf.x0},${leaf.y0})`} className="cursor-help">
                            <rect
                                width={Math.max(0, leafWidth)}
                                height={Math.max(0, leafHeight)}
                                fill={getColor(d.change)}
                                className="transition-all duration-500 hover:brightness-125"
                                rx={2}
                            />
                            {leafWidth > 35 && leafHeight > 25 && (
                                <text
                                    x={leafWidth / 2}
                                    y={leafHeight / 2 - 2}
                                    textAnchor="middle"
                                    className="fill-white font-black pointer-events-none select-none"
                                    style={{ fontSize: Math.min(leafWidth / 5.5, 13) }}
                                >
                                    {d.name.length > 5 ? d.name.substring(0, 4) + "." : d.name}
                                </text>
                            )}
                            {leafWidth > 35 && leafHeight > 25 && (
                                <text
                                    x={leafWidth / 2}
                                    y={leafHeight / 2 + 10}
                                    textAnchor="middle"
                                    className={`font-mono font-bold pointer-events-none select-none ${d.change >= 0 ? "fill-emerald-200" : "fill-rose-200"
                                        }`}
                                    style={{ fontSize: Math.min(leafWidth / 7.5, 10), opacity: 0.9 }}
                                >
                                    {d.change > 0 ? "+" : ""}
                                    {d.change.toFixed(1)}%
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
