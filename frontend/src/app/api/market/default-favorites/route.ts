import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const revalidate = 600; // 10분 캐싱: 일반 방문자들에게 빠르게 제공

export async function GET() {
  try {
    // 관리자 계정을 DB에서 조회
    const adminUser = await (prisma as any).user.findUnique({
      where: { email: "jeilove17@gmail.com" } // 전역 룰에 명시된 최고 관리자 이메일
    });
    
    if (!adminUser) {
      return NextResponse.json({ favoriteGroups: [], ungroupedStocks: [] });
    }

    // 관리자 소유의 그룹 조회
    const groups = await (prisma as any).favoriteGroup.findMany({
      where: { userId: adminUser.id },
      include: { stocks: true },
      orderBy: { createdAt: "asc" },
    });

    const favoriteGroups = groups.filter((g: any) => g.name !== "!!UNGROUPED!!");
    const ungroupedGroup = groups.find((g: any) => g.name === "!!UNGROUPED!!");

    return NextResponse.json({
      favoriteGroups: favoriteGroups.map((g: any) => ({
        id: g.id,
        name: g.name, // 원본의 ID는 충돌을 피하기 위해 유지
        stocks: g.stocks.map((s: any) => ({ symbol: s.symbol, name: s.name, industry: s.industry }))
      })),
      ungroupedStocks: ungroupedGroup ? ungroupedGroup.stocks.map((s: any) => ({ symbol: s.symbol, name: s.name, industry: s.industry })) : [],
    });
  } catch (error) {
    console.error("Default favorites fetch error:", error);
    return NextResponse.json({ favoriteGroups: [], ungroupedStocks: [] }, { status: 500 });
  }
}
