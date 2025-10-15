import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Mock protocol statistics - In production, aggregate from subgraph
    const stats = {
      tvl: 12500000,
      totalCoverage: 8125000,
      activePolicies: 342,
      totalPremiumsCollected: 256000,
      claimsProcessed: 45,
      claimsPaid: 180000,
      utilizationRate: 65,
      averageAPY: 12.5,
      chains: [
        {
          name: "Ethereum",
          tvl: 10000000,
          policies: 280,
        },
        {
          name: "Hedera",
          tvl: 2500000,
          policies: 62,
        },
      ],
      assets: [
        {
          symbol: "ETH",
          totalCoverage: 5000000,
          policies: 200,
        },
        {
          symbol: "BTC",
          totalCoverage: 2500000,
          policies: 100,
        },
        {
          symbol: "HBAR",
          totalCoverage: 625000,
          policies: 42,
        },
      ],
      recentActivity: [
        {
          type: "coverage_purchased",
          amount: "10 ETH",
          timestamp: Date.now() - 3600000,
        },
        {
          type: "claim_paid",
          amount: "5 ETH",
          timestamp: Date.now() - 7200000,
        },
        {
          type: "liquidity_added",
          amount: "50 ETH",
          timestamp: Date.now() - 10800000,
        },
      ],
      historicalData: {
        tvl: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split("T")[0],
          value: 10000000 + Math.random() * 2500000,
        })),
        premiums: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split("T")[0],
          value: 5000 + Math.random() * 3000,
        })),
      },
    };

    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}
