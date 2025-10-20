import { PythPriceFeeds } from "./pythPriceFeeds";

export interface PythPrice {
  price: number;
  conf: number;
  expo: number;
  publishTime: number;
}

export interface PythPriceResponse {
  symbol: string;
  price: number;
  change24h: number;
  lastUpdate: number;
  confidence: number;
}

const PYTH_HERMES_API = "https://hermes.pyth.network";

export class PythPriceService {
  private priceCache: Map<string, { data: PythPriceResponse; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30000;

  async fetchPrices(symbols: string[]): Promise<Record<string, PythPriceResponse>> {
    const priceIds: string[] = [];
    const symbolToPriceId: Record<string, string> = {};

    console.log("Fetching prices for symbols:", symbols);

    for (const symbol of symbols) {
      const priceId = PythPriceFeeds.getPriceFeedId(symbol);
      console.log(`Symbol: ${symbol}, Price ID: ${priceId}`);
      if (priceId) {
        priceIds.push(priceId);
        symbolToPriceId[symbol] = priceId;
      }
    }

    console.log("Price IDs to fetch:", priceIds);

    if (priceIds.length === 0) {
      console.warn("No valid price IDs found!");
      return {};
    }

    let prices: Record<string, PythPrice>;
    try {
      prices = await this.fetchLatestPrices(priceIds);
    } catch (error) {
      console.error("Failed to fetch live prices, using fallback:", error);
      prices = this.getFallbackPrices(priceIds);
    }

    const result: Record<string, PythPriceResponse> = {};

    for (const symbol of symbols) {
      const priceId = symbolToPriceId[symbol];
      if (priceId && prices[priceId]) {
        const priceData = prices[priceId];
        const change24h = await this.calculate24hChange();

        result[symbol] = {
          symbol,
          price: priceData.price,
          change24h,
          lastUpdate: priceData.publishTime * 1000,
          confidence: priceData.conf,
        };

        this.priceCache.set(symbol, {
          data: result[symbol],
          timestamp: Date.now(),
        });
      }
    }

    return result;
  }

  async fetchLatestPrices(priceIds: string[]): Promise<Record<string, PythPrice>> {
    try {
      // Remove 0x prefix for API call
      const cleanIds = priceIds.map((id) => id.replace("0x", ""));

      // Build URL with proper encoding
      const url = new globalThis.URL(`${PYTH_HERMES_API}/api/latest_price_feeds`);
      cleanIds.forEach((id) => {
        url.searchParams.append("ids[]", id);
      });

      console.log("Fetching Pyth prices from:", url.toString());

      const response = await globalThis.fetch(url);

      console.log("Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Pyth API error: ${response.status} ${response.statusText}`);
        console.error("Error response body:", errorText);
        throw new Error(`Pyth API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Pyth API response:", data);
      const result: Record<string, PythPrice> = {};

      // data is an array of price feeds
      if (Array.isArray(data)) {
        for (const priceData of data) {
          const id = `0x${priceData.id}`;
          const priceInfo = priceData.price;

          result[id] = {
            price: parseFloat(priceInfo.price) * Math.pow(10, priceInfo.expo),
            conf: parseFloat(priceInfo.conf) * Math.pow(10, priceInfo.expo),
            expo: priceInfo.expo,
            publishTime: priceInfo.publish_time,
          };
        }
      }

      console.log("Parsed prices:", result);
      return result;
    } catch (error) {
      console.error("Error fetching Pyth prices:", error);
      throw error;
    }
  }

  private async calculate24hChange(): Promise<number> {
    // TODO: Implement 24h change calculation using EMA price comparison or price history
    // For now, return 0 as the historical price API endpoint needs to be implemented
    return 0;
  }

  private getFallbackPrices(priceIds: string[]): Record<string, PythPrice> {
    const fallbackPrices: Record<string, number> = {
      [PythPriceFeeds.ETH_USD]: 3985.0,
      [PythPriceFeeds.BTC_USD]: 108900.0,
      [PythPriceFeeds.HBAR_USD]: 0.17,
      [PythPriceFeeds.USDC_USD]: 1.0,
    };

    const result: Record<string, PythPrice> = {};
    for (const priceId of priceIds) {
      if (fallbackPrices[priceId]) {
        result[priceId] = {
          price: fallbackPrices[priceId],
          conf: fallbackPrices[priceId] * 0.01,
          expo: -8,
          publishTime: Math.floor(Date.now() / 1000),
        };
      }
    }

    return result;
  }

  getCachedPrice(symbol: string): PythPriceResponse | null {
    const cached = this.priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }
}

export const pythPriceService = new PythPriceService();
