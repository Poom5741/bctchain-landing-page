"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, RefreshCw, TrendingUp } from "lucide-react"
import {
  getBlockchainStats,
  getLatestTransactions,
  formatNumber,
  formatTimeAgo,
  formatHash,
  type Transaction,
  type BlockchainStats,
} from "@/lib/api"

export function LiveNetwork() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [stats, setStats] = useState<BlockchainStats | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Fetch blockchain data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch stats and transactions in parallel
        const [statsData, txData] = await Promise.all([getBlockchainStats(), getLatestTransactions(6)])

        setStats(statsData)
        setTransactions(txData)
        setLastUpdate(new Date())
      } catch (error) {
        console.error("Error fetching live data:", error)
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchData()

    // Set up polling every 30 seconds
    const interval = setInterval(fetchData, 30000)

    return () => clearInterval(interval)
  }, [])

  const statsData = stats
    ? [
        {
          label: "TVL",
          value: stats.tvl,
          change: "+12.3%",
          isPositive: true,
          color: "blue",
          description: "Total Value Locked",
        },
        {
          label: "24h Volume",
          value: stats.volume24h,
          change: "+5.7%",
          isPositive: true,
          color: "purple",
          description: "24 Hour Volume",
        },
        {
          label: "Assets",
          value: formatNumber(stats.totalAssets),
          change: "+2.1%",
          isPositive: true,
          color: "pink",
          description: "Total Assets",
        },
        {
          label: "Users",
          value: formatNumber(stats.activeUsers),
          change: "+8.9%",
          isPositive: true,
          color: "green",
          description: "Active Users",
        },
      ]
    : [
        {
          label: "TVL",
          value: "$0",
          change: "+0%",
          isPositive: true,
          color: "blue",
          description: "Total Value Locked",
        },
        {
          label: "24h Volume",
          value: "$0",
          change: "+0%",
          isPositive: true,
          color: "purple",
          description: "24 Hour Volume",
        },
        { label: "Assets", value: "0", change: "+0%", isPositive: true, color: "pink", description: "Total Assets" },
        { label: "Users", value: "0", change: "+0%", isPositive: true, color: "green", description: "Active Users" },
      ]

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div className="animate-in fade-in-0 slide-in-from-left-8 duration-1000">
              <h2 className="text-4xl font-bold text-white mb-2">Live Network Activity</h2>
              <p className="text-gray-400">Real-time insights into the BCTChain ecosystem</p>
            </div>
            <div className="flex items-center mt-4 md:mt-0 text-sm text-gray-400 animate-in fade-in-0 slide-in-from-right-8 duration-1000">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Last updated: {lastUpdate.toLocaleTimeString()}
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
                    <div className="text-sm font-medium text-gray-400" title={stat.description}>
                      {stat.label}
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1 text-green-400" />
                      <div className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                        {stat.change}
                      </div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                    {loading ? <div className="animate-pulse bg-gray-600 h-8 w-20 rounded"></div> : stat.value}
                  </div>
                  <div
                    className={`h-1 w-full bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600 rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-300`}
                  ></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Stats Row */}
          {stats && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-in fade-in-0 slide-in-from-bottom-6 duration-1000 delay-300">
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-white mb-1">{formatNumber(stats.blockHeight)}</div>
                  <div className="text-sm text-gray-400">Block Height</div>
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-white mb-1">{formatNumber(stats.totalTransactions)}</div>
                  <div className="text-sm text-gray-400">Total Transactions</div>
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-white mb-1">{formatNumber(stats.totalAddresses)}</div>
                  <div className="text-sm text-gray-400">Total Addresses</div>
                </CardContent>
              </Card>
            </div>
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
                  // Loading skeleton
                  Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-6 animate-pulse">
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
                            tx.type === "Bridge" || tx.type === "Transfer"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          }`}
                        >
                          {tx.type === "Bridge" || tx.type === "Transfer" ? (
                            <ArrowDownRight className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">
                            {tx.type}
                          </div>
                          <div className="text-xs text-gray-400">{formatHash(tx.hash)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono text-gray-400 group-hover:text-white transition-colors">
                          Block {tx.block}
                        </div>
                        <div className="text-xs text-gray-500">{formatTimeAgo(tx.timestamp)} ago</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-400">No recent transactions available</div>
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
  )
}
