import { Button } from "@/components/ui/button"
import { Github, MessageCircle, Send, Twitter } from "lucide-react"

export function Community() {
  return (
    <section className="py-20 relative">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-purple-900/20 to-transparent"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-in fade-in-0 slide-in-from-bottom-8 duration-1000">
            <h2 className="text-4xl font-bold text-white mb-4">Join the Revolution</h2>
            <p className="text-gray-400 text-lg">
              BCTChain is community-driven. Help us build the future of decentralized finance.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex flex-wrap justify-center gap-4 mb-16 animate-in fade-in-0 slide-in-from-bottom-6 duration-1000 delay-200">
            <Button
              className="bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 text-[#1DA1F2] border border-[#1DA1F2]/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
              variant="outline"
            >
              <Twitter className="w-4 h-4 mr-2" />
              Twitter
            </Button>
            <Button
              className="bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#5865F2] border border-[#5865F2]/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
              variant="outline"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Discord
            </Button>
            <Button
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105"
              variant="outline"
            >
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </Button>
            <Button
              className="bg-[#0088cc]/20 hover:bg-[#0088cc]/30 text-[#0088cc] border border-[#0088cc]/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
              variant="outline"
            >
              <Send className="w-4 h-4 mr-2" />
              Telegram
            </Button>
          </div>

          {/* Governance Card */}
          <div className="relative group animate-in fade-in-0 slide-in-from-bottom-8 duration-1000 delay-400">
            {/* Gradient border */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 blur-sm"></div>

            <div className="relative p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-500">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 p-3">
                  <img src="/images/bctchain-logo.png" alt="BCTChain Logo" className="w-full h-full object-contain" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-4">Governance</h3>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  Participate in governance. Shape the future of synthetic finance. All proposals and voting records are
                  public and transparent.
                </p>

                <Button className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25">
                  <span className="relative z-10">Join Governance</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700"></div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
