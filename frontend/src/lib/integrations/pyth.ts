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

    for (const symbol of symbols) {
      const priceId = PythPriceFeeds.getPriceFeedId(symbol);
      if (priceId) {
        priceIds.push(priceId);
        symbolToPriceId[symbol] = priceId;
      }
    }

    if (priceIds.length === 0) {
      return {};
    }

    const prices = await this.fetchLatestPrices(priceIds);
    const result: Record<string, PythPriceResponse> = {};

    for (const symbol of symbols) {
      const priceId = symbolToPriceId[symbol];
      if (priceId && prices[priceId]) {
        const priceData = prices[priceId];
        const change24h = await this.calculate24hChange(priceId, priceData.price);

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
      const idsParam = priceIds.map((id) => `ids[]=${id}`).join("&");
      const url = `${PYTH_HERMES_API}/v2/updates/price/latest?${idsParam}`;
      console.log("Fetching Pyth prices from:", url);

      const response = await globalThis.fetch(url);

      if (!response.ok) {
        console.error(`Pyth API error: ${response.status} ${response.statusText}`);
        throw new Error(`Pyth API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Pyth API response:", data);
      const result: Record<string, PythPrice> = {};

      if (data.parsed) {
        for (const priceData of data.parsed) {
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
      console.error("Error fetching Pyth prices, using fallback:", error);
      return this.getFallbackPrices(priceIds);
    }
  }

  private async calculate24hChange(priceId: string, currentPrice: number): Promise<number> {
    try {
      const oneDayAgo = Math.floor(Date.now() / 1000) - 86400;
      const response = await globalThis.fetch(
        `${PYTH_HERMES_API}/v2/updates/price/${oneDayAgo}?ids[]=${priceId}`
      );

      if (!response.ok) {
        return 0;
      }

      const data = await response.json();
      if (data.parsed && data.parsed.length > 0) {
        const priceInfo = data.parsed[0].price;
        const oldPrice = parseFloat(priceInfo.price) * Math.pow(10, priceInfo.expo);
        return ((currentPrice - oldPrice) / oldPrice) * 100;
      }

      return 0;
    } catch {
      return 0;
    }
  }

  private getFallbackPrices(priceIds: string[]): Record<string, PythPrice> {
    const fallbackPrices: Record<string, number> = {
      [PythPriceFeeds.ETH_USD]: 3245.67,
      [PythPriceFeeds.BTC_USD]: 68234.12,
      [PythPriceFeeds.HBAR_USD]: 0.12,
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
