import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TRIGGER_KEYWORDS = {
  "positive": ["흑자전환", "어닝서프라이즈", "수익성개선", "성장", "강세", "회복", "상승", "상향", "모멘텀", "수혜"],
  "negative": ["어닝쇼크", "적자전환", "피크아웃", "부진", "악화", "약세", "하락", "하향", "침체", "불투명"],
  "neutral": ["부합", "전망", "유지", "조정", "가시성", "검토", "준비", "중립", "보수적"],
  "change": ["급증", "급감", "확대", "축소", "수주", "점유율", "CAPA", "수요"]
};

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") || "";
  
  const url = `https://finance.naver.com/research/company_list.naver?searchType=itemCode&itemCode=${symbol}&page=1`;
  
  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // 1시간 캐시
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) return NextResponse.json({ cloud: [], sentiment_score: 0 });

    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder("euc-kr");
    const html = decoder.decode(buffer);
    
    // 단순 파싱 (제목만 전수 분석)
    const keywordWeights: Record<string, number> = {};
    let sentimentScore = 0;
    
    // Naver Research 제목 추출
    const titleRegex = /<a href="company_read\.naver\?.*?">(.*?)<\/a>/g;
    const reports: string[] = [];
    let match;
    while ((match = titleRegex.exec(html)) !== null) {
      reports.push(match[1]);
    }
    
    for (const text of reports) {
      const textNorm = text.replace(/\s+/g, "").toUpperCase();
      for (const [sent, kws] of Object.entries(TRIGGER_KEYWORDS)) {
        for (const kw of kws) {
          if (textNorm.includes(kw)) {
             keywordWeights[kw] = (keywordWeights[kw] || 0) + 1;
             if (sent === "positive") sentimentScore += 1;
             else if (sent === "negative") sentimentScore -= 1.5;
          }
        }
      }
    }
    
    const cloud = Object.entries(keywordWeights).map(([text, val]) => {
      let s = "neutral";
      if (TRIGGER_KEYWORDS.positive.includes(text)) s = "positive";
      else if (TRIGGER_KEYWORDS.negative.includes(text)) s = "negative";
      else if (TRIGGER_KEYWORDS.change.includes(text)) s = "change";
      
      return { text, value: 10 + val * 15, sentiment: s };
    }).sort((a, b) => b.value - a.value).slice(0, 15);
    
    return NextResponse.json({
      symbol, name, cloud,
      sentiment_score: Math.round(sentimentScore * 100) / 100,
      total_report_count: reports.length,
      last_updated: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ symbol, name, cloud: [], sentiment_score: 0 });
  }
}
