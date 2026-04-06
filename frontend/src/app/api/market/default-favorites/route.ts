import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 600; // 10분 캐싱: 일반 방문자들에게 빠르게 제공

// DB가 비어있을 때 사용할 기본 fallback 종목 목록
const FALLBACK_STOCKS = [
  { symbol: "005930", name: "삼성전자", industry: "반도체" },
  { symbol: "000660", name: "SK하이닉스", industry: "반도체" },
  { symbol: "042700", name: "한미반도체", industry: "반도체" },
  { symbol: "003670", name: "포스코퓨처엠", industry: "이차전지" },
  { symbol: "373220", name: "LG에너지솔루션", industry: "이차전지" },
  { symbol: "207940", name: "삼성바이오로직스", industry: "바이오" },
  { symbol: "068270", name: "셀트리온", industry: "바이오" },
  { symbol: "000100", name: "유한양행", industry: "바이오" },
  { symbol: "005380", name: "현대차", industry: "자동차" },
  { symbol: "000270", name: "기아", industry: "자동차" },
  { symbol: "035420", name: "NAVER", industry: "IT서비스" },
  { symbol: "035720", name: "카카오", industry: "IT서비스" },
];

const FALLBACK_RESPONSE = {
  favoriteGroups: [
    { id: "default-semi", name: "반도체", stocks: FALLBACK_STOCKS.filter(s => s.industry === "반도체") },
    { id: "default-bio", name: "바이오", stocks: FALLBACK_STOCKS.filter(s => s.industry === "바이오") },
    { id: "default-ev", name: "이차전지", stocks: FALLBACK_STOCKS.filter(s => s.industry === "이차전지") },
    { id: "default-auto", name: "자동차", stocks: FALLBACK_STOCKS.filter(s => s.industry === "자동차") },
  ],
  ungroupedStocks: FALLBACK_STOCKS.filter(s => s.industry === "IT서비스"),
};

export async function GET() {
  try {
    // 관리자 계정을 DB에서 조회
    const adminUser = await (prisma as any).user.findUnique({
      where: { email: "jeilove17@gmail.com" } // 전역 룰에 명시된 최고 관리자 이메일
    });

    if (!adminUser) {
      // 관리자 계정 없으면 STOCK_LIST 기반 fallback 반환
      return NextResponse.json(FALLBACK_RESPONSE);
    }

    // 관리자 소유의 그룹 조회
    const groups = await (prisma as any).favoriteGroup.findMany({
      where: { userId: adminUser.id },
      include: { stocks: true },
      orderBy: { createdAt: "asc" },
    });

    const favoriteGroups = groups.filter((g: any) => g.name !== "!!UNGROUPED!!");
    const ungroupedGroup = groups.find((g: any) => g.name === "!!UNGROUPED!!");

    const mappedGroups = favoriteGroups.map((g: any) => ({
      id: g.id,
      name: g.name,
      stocks: g.stocks.map((s: any) => ({ symbol: s.symbol, name: s.name, industry: s.industry }))
    }));
    const mappedUngrouped = ungroupedGroup
      ? ungroupedGroup.stocks.map((s: any) => ({ symbol: s.symbol, name: s.name, industry: s.industry }))
      : [];

    // DB 데이터가 실제 종목을 포함하는지 확인 - 비어있으면 fallback 반환
    const hasRealData = mappedUngrouped.length > 0 || mappedGroups.some((g: any) => g.stocks.length > 0);
    if (!hasRealData) {
      console.warn("[default-favorites] DB is empty, returning STOCK_LIST fallback");
      return NextResponse.json(FALLBACK_RESPONSE);
    }

    return NextResponse.json({
      favoriteGroups: mappedGroups,
      ungroupedStocks: mappedUngrouped,
    });
  } catch (error) {
    console.error("Default favorites fetch error:", error);
    // 에러 시에도 fallback 반환 (빈 배열 대신)
    return NextResponse.json(FALLBACK_RESPONSE, { status: 200 });
  }
}
