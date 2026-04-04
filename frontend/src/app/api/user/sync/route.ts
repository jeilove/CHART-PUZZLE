import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { favoriteGroups, ungroupedStocks } = await req.json();
    const userId = session.user.id;

    // Use transaction to update favorites
    await (prisma as any).$transaction(async (tx: any) => {
      // Delete existing groups (and stocks due to cascade)
      await tx.favoriteGroup.deleteMany({ where: { userId } });

      // Create favorite groups and their stocks
      for (const group of favoriteGroups) {
        await tx.favoriteGroup.create({
          data: {
            name: group.name,
            userId,
            stocks: {
              create: group.stocks.map((s: { symbol: string; name: string; industry?: string }) => ({
                symbol: s.symbol,
                name: s.name,
                industry: s.industry || "",
              })),
            },
          },
        });
      }

      // Handle ungroupedStocks by creating a special group
      if (ungroupedStocks && ungroupedStocks.length > 0) {
        await tx.favoriteGroup.create({
          data: {
            name: "!!UNGROUPED!!",
            userId,
            stocks: {
              create: ungroupedStocks.map((s: { symbol: string; name: string; industry?: string }) => ({
                symbol: s.symbol,
                name: s.name,
                industry: s.industry || "",
              })),
            },
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = session.user.id;
    const groups = await (prisma as any).favoriteGroup.findMany({
      where: { userId },
      include: { stocks: true },
      orderBy: { createdAt: "asc" },
    });

    const favoriteGroups = groups.filter((g: any) => g.name !== "!!UNGROUPED!!");
    const ungroupedGroup = groups.find((g: any) => g.name === "!!UNGROUPED!!");

    return NextResponse.json({
      favoriteGroups: favoriteGroups.map((g: any) => ({
        id: g.id,
        name: g.name,
        stocks: g.stocks.map((s: any) => ({ symbol: s.symbol, name: s.name, industry: s.industry }))
      })),
      ungroupedStocks: ungroupedGroup ? ungroupedGroup.stocks.map((s: any) => ({ symbol: s.symbol, name: s.name, industry: s.industry })) : [],
    });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
