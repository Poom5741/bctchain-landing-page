"use client";

import { useState, useCallback } from "react";
import { TradingInterface } from "./trading-interface";
import { PriceChart } from "./price-chart";
import { TokenInfo } from "@/lib/token-list";

export function TradingInterfaceWithChart() {
  const [chartTokens, setChartTokens] = useState<{
    inputToken: TokenInfo | null;
    outputToken: TokenInfo | null;
  }>({
    inputToken: null,
    outputToken: null,
  });

  const handleTokensChange = useCallback((inputToken: TokenInfo | null, outputToken: TokenInfo | null) => {
    setChartTokens({ inputToken, outputToken });
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Chart Section - Takes up more space */}
      <div className="lg:col-span-2">
        <PriceChart
          key={`${chartTokens.inputToken?.address || 'none'}-${chartTokens.outputToken?.address || 'none'}`}
          inputToken={chartTokens.inputToken}
          outputToken={chartTokens.outputToken}
          className="h-full"
        />
      </div>
      
      {/* Trading Interface */}
      <div className="lg:col-span-1">
        <TradingInterface onTokensChange={handleTokensChange} />
      </div>
    </div>
  );
}