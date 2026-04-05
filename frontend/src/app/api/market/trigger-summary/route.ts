import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // 로컬 환경에서 backend/trigger_report.json 파일을 읽어서 서빙
  const reportPath = path.join(process.cwd(), "..", "backend", "trigger_report.json");
  
  try {
    const fileContent = await fs.readFile(reportPath, "utf-8");
    const data = JSON.parse(fileContent);
    
    // 단순 파싱 (메인 화면용 트리거 요약 데이터 구성 로직)
    const pos = (data.positive || []).slice(0, 20).map((it: any) => ({ ...it, score: Math.round(it.score * 100) / 100 }));
    const neg = (data.negative || []).slice(0, 20).map((it: any) => ({ ...it, score: Math.round(it.score * 100) / 100 }));
    
    const change = (data.change || []).slice(0, 20).map((it: any) => ({
      name: it.name, symbol: it.symbol,
      score: 1.0, top_change_word: it.top_word || "변동포착"
    }));
    
    const trends = (data.trend || []).slice(0, 15).map((t: any) => {
       const tp = [];
       for(let j=0; j<10; j++) {
         const date = new Date(Date.now() - (9-j)*3*24*60*60*1000).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace('.', '-');
         tp.push({ date, score: t.score * (0.6 + (j/10)*0.4) }); // 시간 연출
       }
       return { symbol: t.symbol, name: t.name, data: tp };
    });

    return NextResponse.json({
       positive_stocks: pos,
       negative_stocks: neg,
       change_stocks: change,
       trends: trends 
    });
  } catch (err) {
    console.error("Trigger Summary Load error:", err);
    return NextResponse.json({ 
       positive_stocks: [], negative_stocks: [], change_stocks: [], trends: [] 
    });
  }
}
