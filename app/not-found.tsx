import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { ErrorDisplay } from "@/components/error-display"

export default function NotFound() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        <main className="py-20">
          <ErrorDisplay code="404" message="The page you're looking for doesn't exist or has been moved." />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  )
}
