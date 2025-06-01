import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { TradingInterface } from "@/components/trading-interface"

export default function TradePage() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        <main className="py-20">
          <TradingInterface />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  )
}
