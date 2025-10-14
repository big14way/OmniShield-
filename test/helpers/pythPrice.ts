import { ethers } from "hardhat";

/**
 * Pyth price data structure
 */
export interface PythPriceData {
  priceId: string;
  price: bigint;
  conf: bigint;
  expo: number;
  publishTime: number;
}

/**
 * Generate mock Pyth price data
 * @param price Price value (e.g., 2000 for $2000)
 * @param decimals Number of decimals (default 8)
 * @param confidence Confidence interval (default 1% of price)
 * @returns PythPriceData object
 */
export function generatePythPrice(
  price: number,
  decimals: number = 8,
  confidence?: number
): PythPriceData {
  const expo = -decimals;
  const priceScaled = BigInt(Math.floor(price * 10 ** decimals));
  const confScaled = confidence
    ? BigInt(Math.floor(confidence * 10 ** decimals))
    : priceScaled / 100n; // Default 1% confidence

  return {
    priceId: ethers.keccak256(ethers.toUtf8Bytes("ETH/USD")),
    price: priceScaled,
    conf: confScaled,
    expo,
    publishTime: Math.floor(Date.now() / 1000),
  };
}

/**
 * Generate batch of Pyth price updates
 * @param prices Array of prices
 * @returns Encoded price update data
 */
export function generateBatchPriceUpdate(prices: PythPriceData[]): string {
  // Simplified encoding - in production, use actual Pyth format
  return ethers.AbiCoder.defaultAbiCoder().encode(
    ["tuple(bytes32 priceId, int64 price, uint64 conf, int32 expo, uint256 publishTime)[]"],
    [
      prices.map((p) => ({
        priceId: p.priceId,
        price: p.price,
        conf: p.conf,
        expo: p.expo,
        publishTime: p.publishTime,
      })),
    ]
  );
}

/**
 * Generate stale price data (older than maxAge)
 * @param price Price value
 * @param ageSeconds How old the price should be
 * @returns PythPriceData with old timestamp
 */
export function generateStalePrice(price: number, ageSeconds: number): PythPriceData {
  const priceData = generatePythPrice(price);
  priceData.publishTime = Math.floor(Date.now() / 1000) - ageSeconds;
  return priceData;
}

/**
 * Calculate price volatility between two prices
 * @param price1 First price
 * @param price2 Second price
 * @returns Volatility as percentage (0-100)
 */
export function calculateVolatility(price1: bigint, price2: bigint): number {
  const diff = price1 > price2 ? price1 - price2 : price2 - price1;
  const avg = (price1 + price2) / 2n;
  return Number((diff * 10000n) / avg) / 100; // Return as percentage
}

/**
 * Generate price series with volatility
 * @param basePrice Base price
 * @param count Number of prices
 * @param volatilityPercent Volatility percentage (e.g., 5 for 5%)
 * @returns Array of PythPriceData
 */
export function generateVolatilePriceSeries(
  basePrice: number,
  count: number,
  volatilityPercent: number
): PythPriceData[] {
  const prices: PythPriceData[] = [];
  let currentPrice = basePrice;

  for (let i = 0; i < count; i++) {
    // Random walk with volatility
    const change = (Math.random() - 0.5) * 2 * volatilityPercent;
    currentPrice = currentPrice * (1 + change / 100);

    prices.push(generatePythPrice(currentPrice));

    // Advance time by 1 minute for each price
    if (i < count - 1) {
      prices[prices.length - 1].publishTime += 60;
    }
  }

  return prices;
}

/**
 * Common price feed IDs (mock)
 */
export const PRICE_FEED_IDS = {
  ETH_USD: ethers.keccak256(ethers.toUtf8Bytes("ETH/USD")),
  BTC_USD: ethers.keccak256(ethers.toUtf8Bytes("BTC/USD")),
  USDC_USD: ethers.keccak256(ethers.toUtf8Bytes("USDC/USD")),
  DAI_USD: ethers.keccak256(ethers.toUtf8Bytes("DAI/USD")),
};

/**
 * Standard test prices
 */
export const TEST_PRICES = {
  ETH_USD: 2000,
  BTC_USD: 40000,
  USDC_USD: 1,
  DAI_USD: 1,
};
