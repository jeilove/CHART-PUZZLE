import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// [v2.10.32] 서버사이드 전종목 검색 엔진 (로컬 stock_industry.json 기반)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").toLowerCase().trim();
  
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  try {
    const jsonPath = path.join(process.cwd(), "backend", "stock_industry.json");
    if (!fs.existsSync(jsonPath)) {
      throw new Error("stock_industry.json not found");
    }

    const fileContent = fs.readFileSync(jsonPath, "utf-8");
    const stockData = JSON.parse(fileContent);

    const results: any[] = [];
    
    // stockData = { "005930": { "name": "삼성전자", "industry": "..." }, ... }
    for (const [symbol, info] of Object.entries(stockData)) {
      const { name, industry } = info as { name: string; industry: string };
      
      // 이름, 심볼, 업종에서 검색어 포함 여부 확인 (대소문자 무시)
      if (
        name.toLowerCase().includes(q) || 
        symbol.includes(q) || 
        (industry && industry.toLowerCase().includes(q))
      ) {
        results.push({
          name,
          symbol,
          industry: industry || "기타",
          price: 0,
          change: 0
        });
      }
      
      // 결과가 너무 많으면 상위 50개만 반환하여 부하 경감
      if (results.length >= 50) break;
    }
    
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Server Search error:", error);
    return NextResponse.json({ results: [] });
  }
}
