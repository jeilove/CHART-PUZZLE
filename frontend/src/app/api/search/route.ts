import { NextResponse } from "next/server";

// [v2.10.35] 검색 엔진 원상 복구 (네이버 금융 실시간 API 방식)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  
  if (!q) return NextResponse.json({ results: [] });

  try {
    // 네이버 금융 자동완성 API 활용 (원래 사용하던 방식)
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
          results.push({ name, symbol, industry: "기타", price: 0, change: 0 });
        }
      }
    }
    
    // 결과 범위를 충분히 확보하여 엘앤에프 등 누락 방지 (기존 10개에서 30개로 상향하여 누락 방지)
    return NextResponse.json({ results: results.slice(0, 30) });
  } catch (error: any) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [] });
  }
}
