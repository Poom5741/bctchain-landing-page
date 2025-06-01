import { Shield, Eye, Users, Zap, Globe, Lock } from "lucide-react"

export function Features() {
  const features = [
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Multi-layer security audits by leading firms. Battle-tested infrastructure.",
      color: "blue",
    },
    {
      icon: Eye,
      title: "Full Transparency",
      description: "Every transaction visible. Real-time tracking on our public explorer.",
      color: "purple",
    },
    {
      icon: Users,
      title: "DAO Governance",
      description: "Community-driven decisions. Democratic protocol evolution.",
      color: "pink",
    },
    {
      icon: Zap,
      title: "Instant Settlement",
      description: "Lightning-fast transactions with minimal fees and maximum efficiency.",
      color: "yellow",
    },
    {
      icon: Globe,
      title: "Global Access",
      description: "24/7 markets. Synthetic exposure to any asset, anywhere.",
      color: "green",
    },
    {
      icon: Lock,
      title: "Secure Custody",
      description: "Non-custodial design. You always control your assets.",
      color: "red",
    },
  ]

  return (
    <section className="py-20 relative">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse delay-300"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-in fade-in-0 slide-in-from-bottom-8 duration-1000">
            <h2 className="text-4xl font-bold text-white mb-4">Built for the Future of Finance</h2>
            <p className="text-gray-400 text-lg">Enterprise-grade infrastructure meets decentralized innovation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-in fade-in-0 slide-in-from-bottom-6 duration-1000"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Gradient border effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-sm"></div>

                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-7 h-7 text-blue-400 group-hover:text-white transition-colors duration-300" />
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-blue-300 transition-colors duration-300">
                    {feature.title}
                  </h3>

                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    {feature.description}
                  </p>

                  {/* Animated underline */}
                  <div className="h-0.5 w-0 bg-gradient-to-r from-blue-500 to-purple-500 mt-4 group-hover:w-full transition-all duration-500"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
