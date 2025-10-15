import { NextRequest, NextResponse } from "next/server";

// Mock Pyth price data - In production, fetch from Pyth Network
const MOCK_PRICES: Record<string, { price: number; change24h: number; lastUpdate: number }> = {
  ETH: { price: 3245.67, change24h: 2.34, lastUpdate: Date.now() },
  BTC: { price: 68234.12, change24h: -1.23, lastUpdate: Date.now() },
  HBAR: { price: 0.12, change24h: 5.67, lastUpdate: Date.now() },
  USDC: { price: 1.0, change24h: 0.01, lastUpdate: Date.now() },
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbolsParam = searchParams.get("symbols");

    if (!symbolsParam) {
      return NextResponse.json({ error: "Symbols parameter required" }, { status: 400 });
    }

    const symbols = symbolsParam.split(",").map((s) => s.trim().toUpperCase());
    const prices: Record<string, any> = {};

    for (const symbol of symbols) {
      if (MOCK_PRICES[symbol]) {
        prices[symbol] = {
          symbol,
          ...MOCK_PRICES[symbol],
        };
      }
    }

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
