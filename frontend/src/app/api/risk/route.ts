import { NextRequest, NextResponse } from "next/server";

interface RiskCalculationRequest {
  coverageAmount: string;
  duration: number;
  asset: string;
  coverageType: string;
  userAddress?: string;
}

function getAssetRiskMultiplier(asset: string): number {
  const volatilityRatios: Record<string, number> = {
    BTC: 1.0,
    ETH: 1.2,
    HBAR: 1.5,
    USDC: 0.1,
    USDT: 0.1,
    DAI: 0.2,
  };
  return volatilityRatios[asset.toUpperCase()] || 1.0;
}

function getCoverageTypeMultiplier(coverageType: string): number {
  const typeMultipliers: Record<string, number> = {
    price_protection: 1.5,
    smart_contract: 1.2,
    bridge_protection: 1.3,
    stablecoin_depeg: 1.4,
  };
  return typeMultipliers[coverageType] || 1.0;
}

export async function POST(request: NextRequest) {
  try {
    const body: RiskCalculationRequest = await request.json();
    const { coverageAmount, duration, asset, coverageType } = body;

    // Basic validation
    if (!coverageAmount || !duration || !asset || !coverageType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const baseRate = 0.05;
    const durationMultiplier = 1 + duration / 365;

    const assetMultiplier = getAssetRiskMultiplier(asset);
    const typeMultiplier = getCoverageTypeMultiplier(coverageType);

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
