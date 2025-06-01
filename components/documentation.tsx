"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Book, Search, Code, Shield, Zap, Users, ExternalLink, ChevronRight, FileText, Globe, Lock } from "lucide-react"

export function Documentation() {
  const [searchQuery, setSearchQuery] = useState("")

  const docSections = [
    {
      title: "Getting Started",
      icon: Book,
      description: "Learn the basics of BCTChain and synthetic assets",
      articles: [
        "What is BCTChain?",
        "Understanding Synthetic Assets",
        "Setting up your Wallet",
        "Your First Transaction",
      ],
    },
    {
      title: "Trading Guide",
      icon: Zap,
      description: "Master synthetic asset trading",
      articles: ["How to Trade", "Understanding Fees", "Slippage Protection", "Advanced Orders"],
    },
    {
      title: "Security",
      icon: Shield,
      description: "Keep your assets safe",
      articles: ["Security Best Practices", "Audit Reports", "Risk Management", "Emergency Procedures"],
    },
    {
      title: "Developer Resources",
      icon: Code,
      description: "Build on BCTChain",
      articles: ["API Documentation", "Smart Contracts", "SDK Reference", "Integration Guide"],
    },
    {
      title: "Governance",
      icon: Users,
      description: "Participate in protocol governance",
      articles: ["Voting Process", "Proposal Creation", "Delegation", "Governance Token"],
    },
    {
      title: "Protocol Details",
      icon: Globe,
      description: "Deep dive into the protocol",
      articles: ["Architecture Overview", "Consensus Mechanism", "Tokenomics", "Roadmap"],
    },
  ]

  const quickLinks = [
    { title: "Whitepaper", icon: FileText, href: "#" },
    { title: "API Reference", icon: Code, href: "#" },
    { title: "Security Audits", icon: Lock, href: "#" },
    { title: "GitHub Repository", icon: ExternalLink, href: "#" },
  ]

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in-0 slide-in-from-bottom-8 duration-1000">
          <h1 className="text-5xl font-bold text-white mb-4">Documentation</h1>
          <p className="text-gray-400 text-lg mb-8">Everything you need to know about BCTChain and synthetic assets</p>

          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          {quickLinks.map((link, index) => (
            <Card
              key={index}
              className="border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 cursor-pointer"
            >
              <CardContent className="p-6 text-center">
                <link.icon className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <h3 className="text-white font-medium">{link.title}</h3>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Documentation Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {docSections.map((section, index) => (
            <Card
              key={index}
              className="border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-500 hover:scale-105 animate-in fade-in-0 slide-in-from-bottom-6 duration-1000"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <section.icon className="w-5 h-5 mr-3 text-blue-400" />
                  {section.title}
                </CardTitle>
                <p className="text-gray-400 text-sm">{section.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.articles.map((article, articleIndex) => (
                    <div
                      key={articleIndex}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                    >
                      <span className="text-gray-300 group-hover:text-white transition-colors">{article}</span>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-16">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Need More Help?</h2>
              <p className="text-gray-400 mb-6">
                Can't find what you're looking for? Our community and support team are here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                  Join Discord Community
                </Button>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
