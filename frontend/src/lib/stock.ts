export async function fetchStockOHLCV(symbol: string, timeframe: "day" | "minute" = "day", count: number = 100) {
  const url = `https://fchart.stock.naver.com/sise.nhn?symbol=${symbol}&timeframe=${timeframe}&count=${count}&requestType=0`;
  
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      cache: "no-store", // v2.10.3: Next.js 내장 fetch 영구 캐시로 인한 404 차단 방지 (완전 실시간)
    });

    if (!response.ok) return [];

    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder("euc-kr");
    const xml = decoder.decode(buffer);

    // 단순 정규식을 이용해 <item data="..."/> 파싱
    const itemRegex = /<item data="([^"]+)"/g;
    let match;
    const data = [];

    while ((match = itemRegex.exec(xml)) !== null) {
      const parts = match[1].split("|");
      if (parts.length < 6) continue;

      let dt_str = parts[0];
      let time_val = "";
      if (dt_str.length >= 12) {
        time_val = `${dt_str.slice(0, 4)}-${dt_str.slice(4, 6)}-${dt_str.slice(6, 8)} ${dt_str.slice(8, 10)}:${dt_str.slice(10, 12)}`;
      } else {
        time_val = `${dt_str.slice(0, 4)}-${dt_str.slice(4, 6)}-${dt_str.slice(6, 8)}`;
      }

      data.push({
        time: time_val,
        open: parseFloat(parts[1]) || 0,
        high: parseFloat(parts[2]) || 0,
        low: parseFloat(parts[3]) || 0,
        close: parseFloat(parts[4]) || 0,
        volume: parseInt(parts[5], 10) || 0
      });
    }

    // 분봉의 경우 최신 날짜만 추출
    if (timeframe === "minute" && data.length > 0) {
      const latestDate = data[data.length - 1].time.split(" ")[0];
      return data.filter(d => d.time.startsWith(latestDate));
    }

    return data;
  } catch (err) {
    console.error(`Failed to fetch OHLCV for ${symbol}`, err);
    return [];
  }
}
