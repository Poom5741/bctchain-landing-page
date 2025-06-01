"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export function TradingInterface() {
  const [fromToken, setFromToken] = useState("sBTC");
  const [toToken, setToToken] = useState("sETH");
  const [amount, setAmount] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const syntheticAssets = [
    {
      symbol: "sBTC",
      name: "Synthetic Bitcoin",
      price: "$43,250",
      change: "+2.4%",
    },
    {
      symbol: "sETH",
      name: "Synthetic Ethereum",
      price: "$2,680",
      change: "+1.8%",
    },
    { symbol: "sUSD", name: "Synthetic USD", price: "$1.00", change: "0.0%" },
    {
      symbol: "sGOLD",
      name: "Synthetic Gold",
      price: "$2,045",
      change: "+0.7%",
    },
    {
      symbol: "sOIL",
      name: "Synthetic Oil",
      price: "$78.50",
      change: "-1.2%",
    },
    {
      symbol: "sSPX",
      name: "Synthetic S&P 500",
      price: "$4,567",
      change: "+0.9%",
    },
  ];

  // Fixed error scenarios (no random selection)
  const errorScenarios = [
    {
      title: "Demo Mode - Connect Wallet",
      description:
        "This is a preview interface. Connect your wallet to start trading real synthetic assets.",
      severity: "info" as "info" | "warning" | "error",
    },
    {
      title: "Network Selection Required",
      description: "Please connect to BCTChain network to continue trading.",
      severity: "warning" as "info" | "warning" | "error",
    },
    {
      title: "Mainnet Coming Soon",
      description:
        "Trading will be available when BCTChain mainnet launches. Stay tuned!",
      severity: "info" as "info" | "warning" | "error",
    },
  ];

  // Use first error scenario consistently
  const currentError = errorScenarios[0];

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  };

  const handleTrade = async () => {
    if (!amount) return;

    setIsRedirecting(true);

    // Simulate redirect delay
    setTimeout(() => {
      window.location.href =
        "/error?code=503&message=Trading interface is currently in development. Please check back soon!";
    }, 1500);
  };

  const calculateEstimate = () => {
    if (!amount || !mounted) return "0.00";

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return "0.00";

    // Simple mock calculation
    const rate =
      fromToken === "sBTC" && toToken === "sETH"
        ? 16.12
        : fromToken === "sETH" && toToken === "sBTC"
        ? 0.062
        : 1.0;

    return (numAmount * rate).toFixed(4);
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return <div className="min-h-[600px] animate-pulse bg-white/5 rounded-xl" />;
  }

  return (
    <section className="py-20">
      {/* ...existing container and header code... */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-in fade-in-0 slide-in-from-bottom-8 duration-1000">
            <h2 className="text-4xl font-bold text-white mb-4">
              Synthetic Asset Trading
            </h2>
            <p className="text-gray-400 text-lg">
              Trade synthetic assets backed by real-world value with zero slippage
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Trading Interface */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl animate-in fade-in-0 slide-in-from-left-8 duration-1000 delay-200">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <ArrowUpDown className="w-5 h-5 mr-2" />
                  Swap Assets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Error/Info Display */}
                <div
                  className={`p-4 rounded-lg border flex items-start space-x-3 ${
                    currentError.severity === "error"
                      ? "bg-red-500/10 border-red-500/20 text-red-200"
                      : currentError.severity === "warning"
                      ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-200"
                      : "bg-blue-500/10 border-blue-500/20 text-blue-200"
                  }`}
                >
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">{currentError.title}</h4>
                    <p className="text-sm opacity-90 mt-1">
                      {currentError.description}
                    </p>
                  </div>
                </div>

                {/* From Token */}
                <div>
                  <Label className="text-white">From</Label>
                  <div className="flex space-x-2 mt-2">
                    <Select value={fromToken} onValueChange={setFromToken}>
                      <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {syntheticAssets.map((asset) => (
                          <SelectItem key={asset.symbol} value={asset.symbol}>
                            {asset.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="flex-1 bg-white/5 border-white/10 text-white"
                      type="number"
                      step="0.0001"
                      min="0"
                    />
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSwapTokens}
                    className="rounded-full p-3 bg-white/5 hover:bg-white/10 border border-white/10"
                  >
                    <ArrowUpDown className="w-4 h-4 text-white" />
                  </Button>
                </div>

                {/* To Token */}
                <div>
                  <Label className="text-white">To</Label>
                  <div className="flex space-x-2 mt-2">
                    <Select value={toToken} onValueChange={setToToken}>
                      <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {syntheticAssets.map((asset) => (
                          <SelectItem key={asset.symbol} value={asset.symbol}>
                            {asset.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="0.00"
                      value={calculateEstimate()}
                      readOnly
                      className="flex-1 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>

                {/* Trade Details */}
                <div className="space-y-2 p-4 bg-white/5 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Exchange Rate</span>
                    <span className="text-white">
                      1 {fromToken} ={" "}
                      {fromToken === "sBTC" && toToken === "sETH"
                        ? "16.12"
                        : fromToken === "sETH" && toToken === "sBTC"
                        ? "0.062"
                        : "1.00"}{" "}
                      {toToken}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Slippage</span>
                    <span className="text-green-400">0.00%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Fee</span>
                    <span className="text-white">0.1%</span>
                  </div>
                </div>

                {/* Trade Button */}
                <Button
                  onClick={handleTrade}
                  disabled={!amount || isRedirecting}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                >
                  {isRedirecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Trade Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Market Overview */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl animate-in fade-in-0 slide-in-from-right-8 duration-1000 delay-400">
              <CardHeader>
                <CardTitle className="text-white">Market Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {syntheticAssets.map((asset, index) => (
                    <div
                      key={asset.symbol}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                    >
                      <div>
                        <div className="font-medium text-white group-hover:text-blue-300 transition-colors">
                          {asset.symbol}
                        </div>
                        <div className="text-sm text-gray-400">{asset.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-white">{asset.price}</div>
                        <div className="flex items-center text-sm">
                          {asset.change.startsWith("+") ? (
                            <TrendingUp className="w-3 h-3 mr-1 text-green-400" />
                          ) : asset.change.startsWith("-") ? (
                            <TrendingDown className="w-3 h-3 mr-1 text-red-400" />
                          ) : (
                            <div className="w-3 h-3 mr-1" />
                          )}
                          <span
                            className={
                              asset.change.startsWith("+")
                                ? "text-green-400"
                                : asset.change.startsWith("-")
                                ? "text-red-400"
                                : "text-gray-400"
                            }
                          >
                            {asset.change}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                  <h4 className="font-medium text-white mb-2">
                    Why Synthetic Assets?
                  </h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Zero slippage trading</li>
                    <li>• 24/7 market access</li>
                    <li>• No counterparty risk</li>
                    <li>• Instant settlement</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
