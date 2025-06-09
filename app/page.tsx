import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { LiveNetwork } from "@/components/live-network";
import { Features } from "@/components/features";
import { Ecosystem } from "@/components/ecosystem";
import { Community } from "@/components/community";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      <main>
        <HeroSection />
        <LiveNetwork />
        <Features />
        <Ecosystem />
        <Community />
      </main>
      <Footer />
    </div>
  );
}
