import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userAddress = searchParams.get("address");

    if (!userAddress) {
      return NextResponse.json({ error: "Address parameter required" }, { status: 400 });
    }

    // Mock user coverage data - In production, query subgraph or contract events
    const mockCoverageData = {
      active: [
        {
          id: 1,
          asset: "ETH",
          amount: "10",
          type: "Price Protection",
          startDate: "2025-01-01",
          endDate: "2025-02-01",
          premium: "0.05",
          status: "active",
        },
        {
          id: 2,
          asset: "BTC",
          amount: "0.5",
          type: "Smart Contract",
          startDate: "2025-01-10",
          endDate: "2025-04-10",
          premium: "0.02",
          status: "active",
        },
      ],
      expired: [
        {
          id: 3,
          asset: "ETH",
          amount: "5",
          type: "Rug Pull Protection",
          startDate: "2024-12-01",
          endDate: "2024-12-31",
          premium: "0.025",
          status: "expired",
        },
      ],
      totalCoverage: "10.5",
      totalPremiumPaid: "0.095",
      activePolicies: 2,
    };

    return NextResponse.json(mockCoverageData, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("Coverage API error:", error);
    return NextResponse.json({ error: "Failed to fetch coverage data" }, { status: 500 });
  }
}
