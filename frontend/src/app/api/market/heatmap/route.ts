import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Vercel ISR Cache: 10분(600초) 단위 갱신
export const revalidate = 600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "KOSPI";
  const pages = parseInt(searchParams.get("pages") || "2", 10);
  const sosok = type === "KOSDAQ" ? 1 : 0;
  
  let stocks: any[] = [];
  
  try {
    for (let p = 1; p <= pages; p++) {
      const url = `https://finance.naver.com/sise/sise_market_sum.naver?sosok=${sosok}&page=${p}`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
      });
      
      const buffer = await response.arrayBuffer();
      // EUC-KR 디코딩 (Next.js 환경 내장 TextDecoder 활용)
      const decoder = new TextDecoder("euc-kr");
      const html = decoder.decode(buffer);
      
      const $ = cheerio.load(html);
      
      $('table.type_2 tbody tr').each((_, row) => {
        const a = $(row).find('a.tltle');
        const nums = $(row).find('td.number');
        
        if (a.length === 0 || nums.length < 5) return;
        
        const href = a.attr('href') || "";
        const ticker = href.split('=').pop() || "";
        const name = a.text().trim();
        
        let changeText = $(nums[2]).text().replace(/%/g, '').replace(/,/g, '').trim();
        let change = parseFloat(changeText) || 0.0;
        
        // 하락인 경우
        if ($(nums[1]).find('img[alt="하락"]').length > 0 || $(nums[1]).html()?.includes("ico_down")) {
          change = -Math.abs(change);
        }
        
        const vText = $(nums[4]).text().replace(/,/g, '').trim();
        const mCap = parseInt(vText, 10) || 0;
        
        stocks.push({ name, ticker, change, value: mCap });
      });
    }
    
    return NextResponse.json(stocks);
  } catch (error: any) {
    console.error("Heatmap fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
