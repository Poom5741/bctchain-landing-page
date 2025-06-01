"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpDown, TrendingUp, TrendingDown, Activity, ExternalLink, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

export function TradingInterface() {
  const [fromToken, setFromToken] = useState("sBTC")
  const [toToken, setToToken] = useState("sETH")
  const [amount, setAmount] = useState("")
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()

  const syntheticAssets = [
    { symbol: "sBTC", name: "Synthetic Bitcoin", price: "$43,250", change: "+2.4%" },
    { symbol: "sETH", name: "Synthetic Ethereum", price: "$2,680", change: "+1.8%" },
    { symbol: "sUSD", name: "Synthetic USD", price: "$1.00", change: "0.0%" },
    { symbol: "sGOLD", name: "Synthetic Gold", price: "$2,045", change: "+0.7%" },
    { symbol: "sSP500", name: "Synthetic S&P 500", price: "$4,750", change: "+1.2%" },
    { symbol: "sOIL", name: "Synthetic Oil", price: "$78.50", change: "-0.5%" },
  ]

  const handleTradeClick = () => {
    setIsRedirecting(true)

    // Simulate different error scenarios
    const errorScenarios = [
      { code: "400", message: "DEX integration is currently unavailable. Please check your request parameters." },
      { code: "500", message: "DEX service is temporarily down for maintenance. Please try again later." },
    ]

    const randomError = errorScenarios[Math.floor(Math.random() * errorScenarios.length)]

    setTimeout(() => {
      router.push(`/error?code=${randomError.code}&message=${encodeURIComponent(randomError.message)}`)
    }, 2000)
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in-0 slide-in-from-bottom-8 duration-1000">
          <h1 className="text-5xl font-bold text-white mb-4">Synthetic Asset Trading</h1>
          <p className="text-gray-400 text-lg">Trade synthetic assets with deep liquidity and minimal slippage</p>

          {/* DEX Notice */}
          <div className="mt-6 max-w-2xl mx-auto">
            <Card className="border-yellow-500/30 bg-yellow-500/5 backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-center text-yellow-400">
                  <ExternalLink className="w-5 h-5 mr-2" />
                  <span className="text-sm">Trading will redirect to our DEX platform</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trading Panel */}
          <div className="lg:col-span-2">
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <ArrowUpDown className="w-5 h-5 mr-2" />
                  Swap Synthetic Assets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* From Token */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">From</label>
                  <div className="flex space-x-2">
                    <Select value={fromToken} onValueChange={setFromToken}>
                      <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/10">
                        {syntheticAssets.map((asset) => (
                          <SelectItem key={asset.symbol} value={asset.symbol} className="text-white">
                            {asset.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="0.0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full border border-white/10 hover:bg-white/10"
                    onClick={() => {
                      const temp = fromToken
                      setFromToken(toToken)
                      setToToken(temp)
                    }}
                  >
                    <ArrowUpDown className="w-4 h-4 text-white" />
                  </Button>
                </div>

                {/* To Token */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">To</label>
                  <div className="flex space-x-2">
                    <Select value={toToken} onValueChange={setToToken}>
                      <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/10">
                        {syntheticAssets.map((asset) => (
                          <SelectItem key={asset.symbol} value={asset.symbol} className="text-white">
                            {asset.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="0.0"
                      readOnly
                      className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      value={amount ? (Number.parseFloat(amount) * 0.998).toFixed(6) : ""}
                    />
                  </div>
                </div>

                {/* Trade Info */}
                <div className="space-y-2 p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Exchange Rate</span>
                    <span className="text-white">
                      1 {fromToken} = 0.998 {toToken}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Trading Fee</span>
                    <span className="text-white">0.2%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Slippage</span>
                    <span className="text-green-400">&lt; 0.1%</span>
                  </div>
                </div>

                {/* Trade Button */}
                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white relative overflow-hidden"
                  onClick={handleTradeClick}
                  disabled={isRedirecting}
                >
                  {isRedirecting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Redirecting to DEX...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Trade on DEX
                    </>
                  )}
                  {isRedirecting && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 animate-pulse"></div>
                  )}
                </Button>

                {/* Warning Notice */}
                <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-orange-300">
                      <p className="font-medium mb-1">External DEX Integration</p>
                      <p className="text-orange-400">
                        Trading will redirect you to our external DEX platform. Please ensure you have your wallet
                        connected.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market Overview */}
          <div className="space-y-6">
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Market Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {syntheticAssets.map((asset, index) => (
                    <div
                      key={asset.symbol}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-white">{asset.symbol}</div>
                        <div className="text-xs text-gray-400">{asset.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-white">{asset.price}</div>
                        <div
                          className={`text-xs flex items-center ${
                            asset.change.startsWith("+") ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {asset.change.startsWith("+") ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {asset.change}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trading Stats */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">24h Trading Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Volume</span>
                    <span className="text-white font-medium">$2.4M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trades</span>
                    <span className="text-white font-medium">1,247</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active Pairs</span>
                    <span className="text-white font-medium">{syntheticAssets.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg. Slippage</span>
                    <span className="text-green-400 font-medium">&lt; 0.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DEX Status */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">DEX Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Connection</span>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
                      <span className="text-yellow-400 text-sm">Connecting...</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Liquidity</span>
                    <span className="text-white text-sm">$12.5M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Gas Price</span>
                    <span className="text-white text-sm">15 gwei</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
