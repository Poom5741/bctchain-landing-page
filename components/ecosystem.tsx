import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Link2, Coins, TrendingUp, Wallet } from "lucide-react"

export function Ecosystem() {
  const ecosystemItems = [
    {
      icon: Link2,
      title: "Bridge BTC",
      description: "Move your Bitcoin on-chain safely with cryptographic proofs.",
      link: "#bridge",
      color: "blue",
    },
    {
      icon: Coins,
      title: "Mint Synths",
      description: "Create synthetic assets: sBTC, sETH, sUSD—fully collateralized.",
      link: "#mint",
      color: "purple",
    },
    {
      icon: TrendingUp,
      title: "Trade Assets",
      description: "Access global markets 24/7 with deep liquidity and low fees.",
      link: "#trade",
      color: "pink",
    },
    {
      icon: Wallet,
      title: "Earn Yield",
      description: "Provide liquidity and earn rewards through staking and farming.",
      link: "#earn",
      color: "green",
    },
  ]

  return (
    <section className="py-20 relative">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-in fade-in-0 slide-in-from-bottom-8 duration-1000">
            <h2 className="text-4xl font-bold text-white mb-4">Complete DeFi Ecosystem</h2>
            <p className="text-gray-400 text-lg">Everything you need for synthetic asset management</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ecosystemItems.map((item, index) => (
              <Card
                key={index}
                className="group border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-in fade-in-0 slide-in-from-bottom-6 duration-1000"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <CardContent className="p-6 relative overflow-hidden">
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative">
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-r from-${item.color}-500/20 to-${item.color}-600/20 border border-${item.color}-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <item.icon
                        className={`w-6 h-6 text-${item.color}-400 group-hover:text-white transition-colors duration-300`}
                      />
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors duration-300">
                      {item.title}
                    </h3>

                    <p className="text-gray-400 mb-4 text-sm leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                      {item.description}
                    </p>

                    <a
                      href={item.link}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-all duration-300 inline-flex items-center group/link"
                    >
                      Learn more{" "}
                      <ArrowRight className="ml-1 w-3 h-3 group-hover/link:translate-x-1 transition-transform duration-300" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
