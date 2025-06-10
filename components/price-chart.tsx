"use client";

import { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TokenLogo } from "@/components/ui/token-logo";
import { TokenInfo } from "@/lib/token-list";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Loader2,
  RefreshCw,
  Clock,
  AlertCircle,
} from "lucide-react";
import { formatDistance } from "date-fns";

interface PriceDataPoint {
  timestamp: number;
  price: number;
  volume: number;
  date: string;
  priceUSD: number;
}

interface PriceChartProps {
  inputToken: TokenInfo | null;
  outputToken: TokenInfo | null;
  className?: string;
}

type TimeRange = "1H" | "1D" | "7D" | "30D" | "90D" | "1Y";

const TIME_RANGES: { label: TimeRange; hours: number }[] = [
  { label: "1H", hours: 1 },
  { label: "1D", hours: 24 },
  { label: "7D", hours: 168 },
  { label: "30D", hours: 720 },
  { label: "90D", hours: 2160 },
  { label: "1Y", hours: 8760 },
];

// Subgraph query for price data (updated to match actual BCT subgraph schema)
const PRICE_HISTORY_QUERY = `
  query GetPairHourDatas($pair: String!, $orderBy: String!, $orderDirection: String!, $first: Int!, $where: PairHourData_filter) {
    pairHourDatas(
      where: $where
      orderBy: $orderBy
      orderDirection: $orderDirection
      first: $first
    ) {
      id
      hourStartUnix
      pair {
        id
        token0 {
          id
          symbol
          name
          decimals
        }
        token1 {
          id
          symbol
          name
          decimals
        }
      }
      reserve0
      reserve1
      reserveUSD
    }
  }
`;

// Query to find pair address (updated for BCT subgraph schema)
const PAIR_QUERY = `
  query GetPair($token0: String!, $token1: String!) {
    pairs(where: {
      or: [
        { token0: $token0, token1: $token1 },
        { token0: $token1, token1: $token0 }
      ]
    }) {
      id
      token0 {
        id
        symbol
        name
        decimals
      }
      token1 {
        id
        symbol
        name
        decimals
      }
      reserveUSD
      volumeUSD
      reserve0
      reserve1
    }
  }
`;

