"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import { getBlockchainStats, formatNumber, type BlockchainStats } from "@/lib/api"

export function HeroSection() {
  const [stats, setStats] = useState<BlockchainStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getBlockchainStats()
        setStats(data)
      } catch (error) {
        console.error("Error fetching hero stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()

    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>

        {/* Geometric shapes */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-ping delay-300"></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-ping delay-700"></div>
        <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping delay-1000"></div>

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-blue-300 text-sm font-medium mb-8 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
              <Sparkles className="w-4 h-4 mr-2" />
              Audited & Secure Protocol
            </div>

            {/* Main heading */}
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-8 tracking-tight animate-in fade-in-0 slide-in-from-bottom-6 duration-1000 delay-200">
              The Financial Layer for{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x">
                  Synthetic Assets
                </span>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-lg blur opacity-20 animate-pulse"></div>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-300 mb-12 leading-relaxed max-w-3xl animate-in fade-in-0 slide-in-from-bottom-8 duration-1000 delay-400">
              Bridge Bitcoin, mint transparent synthetic assets, and unlock global financial markets—all on BCTChain.
              Built for institutions, designed for everyone.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in-0 slide-in-from-bottom-10 duration-1000 delay-600">
              <Button
                size="lg"
                className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
              >
                <span className="relative z-10 flex items-center">
                  Start Bridging
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700"></div>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:border-white/40"
                asChild
              >
                <a href="https://scan.bctchain.com" target="_blank" rel="noopener noreferrer">
                  Explore Network
                </a>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-20 w-full max-w-4xl mx-auto animate-in fade-in-0 slide-in-from-bottom-12 duration-1000 delay-800">
              <div className="text-center group">
                <div className="text-4xl font-bold text-white mb-2 transition-all duration-300 group-hover:scale-110">
                  {loading ? (
                    <div className="animate-pulse bg-gray-600 h-10 w-20 rounded mx-auto"></div>
                  ) : (
                    stats?.tvl || "$0"
                  )}
                </div>
                <div className="text-sm text-gray-400">Total Value Locked</div>
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-bold text-white mb-2 transition-all duration-300 group-hover:scale-110">
                  {loading ? (
                    <div className="animate-pulse bg-gray-600 h-10 w-16 rounded mx-auto"></div>
                  ) : (
                    formatNumber(stats?.totalAssets || 0)
                  )}
                </div>
                <div className="text-sm text-gray-400">Synthetic Assets</div>
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-purple-500 to-transparent mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-bold text-white mb-2 transition-all duration-300 group-hover:scale-110">
                  {stats?.networkHealth === "healthy" ? "99.9%" : "Unknown"}
                </div>
                <div className="text-sm text-gray-400">Uptime</div>
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-pink-500 to-transparent mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
