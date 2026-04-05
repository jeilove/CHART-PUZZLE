import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  
  if (!q) return NextResponse.json({ results: [] });

  try {
    // 네이버 금융 자동완성 API 활용
    const url = `https://ac.finance.naver.com/ac?q=${encodeURIComponent(q)}&q_enc=utf-8&st=111&r_format=json&r_enc=utf-8`;
    const res = await fetch(url);
    const data = await res.json();
    
    const results = [];
    if (data.items && data.items.length > 0 && data.items[0].length > 0) {
      for (const item of data.items[0]) {
        // item = ["삼성전자", "005930", ...]
        const name = item[0];
        const symbol = item[1];
        if (name && symbol) {
          // 실시간 주가는 여기서는 조회가 어려우므로, 프론트에서 기존 방식을 유지하거나 필요 시 단건 조회 진행
          results.push({ name, symbol, industry: "기타", price: 0, change: 0 });
        }
      }
    }
    
    return NextResponse.json({ results: results.slice(0, 10) });
  } catch (error: any) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [] });
  }
}
