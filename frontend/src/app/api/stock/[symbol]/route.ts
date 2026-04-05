import { NextResponse } from "next/server";
import { fetchStockOHLCV } from "@/lib/stock";

export async function GET(request: Request, context: any) {
  const { params } = context;
  const symbol = params.symbol;
  const url = new URL(request.url);
  const timeframe = (url.searchParams.get("timeframe") as "day" | "minute") || "day";
  
  try {
    const data = await fetchStockOHLCV(symbol, timeframe, 100);
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ symbol, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
