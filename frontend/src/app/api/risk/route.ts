import { NextRequest, NextResponse } from "next/server";

interface RiskCalculationRequest {
  coverageAmount: string;
  duration: number;
  asset: string;
  coverageType: string;
  userAddress?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RiskCalculationRequest = await request.json();
    const { coverageAmount, duration, asset, coverageType, userAddress } = body;

    // Basic validation
    if (!coverageAmount || !duration || !asset || !coverageType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Mock risk calculation - In production, use on-chain RiskEngine
    const baseRate = 0.05; // 5% base
    const durationMultiplier = 1 + duration / 365;
    const assetMultiplier =
      asset === "BTC" ? 1.0 : asset === "ETH" ? 1.2 : asset === "HBAR" ? 1.5 : 1.0;
    const typeMultiplier =
      coverageType === "price_protection"
        ? 1.5
        : coverageType === "smart_contract"
        ? 1.2
        : 1.3;

    const riskScore = baseRate * durationMultiplier * assetMultiplier * typeMultiplier;
    const premium = parseFloat(coverageAmount) * riskScore;

    const result = {
      riskScore: Math.floor(riskScore * 10000), // Basis points
      premium: premium.toFixed(6),
      premiumPercentage: (riskScore * 100).toFixed(2),
      factors: {
        baseRate: baseRate * 100,
        duration: durationMultiplier,
        asset: assetMultiplier,
        type: typeMultiplier,
      },
    };

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Risk calculation error:", error);
    return NextResponse.json({ error: "Failed to calculate risk" }, { status: 500 });
  }
}
