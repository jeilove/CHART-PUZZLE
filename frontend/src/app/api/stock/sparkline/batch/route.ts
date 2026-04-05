import { NextResponse } from "next/server";
import { fetchStockOHLCV } from "@/lib/stock";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get("symbols") || "";
  const timeframe = (searchParams.get("timeframe") as "day" | "minute") || "day";
  const count = parseInt(searchParams.get("count") || "20", 10);

  if (!symbols) return NextResponse.json({});

  const symbolList = symbols.split(",").filter(s => s.trim());
  
  try {
    const results: Record<string, number[]> = {};
    
    // 비동기 병렬 처리
    const fetchPromises = symbolList.map(async (sym) => {
      const data = await fetchStockOHLCV(sym, timeframe, count);
      results[sym] = data.map((d: any) => d.close);
    });

    await Promise.all(fetchPromises);
    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
