import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

// 전종목 리스트를 서버 시작 시 메모리에 캐시
let stockCache: { name: string; symbol: string; market: string; industry: string }[] | null = null;

function loadStockList() {
  if (stockCache) return stockCache;
  
  try {
    // Next.js public 폴더 경로 (서버사이드에서는 process.cwd() 기준)
    const filePath = path.join(process.cwd(), "public", "stock_list_full.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    stockCache = JSON.parse(raw);
    console.log(`[Search] 종목 리스트 로드: ${stockCache?.length}개`);
    return stockCache;
  } catch (e) {
    console.error("[Search] stock_list_full.json 로드 실패:", e);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  
  if (!q || q.length < 1) return NextResponse.json({ results: [] });

  const stocks = loadStockList();
  if (!stocks || stocks.length === 0) {
    return NextResponse.json({ results: [], error: "종목 리스트 로드 실패" });
  }

  const term = q.toLowerCase();
  
  // 검색 우선순위:
  // 1. 종목명 앞쪽 일치 (예: "삼성" → "삼성전자", "삼성SDI")
  // 2. 종목명 포함 일치
  // 3. 종목코드 일치
  const startsWith = stocks.filter(s => 
    s.name.toLowerCase().startsWith(term)
  );
  const contains = stocks.filter(s => 
    !s.name.toLowerCase().startsWith(term) &&
    s.name.toLowerCase().includes(term)
  );
  const codeMatch = stocks.filter(s => 
    s.symbol.startsWith(term) || s.symbol === term
  );

  const results = [...startsWith, ...contains, ...codeMatch].slice(0, 30);
  
  return NextResponse.json({ results });
}
