import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 뉴스 광고 필터
const AD_KEYWORDS = ["[AD]", "(광고)", "제작지원", "기획기사", "PR", "유료공고", "제2의", "폭등임박", "상한가 직행", "1000% 수익", "카톡방", "무료입장"];

function isCleanNews(title: string) {
  return !AD_KEYWORDS.some(kw => title.includes(kw));
}

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  
  // 구글 뉴스 RSS 피드 사용
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(decodedName)}&hl=ko&gl=KR&ceid=KR:ko`;
  
  try {
    const response = await fetch(url, {
      next: { revalidate: 1800 }, // 30분 캐시
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) return NextResponse.json({ news: [] });

    const xml = await response.text();
    
    // 단순 정규식 파싱 (cheerio 설치되어 있으나 여기선 간단히)
    const items: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title>(.*?)<\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const dateRegex = /<pubDate>(.*?)<\/pubDate>/;
    
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 12) {
      const itemContent = match[1];
      const titleMatch = itemContent.match(titleRegex);
      const linkMatch = itemContent.match(linkRegex);
      const dateMatch = itemContent.match(dateRegex);
      
      let title = titleMatch ? titleMatch[1] : "";
      // 구글 뉴스 출처 제거 ( - 출처)
      if (title.includes(" - ")) {
        title = title.split(" - ").slice(0, -1).join(" - ");
      }
      
      if (title && isCleanNews(title)) {
        items.push({
          title,
          link: linkMatch ? linkMatch[1] : "#",
          date: dateMatch ? dateMatch[1] : ""
        });
      }
    }

    return NextResponse.json({ stock_name: decodedName, news: items });
  } catch (error: any) {
    console.error("News fetch error:", error);
    return NextResponse.json({ news: [] });
  }
}