export function PriceChart({ inputToken, outputToken, className = "" }: PriceChartProps) {
  const [priceData, setPriceData] = useState<PriceDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<TimeRange>("1D");
  const [pairAddress, setPairAddress] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null);
  const [isInverted, setIsInverted] = useState(false);

  // Helper function to fix USDG decimal calculation in prices
  const fixUSDGPrice = (price: number, outputTokenSymbol: string) => {
    // Special handling for USDG price calculation
    if (outputTokenSymbol === "USDG" && price > 1000000) {
      // Original price ~1596404540.72, target price ~1.6
      // Need to divide by 10^9 (1,000,000,000) to get correct price
      return price / 1000000000;
    }
    return price;
  };

  // Reset chart when component mounts or tokens change
  useEffect(() => {
    // Always reset state when tokens change (including initial mount)
    setPriceData([]);
    setCurrentPrice(null);
    setPriceChange24h(null);
    setError(null);
    setPairAddress(null);
    setLoading(false);
  }, [inputToken?.address, outputToken?.address]);

  // Fetch pair address when tokens change
  useEffect(() => {
    const fetchPairAddress = async () => {
      if (!inputToken || !outputToken) {
        return;
      }

      // Map native BCT to WBCT for chart queries since subgraph only has WBCT pairs
      const getChartTokenAddress = (token: TokenInfo) => {
        if (token.address.toLowerCase() === "0x0000000000000000000000000000000000000000" && token.symbol === "BCT") {
          // Use WBCT address for native BCT in chart queries
          return "0xa74d1fcc64cd9f701b42224a22778b1dcc447fce";
        }
        return token.address.toLowerCase();
      };

      const chartInputAddress = getChartTokenAddress(inputToken);
      const chartOutputAddress = getChartTokenAddress(outputToken);

      setLoading(true);

      try {
        const response = await fetch("https://graph.bctchain.com/subgraphs/name/bct/dex", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: PAIR_QUERY,
            variables: {
              token0: chartInputAddress,
              token1: chartOutputAddress,
            },
          }),
        });

        const data = await response.json();
        
        if (data.data?.pairs?.length > 0) {
          const pair = data.data.pairs[0];
          setPairAddress(pair.id);
          
          // Determine if we need to invert the price based on token order
          const isToken0Input = pair.token0.id.toLowerCase() === chartInputAddress;
          setIsInverted(!isToken0Input);
          
          // Calculate current price from reserves (token1/token0 or token0/token1)
          const reserve0 = parseFloat(pair.reserve0);
          const reserve1 = parseFloat(pair.reserve1);
          
          if (reserve0 > 0 && reserve1 > 0) {
            // Price = outputToken reserve / inputToken reserve
            let price = isToken0Input ? (reserve1 / reserve0) : (reserve0 / reserve1);
            
            // Apply USDG decimal fix to current price
            price = fixUSDGPrice(price, outputToken.symbol);
            
            setCurrentPrice(price);
          } else {
            setCurrentPrice(null);
          }
        } else {
          setPairAddress(null);
          setCurrentPrice(null);
          setError(`No trading pair found for ${inputToken.symbol}/${outputToken.symbol}`);
        }
      } catch (err) {
        console.error("Error fetching pair:", err);
        setPairAddress(null);
        setCurrentPrice(null);
        setError("Failed to fetch trading pair data");
      } finally {
        setLoading(false);
      }
    };

    fetchPairAddress();
  }, [inputToken?.address, outputToken?.address]);

  // Fetch price data
  useEffect(() => {
    const fetchPriceData = async () => {
      if (!pairAddress || !inputToken || !outputToken) {
        setPriceData([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const range = TIME_RANGES.find(r => r.label === selectedRange);
        const hoursAgo = range?.hours || 24;
        const timestampFrom = Math.floor((Date.now() - hoursAgo * 60 * 60 * 1000) / 1000);

        const response = await fetch("https://graph.bctchain.com/subgraphs/name/bct/dex", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: PRICE_HISTORY_QUERY,
            variables: {
              pair: pairAddress.toLowerCase(),
              orderBy: "hourStartUnix",
              orderDirection: "desc",
              first: Math.min(hoursAgo, 1000), // Limit to prevent too much data
              where: {
                pair: pairAddress.toLowerCase(),
                hourStartUnix_gte: timestampFrom,
              },
            },
          }),
        });

        const data = await response.json();

        if (data.data?.pairHourDatas) {
          const hourDatas = data.data.pairHourDatas.reverse(); // Reverse to get chronological order
          
          const formattedData: PriceDataPoint[] = hourDatas.map((hourData: any) => {
            const timestamp = parseInt(hourData.hourStartUnix) * 1000;
            
            // Calculate price from reserves
            const reserve0 = parseFloat(hourData.reserve0);
            const reserve1 = parseFloat(hourData.reserve1);
            
            let price = 0;
            if (reserve0 > 0 && reserve1 > 0) {
              // Price = outputToken reserve / inputToken reserve
              price = isInverted ? (reserve0 / reserve1) : (reserve1 / reserve0);
              
              // Apply USDG decimal fix to historical price data
              price = fixUSDGPrice(price, outputToken.symbol);
            }
            
            return {
              timestamp,
              price: price || 0,
              volume: 0, // No volume data available in this schema
              date: new Date(timestamp).toISOString(),
              priceUSD: parseFloat(hourData.reserveUSD) || 0,
            };
          });

          setPriceData(formattedData);

          // Calculate 24h price change
          if (formattedData.length >= 2) {
            const latest = formattedData[formattedData.length - 1];
            const previous = formattedData[0];
            if (latest && previous && previous.price > 0) {
              const change = ((latest.price - previous.price) / previous.price) * 100;
              setPriceChange24h(change);
            }
          }
        } else {
          setPriceData([]);
        }
      } catch (err) {
        console.error("Error fetching price data:", err);
        setError("Failed to load price data");
        setPriceData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceData();
  }, [pairAddress, selectedRange, isInverted, inputToken, outputToken]);

  // Use only real data, no mock data
  const displayData = useMemo(() => {
    return priceData;
  }, [priceData]);

  const formatPrice = (price: number) => {
    // Apply USDG fix before formatting
    const correctedPrice = fixUSDGPrice(price, outputToken?.symbol || "");
    
    // For USDG prices, always show 4 decimal places and avoid scientific notation
    if (outputToken?.symbol === "USDG") {
      return correctedPrice.toFixed(4);
    }
    
    // For other tokens, use standard formatting
    if (correctedPrice < 0.0001) return correctedPrice.toExponential(3);
    if (correctedPrice < 0.01) return correctedPrice.toFixed(6);
    if (correctedPrice < 1) return correctedPrice.toFixed(4);
    return correctedPrice.toFixed(2);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
  };

  if (!inputToken || !outputToken) {
    return (
      <Card className={`border-white/10 bg-white/5 backdrop-blur-xl ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select trading pair to view price chart</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-white/10 bg-white/5 backdrop-blur-xl ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <TokenLogo token={inputToken} size="sm" />
              <span className="text-white font-medium">{inputToken.symbol}</span>
              <span className="text-gray-400">/</span>
              <TokenLogo token={outputToken} size="sm" />
              <span className="text-white font-medium">{outputToken.symbol}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-gray-400 hover:text-white"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {/* Price Info */}
        <div className="flex items-center space-x-4">
          <div>
            <div className="text-2xl font-bold text-white">
              {currentPrice ? formatPrice(currentPrice) : displayData.length > 0 ? formatPrice(displayData[displayData.length - 1].price) : "—"}
            </div>
            <div className="text-sm text-gray-400">
              {outputToken.symbol} per {inputToken.symbol}
            </div>
          </div>
          {priceChange24h !== null && !error && (
            <div className={`flex items-center space-x-1 ${priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange24h >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="font-medium">
                {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
              </span>
              <span className="text-xs text-gray-400">24h</span>
            </div>
          )}
          {error && (
            <div className="flex items-center space-x-1 text-yellow-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">No Data</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Time Range Selector */}
        <div className="flex space-x-1 mb-6 bg-white/5 rounded-lg p-1">
          {TIME_RANGES.map((range) => (
            <Button
              key={range.label}
              variant={selectedRange === range.label ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedRange(range.label)}
              className={`flex-1 text-xs ${
                selectedRange === range.label
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {range.label}
            </Button>
          ))}
        </div>

        {/* Chart */}
        <div className="h-64 mb-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-400">
              <div className="text-center">
                <p className="text-sm">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="mt-2 text-gray-400 hover:text-white"
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : displayData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-base font-medium mb-2">No price data available</p>
                <p className="text-sm opacity-70">
                  {error || `No trading pair found for ${inputToken?.symbol || ''}/${outputToken?.symbol || ''}`}
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    if (selectedRange === "1H") return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    if (selectedRange === "1D") return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    if (selectedRange === "7D") return date.toLocaleDateString([], { weekday: 'short' });
                    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                  }}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis
                  domain={['dataMin * 0.95', 'dataMax * 1.05']}
                  tickFormatter={formatPrice}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    backdropFilter: 'blur(10px)',
                  }}
                  formatter={(value: number, name: string) => [
                    formatPrice(value),
                    `${outputToken.symbol} per ${inputToken.symbol}`,
                  ]}
                  labelFormatter={(value: number) => {
                    const date = new Date(value);
                    return formatDistance(date, new Date(), { addSuffix: true });
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stats */}
        {displayData.length > 0 && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400">24h Volume</div>
              <div className="text-white font-medium">
                {formatVolume(displayData.reduce((sum, d) => sum + d.volume, 0) / displayData.length)}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Last Updated</div>
              <div className="text-white font-medium flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>
                  {formatDistance(new Date(displayData[displayData.length - 1]?.timestamp || Date.now()), new Date(), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}