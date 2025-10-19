import { NextRequest, NextResponse } from "next/server";
import { pythPriceService } from "@/lib/integrations/pyth";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbolsParam = searchParams.get("symbols");

    if (!symbolsParam) {
      return NextResponse.json({ error: "Symbols parameter required" }, { status: 400 });
    }

    const symbols = symbolsParam.split(",").map((s) => s.trim().toUpperCase());
    const prices = await pythPriceService.fetchPrices(symbols);

    return NextResponse.json(prices, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Price API error:", error);
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
  }
}
