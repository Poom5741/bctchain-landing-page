import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { TradingInterface } from "@/components/trading-interface";
import { PoolInterface } from "@/components/pool-interface";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpDown, Droplets } from "lucide-react";
import { WalletProvider } from "@/contexts/wallet-context";

export default function TradePage() {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        <main className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-white mb-4">
                  BCT DEX - Decentralized Exchange
                </h1>
                <p className="text-gray-400 text-lg">
                  Trade assets and provide liquidity on BCTChain
                </p>
              </div>

              <Tabs defaultValue="trade" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/5 border border-white/10">
                  <TabsTrigger
                    value="trade"
                    className="flex items-center space-x-2 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    <span>Trade</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="pools"
                    className="flex items-center space-x-2 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                  >
                    <Droplets className="w-4 h-4" />
                    <span>Liquidity Pools</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="trade">
                  <TradingInterface />
                </TabsContent>

                <TabsContent value="pools">
                  <PoolInterface />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </WalletProvider>
  );
}
