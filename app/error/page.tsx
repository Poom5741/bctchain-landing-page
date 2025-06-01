import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { ErrorDisplay } from "@/components/error-display"

export default function ErrorPage({
  searchParams,
}: {
  searchParams: { code?: string; message?: string }
}) {
  const errorCode = searchParams.code || "500"
  const errorMessage = searchParams.message || "Something went wrong"

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        <main className="py-20">
          <ErrorDisplay code={errorCode} message={errorMessage} />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  )
}
