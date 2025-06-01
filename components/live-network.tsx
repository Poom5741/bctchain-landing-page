"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  TrendingUp,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  getBlockchainStats,
  getLatestTransactions,
  formatNumber,
  formatTimeAgo,
  formatHash,
  type Transaction,
  type BlockchainStats,
} from "@/lib/api";

export function LiveNetwork() {
  const [stats, setStats] = useState<BlockchainStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const [statsData, txData] = await Promise.allSettled([
          getBlockchainStats(),
          getLatestTransactions(6),
        ]);

        if (statsData.status === "fulfilled") {
          setStats(statsData.value);
        } else {
          // Set default stats if fetch failed
          setStats({
            totalBlocks: 0,
            totalTransactions: 0,
            totalAssets: 0,
            networkHealth: "offline",
            blockTime: 0,
            validators: 0,
            tvl: "Network Offline",
            volume24h: "Network Offline",
            activeUsers: 0,
            totalAddresses: 0,
            marketCap: "Network Offline",
            isConnected: false,
            gasUsedToday: "0",
            transactionsToday: 0,
            networkUtilization: 0,
            gasPrices: { slow: 0.01, average: 0.01, fast: 0.01 },
          });
        }

        if (txData.status === "fulfilled") {
          setTransactions(txData.value);
        } else {
          // Set empty transactions if fetch failed
          setTransactions([]);
        }

        setLastUpdate(new Date());
      } catch (error) {
        // Silently handle any remaining errors
        // Set fallback data
        setStats({
          totalBlocks: 0,
          totalTransactions: 0,
          totalAssets: 0,
          networkHealth: "offline",
          blockTime: 0,
          validators: 0,
          tvl: "Network Offline",
          volume24h: "Network Offline",
          activeUsers: 0,
          totalAddresses: 0,
          marketCap: "Network Offline",
          isConnected: false,
          gasUsedToday: "0",
          transactionsToday: 0,
          networkUtilization: 0,
          gasPrices: { slow: 0.01, average: 0.01, fast: 0.01 },
        });
        setTransactions([]);
        setLastUpdate(new Date());
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [mounted]);

  const getConnectionStatus = () => {
    if (!stats)
      return { icon: WifiOff, text: "Connecting...", color: "text-yellow-400" };
    if (!stats.isConnected)
      return { icon: WifiOff, text: "Network Offline", color: "text-red-400" };
    return { icon: Wifi, text: "Connected", color: "text-green-400" };
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="py-20 min-h-[800px] animate-pulse bg-white/5 rounded-xl" />
    );
  }

  const connectionStatus = getConnectionStatus();

  const statsData = stats
    ? [
        {
          label: "TVL",
          value: stats.tvl,
          change: stats.isConnected ? "+12.3%" : "—",
          isPositive: true,
          color: "blue",
          description: "Total Value Locked",
        },
        {
          label: "24h Volume",
          value: stats.volume24h,
          change: stats.isConnected ? "+5.7%" : "—",
          isPositive: true,
          color: "purple",
          description: "24 Hour Volume",
        },
        {
          label: "Assets",
          value: stats.isConnected
            ? formatNumber(stats.totalAssets)
            : "Connecting...",
          change: stats.isConnected ? "+2.1%" : "—",
          isPositive: true,
          color: "pink",
          description: "Total Assets",
        },
        {
          label: "Users",
          value: stats.isConnected
            ? formatNumber(stats.activeUsers)
            : "Connecting...",
          change: stats.isConnected ? "+8.9%" : "—",
          isPositive: true,
          color: "green",
          description: "Active Users",
        },
      ]
    : [
        {
          label: "TVL",
          value: "Connecting...",
          change: "—",
          isPositive: true,
          color: "blue",
          description: "Total Value Locked",
        },
        {
          label: "24h Volume",
          value: "Connecting...",
          change: "—",
          isPositive: true,
          color: "purple",
          description: "24 Hour Volume",
        },
        {
          label: "Assets",
          value: "Connecting...",
          change: "—",
          isPositive: true,
          color: "pink",
          description: "Total Assets",
        },
        {
          label: "Users",
          value: "Connecting...",
          change: "—",
          isPositive: true,
          color: "green",
          description: "Active Users",
        },
      ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div className="animate-in fade-in-0 slide-in-from-left-8 duration-1000">
              <h2 className="text-4xl font-bold text-white mb-2">
                Live Network Activity
              </h2>
              <p className="text-gray-400">
                Real-time insights into the BCTChain ecosystem
              </p>
            </div>
            <div className="flex items-center mt-4 md:mt-0 text-sm text-gray-400 animate-in fade-in-0 slide-in-from-right-8 duration-1000">
              <connectionStatus.icon
                className={`w-4 h-4 mr-2 ${connectionStatus.color}`}
              />
              <span className={connectionStatus.color}>
                {connectionStatus.text}
              </span>
              <span className="mx-2">•</span>
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Last updated: {lastUpdate?.toLocaleTimeString() ?? "Just now"}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {statsData.map((stat, index) => (
              <Card
                key={index}
                className="group border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-in fade-in-0 slide-in-from-bottom-4 duration-1000"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="text-sm font-medium text-gray-400"
                      title={stat.description}
                    >
                      {stat.label}
                    </div>
                    {stat.change !== "—" && (
                      <div className="flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1 text-green-400" />
                        <div className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                          {stat.change}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-3xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                    {loading ? (
                      <div className="animate-pulse bg-gray-600 h-8 w-20 rounded"></div>
                    ) : (
                      stat.value
                    )}
                  </div>
                  <div
                    className={`h-1 w-full bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600 rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-300`}
                  ></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Stats Row */}
          {stats && stats.isConnected && !loading && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-in fade-in-0 slide-in-from-bottom-6 duration-1000 delay-300">
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {formatNumber(stats.totalBlocks)}
                    </div>
                    <div className="text-sm text-gray-400">Total Blocks</div>
                  </CardContent>
                </Card>
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {formatNumber(stats.totalTransactions)}
                    </div>
                    <div className="text-sm text-gray-400">
                      Total Transactions
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {formatNumber(stats.totalAddresses)}
                    </div>
                    <div className="text-sm text-gray-400">Total Addresses</div>
                  </CardContent>
                </Card>
              </div>

              {/* New metrics row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 animate-in fade-in-0 slide-in-from-bottom-6 duration-1000 delay-500">
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {formatNumber(stats.transactionsToday)}
                    </div>
                    <div className="text-sm text-gray-400">
                      Transactions Today
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {stats.gasUsedToday}
                    </div>
                    <div className="text-sm text-gray-400">
                      Gas Used Today (Gwei)
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {stats.networkUtilization.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-400">
                      Network Utilization
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {stats.blockTime.toFixed(1)}s
                    </div>
                    <div className="text-sm text-gray-400">Avg Block Time</div>
                  </CardContent>
                </Card>
              </div>

              {/* Gas Prices */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl mb-12 animate-in fade-in-0 slide-in-from-bottom-6 duration-1000 delay-700">
                <CardHeader className="border-b border-white/10">
                  <CardTitle className="text-white">
                    Current Gas Prices
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-green-400 text-lg font-bold mb-1">
                        {stats.gasPrices.slow} Gwei
                      </div>
                      <div className="text-sm text-gray-400">Slow</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-400 text-lg font-bold mb-1">
                        {stats.gasPrices.average} Gwei
                      </div>
                      <div className="text-sm text-gray-400">Standard</div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-400 text-lg font-bold mb-1">
                        {stats.gasPrices.fast} Gwei
                      </div>
                      <div className="text-sm text-gray-400">Fast</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Live Feed */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-500 animate-in fade-in-0 slide-in-from-bottom-8 duration-1000 delay-500">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center justify-between text-white">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                  Recent Transactions
                </span>
                <div className="flex items-center text-xs text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Live
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/10">
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-6 animate-pulse"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
                        <div>
                          <div className="w-16 h-4 bg-gray-600 rounded mb-2"></div>
                          <div className="w-24 h-3 bg-gray-600 rounded"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="w-20 h-3 bg-gray-600 rounded mb-2"></div>
                        <div className="w-12 h-3 bg-gray-600 rounded"></div>
                      </div>
                    </div>
                  ))
                ) : transactions.length > 0 ? (
                  transactions.map((tx, index) => (
                    <div
                      key={tx.hash}
                      className="flex items-center justify-between p-6 hover:bg-white/5 transition-all duration-300 group animate-in fade-in-0 slide-in-from-left-4 duration-700"
                      style={{ animationDelay: `${index * 100 + 600}ms` }}
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
                            tx.type === "Transfer"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          }`}
                        >
                          {tx.type === "Transfer" ? (
                            <ArrowDownRight className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">
                            {tx.type}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatHash(tx.hash)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono text-gray-400 group-hover:text-white transition-colors">
                          Block {tx.block}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTimeAgo(tx.timestamp)} ago
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                      <ArrowUpRight className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      Awaiting Network Activity
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Transactions will appear here once the network connection
                      is established
                    </p>
                  </div>
                )}
              </div>
              <div className="p-6 text-center border-t border-white/10">
                <a
                  href="https://scan.bctchain.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 transition-all duration-300 inline-flex items-center group"
                >
                  View all transactions{" "}
                  <ArrowUpRight className="ml-1 w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
