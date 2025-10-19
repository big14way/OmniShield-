"use client";

import { useEffect, useState } from "react";
import { pythPriceService } from "@/lib/integrations/pyth";
import type { PythPriceResponse } from "@/lib/integrations/pyth";

const SUPPORTED_ASSETS = ["ETH", "BTC", "HBAR", "USDC"];
const ASSET_DISPLAY_NAMES: Record<string, string> = {
  ETH: "ETH/USD",
  BTC: "BTC/USD",
  HBAR: "HBAR/USD",
  USDC: "USDC/USD",
};

export function PriceDisplay() {
  const [prices, setPrices] = useState<Record<string, PythPriceResponse>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setIsLoading(true);
        const priceData = await pythPriceService.fetchPrices(SUPPORTED_ASSETS);
        console.log("Fetched price data:", priceData);
        setPrices(priceData);
        setError(null);
      } catch (err) {
        setError("Failed to fetch prices");
        console.error("Error fetching prices:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number, symbol: string) => {
    if (symbol === "HBAR/USD") {
      return `$${price.toFixed(4)}`;
    }
    if (symbol === "USDC/USD") {
      return `$${price.toFixed(2)}`;
    }
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Real-Time Asset Prices</h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading prices...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Real-Time Asset Prices</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Real-Time Asset Prices</h3>
        <div className="flex items-center text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Live via Pyth Network
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SUPPORTED_ASSETS.map((asset) => {
          const priceData = prices[asset];
          if (!priceData) return null;

          const displayName = ASSET_DISPLAY_NAMES[asset];
          const isPositive = priceData.change24h >= 0;

          return (
            <div
              key={asset}
              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{displayName}</span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {formatChange(priceData.change24h)}
                </span>
              </div>

              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatPrice(priceData.price, displayName)}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Updated {new Date(priceData.lastUpdate).toLocaleTimeString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Prices powered by{" "}
          <a
            href="https://pyth.network"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Pyth Network
          </a>
          {" • "}Updates every 30 seconds
        </p>
      </div>
    </div>
  );
}
