import { useState, useEffect } from "react";

export interface AssetPrice {
  symbol: string;
  price: number;
  change24h: number;
  lastUpdate: number;
}

export function usePrices(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, AssetPrice>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (symbols.length === 0) {
      setIsLoading(false);
      return;
    }

    const fetchPrices = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/prices?symbols=${symbols.join(",")}`);
        if (!response.ok) throw new Error("Failed to fetch prices");

        const data = await response.json();
        setPrices(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [symbols.join(",")]);

  return { prices, isLoading, error };
}

export function useAssetPrice(symbol: string) {
  const { prices, isLoading, error } = usePrices([symbol]);
  return { price: prices[symbol], isLoading, error };
}
