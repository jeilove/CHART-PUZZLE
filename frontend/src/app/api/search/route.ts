import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic'; // [v2.10.47] Vercel 캐싱 영구 차단 (동적 라우팅 강제)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  
  if (!q) return NextResponse.json({ results: [] });

  try {
    const url = `https://ac.finance.naver.com/ac?q=${encodeURIComponent(q)}&q_enc=utf-8&st=111&r_format=json&r_enc=utf-8`;
    // 네이버가 브라우저를 봇으로 차단하지 않도록 User-Agent 강력 변장 + 캐시 방어
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://finance.naver.com/"
      },
      cache: "no-store"
    });
    
    if (!res.ok) throw new Error("Naver API Blocked");
    const data = await res.json();
    
    const results = [];
    if (data.items && data.items.length > 0 && data.items[0].length > 0) {
      for (const item of data.items[0]) {
        const name = item[0];
        const symbol = item[1];
        if (name && symbol) {
          results.push({ name, symbol, industry: "기타", price: 0, change: 0 });
        }
      }
    }
    
    return NextResponse.json({ results: results.slice(0, 30) });
  } catch (error: any) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [] });
  }
}
