import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { Documentation } from "@/components/documentation"

export default function DocsPage() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        <main className="py-20">
          <Documentation />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  )
}
